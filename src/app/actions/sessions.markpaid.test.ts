/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'

let rpcCall: any = null
const mockClient = {
  rpc(name: string, args: any) {
    rpcCall = { name, args }
    return Promise.resolve({ data: 3, error: null })
  },
}

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => mockClient }))
vi.mock('@/lib/actions/helpers', () => ({
  requirePermission: async () => null,
  handleSupabaseError: () => null,
  revalidateSessionPaths: () => {},
}))
vi.mock('@/lib/square/auto-send', () => ({ autoSendInvoicesViaSquare: async () => ({ sent: 0 }) }))
vi.mock('@/lib/invoices/send', () => ({ sendInvoiceById: async () => ({ success: true }) }))
vi.mock('@/lib/logger', () => ({ logger: { error: () => {}, info: () => {}, warn: () => {} } }))
vi.mock('@/lib/actions/session-invoice-cleanup', () => ({
  deletePendingSessionInvoices: async () => ({ error: null }),
  hasBilledSessionInvoice: async () => false,
}))

import { markSessionsPaid } from './sessions'

describe('markSessionsPaid (regression for #27 — atomic payroll mark-paid)', () => {
  it('calls the mark_sessions_paid RPC and returns the count', async () => {
    rpcCall = null
    const result = await markSessionsPaid(['s1', 's2'], '2026-06-10')
    expect(result).toEqual({ success: true, count: 3 })
    expect(rpcCall.name).toBe('mark_sessions_paid')
    expect(rpcCall.args).toEqual({ p_ids: ['s1', 's2'], p_paid_date: '2026-06-10' })
  })

  it('returns count 0 for an empty set without calling the RPC', async () => {
    rpcCall = null
    const result = await markSessionsPaid([], '2026-06-10')
    expect(result).toEqual({ success: true, count: 0 })
    expect(rpcCall).toBeNull()
  })
})
