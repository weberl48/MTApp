/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

let capturedInsert: any = null

const mockClient = {
  from() {
    return {
      insert(payload: any) {
        capturedInsert = payload
        return { select: () => ({ single: async () => ({ data: { id: 'c1' }, error: null }) }) }
      },
    }
  },
}

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => mockClient }))
vi.mock('@/lib/actions/helpers', () => ({
  requirePermission: async () => null,
  handleSupabaseError: () => null,
  revalidateClientPaths: () => {},
}))

import { addClient } from './clients'

const TEST_KEY = 'a'.repeat(64)
beforeAll(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY
})
afterAll(() => {
  delete process.env.ENCRYPTION_KEY
})

describe('addClient (regression for #37 — client notes encrypted at rest)', () => {
  it('encrypts notes before storing them', async () => {
    capturedInsert = null
    const result = await addClient({
      name: 'Test',
      payment_method: 'private_pay',
      notes: 'sensitive clinical note',
      organization_id: 'o1',
    })
    expect(result).toEqual({ success: true, clientId: 'c1' })
    expect(capturedInsert.notes).toBeTruthy()
    expect(capturedInsert.notes).not.toBe('sensitive clinical note')
    expect(capturedInsert.notes.startsWith('enc:')).toBe(true)
  })

  it('stores empty notes as null', async () => {
    capturedInsert = null
    await addClient({ name: 'Test', payment_method: 'private_pay', notes: '', organization_id: 'o1' })
    expect(capturedInsert.notes).toBeNull()
  })
})
