/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { createNewSession } from './create-session'

describe('createNewSession (regression for #22 — orphaned session on attendee failure)', () => {
  it('deletes the just-created session if the attendees insert fails', async () => {
    const deleted: string[] = []
    const mockSupabase: any = {
      from(table: string) {
        if (table === 'sessions') {
          return {
            insert: () => ({ select: () => ({ single: async () => ({ data: { id: 's1' }, error: null }) }) }),
            delete: () => ({
              eq: (_col: string, val: string) => {
                deleted.push(val)
                return Promise.resolve({ error: null })
              },
            }),
          }
        }
        if (table === 'session_attendees') {
          return { insert: async () => ({ error: { message: 'attendee fail' } }) }
        }
        return {}
      },
    }

    await expect(
      createNewSession({
        supabase: mockSupabase,
        date: '2026-06-10',
        time: '09:00',
        durationMinutes: 30,
        serviceTypeId: 'st1',
        contractorId: 'con1',
        organizationId: 'o1',
        clientIds: ['c1'],
        encryptedNotes: null,
        encryptedClientNotes: null,
        status: 'submitted',
        groupHeadcount: null,
        groupMemberNames: null,
        classroom: null,
        pricing: { totalAmount: 60, perPersonCost: 60, mcaCut: 18, contractorPay: 42, rentAmount: 0 },
      })
    ).rejects.toBeTruthy()

    // The orphaned session must have been cleaned up.
    expect(deleted).toContain('s1')
  })
})
