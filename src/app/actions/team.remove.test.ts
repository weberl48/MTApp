/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const state: any = {}

function sessionClient() {
  let usersSelectCall = 0
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'caller1' } } }) },
    from(table: string) {
      if (table === 'users') {
        return {
          select: () => {
            usersSelectCall++
            const data =
              usersSelectCall === 1
                ? { role: 'owner', organization_id: 'o1' } // currentUser
                : { role: 'contractor', name: 'Removed Person' } // memberToRemove
            return { eq: () => ({ single: async () => ({ data, error: null }) }) }
          },
          // The session-scoped client must NOT be used for the delete (RLS has no DELETE
          // policy, so it silently deletes 0 rows — the original bug). Flag it if used.
          delete: () => {
            state.sessionDeleteUsed = true
            return { eq: () => Promise.resolve({ error: null, count: 0 }) }
          },
        }
      }
      if (table === 'sessions') {
        return { select: () => ({ eq: () => Promise.resolve({ count: 0 }) }) }
      }
      return {}
    },
  }
}

function serviceClient() {
  return {
    from(table: string) {
      if (table === 'users') {
        return {
          delete: () => {
            const filters: Array<[string, unknown]> = []
            state.serviceDeleteUsed = true
            const chain: any = {
              eq: (col: string, val: unknown) => {
                filters.push([col, val])
                state.serviceDeleteFilters = filters
                return chain
              },
              then: (resolve: (v: { error: null; count: number }) => unknown) =>
                resolve({ error: null, count: 1 }),
            }
            return chain
          },
        }
      }
      return {}
    },
    auth: {
      admin: {
        deleteUser: async (id: string) => {
          state.authDeletedUserId = id
        },
      },
    },
  }
}

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => sessionClient() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: () => serviceClient() }))
vi.mock('@/lib/actions/helpers', () => ({
  handleSupabaseError: () => null,
  revalidateTeamPaths: () => {},
}))
vi.mock('@/lib/logger', () => ({ logger: { error: () => {}, info: () => {}, warn: () => {} } }))

import { removeTeamMember } from './team'

describe('removeTeamMember (regression for #13 — reported success but deleted nothing)', () => {
  beforeEach(() => {
    for (const k of Object.keys(state)) delete state[k]
  })

  it('deletes via the service-role client, scopes by org, and removes the auth identity', async () => {
    const result = await removeTeamMember('member1')
    expect(result).toEqual({ success: true })
    expect(state.serviceDeleteUsed).toBe(true) // service role used (users has no DELETE RLS policy)
    expect(state.sessionDeleteUsed).toBeUndefined() // not the silently-failing session client
    expect(state.serviceDeleteFilters).toContainEqual(['id', 'member1'])
    expect(state.serviceDeleteFilters).toContainEqual(['organization_id', 'o1'])
    expect(state.authDeletedUserId).toBe('member1')
  })
})
