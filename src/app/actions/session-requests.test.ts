/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { encryptField } from '@/lib/crypto'

let encNote = ''

const mockClient = {
  auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
  from(table: string) {
    if (table === 'users') {
      return { select: () => ({ eq: () => ({ single: async () => ({ data: { organization_id: 'o1' } }) }) }) }
    }
    if (table === 'session_requests') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: async () => ({
                data: [{ id: 'r1', notes: encNote, client: { id: 'c1', name: 'X' } }],
              }),
            }),
          }),
        }),
      }
    }
    return {}
  },
}

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => mockClient }))

import { getPendingSessionRequests } from './session-requests'

const TEST_KEY = 'a'.repeat(64)
beforeAll(async () => {
  process.env.ENCRYPTION_KEY = TEST_KEY
  encNote = await encryptField('client says: mornings preferred')
})
afterAll(() => {
  delete process.env.ENCRYPTION_KEY
})

describe('getPendingSessionRequests (regression for #39 — decrypt session-request notes)', () => {
  it('returns the client-submitted notes decrypted for staff', async () => {
    expect(encNote.startsWith('enc:')).toBe(true)
    const result = await getPendingSessionRequests()
    expect(result).toHaveLength(1)
    expect(result[0].notes).toBe('client says: mornings preferred')
  })
})
