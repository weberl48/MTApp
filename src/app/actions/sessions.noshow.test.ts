/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Captures what the action writes.
const captured: {
  sessionUpdate?: any
  invoiceUpdates: Array<{ id: unknown; payload: any }>
} = {
  invoiceUpdates: [],
}

// The set of PENDING invoices the mock returns for the session (tests reassign this).
let pendingInvoices: Array<{ id: string }> = [{ id: 'inv1' }]

// $60 base, 30% MCA → normal 30-min contractor pay = $42, MCA = $18.
const SERVICE_TYPE = {
  id: 'st1',
  base_rate: 60,
  per_person_rate: 0,
  mca_percentage: 30,
  contractor_cap: null,
  total_cap: null,
  scholarship_rate: null,
  contractor_pay_schedule: null,
  group_contractor_pay: null,
}

function makeClient() {
  return {
    from(table: string) {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    id: 's1',
                    organization_id: 'o1',
                    contractor_id: 'c1',
                    service_type_id: 'st1',
                    service_type: SERVICE_TYPE,
                  },
                  error: null,
                }),
            }),
          }),
          update: (payload: any) => {
            captured.sessionUpdate = payload
            return { eq: () => Promise.resolve({ error: null }) }
          },
        }
      }
      if (table === 'organizations') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { settings: { pricing: { no_show_fee: 60 } } }, error: null }),
            }),
          }),
        }
      }
      if (table === 'contractor_rates') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }),
        }
      }
      if (table === 'invoices') {
        return {
          // Fetch the PENDING linked invoices for the session.
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: pendingInvoices, error: null }),
              }),
            }),
          }),
          // Per-invoice reprice: update(payload).eq('id', invoiceId)
          update: (payload: any) => ({
            eq: (_col: string, val: unknown) => {
              captured.invoiceUpdates.push({ id: val, payload })
              return Promise.resolve({ error: null })
            },
          }),
        }
      }
      return {}
    },
  }
}

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => makeClient() }))
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

import { markSessionNoShow } from './sessions'

const sum = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) * 100) / 100

describe('markSessionNoShow (regression for #5 — no-show reprices to the fee)', () => {
  beforeEach(() => {
    captured.sessionUpdate = undefined
    captured.invoiceUpdates = []
    pendingInvoices = [{ id: 'inv1' }]
  })

  it("sets status='no_show' and reprices the session to the no-show fee (contractor keeps normal pay)", async () => {
    const result = await markSessionNoShow('s1')
    expect(result).toEqual({ success: true })
    expect(captured.sessionUpdate.status).toBe('no_show')
    expect(captured.sessionUpdate.total_amount).toBe(60) // flat no-show fee
    expect(captured.sessionUpdate.contractor_pay).toBe(42) // normal 30-min pay
    expect(captured.sessionUpdate.mca_cut).toBe(18)
  })

  it('reprices the single PENDING linked invoice to the full fee', async () => {
    await markSessionNoShow('s1')
    expect(captured.invoiceUpdates).toHaveLength(1)
    expect(captured.invoiceUpdates[0].id).toBe('inv1')
    expect(captured.invoiceUpdates[0].payload.amount).toBe(60)
    expect(captured.invoiceUpdates[0].payload.contractor_pay).toBe(42)
    expect(captured.invoiceUpdates[0].payload.mca_cut).toBe(18)
  })

  it('SPLITS the fee across multiple pending invoices (no double-billing)', async () => {
    pendingInvoices = [{ id: 'a' }, { id: 'b' }]
    await markSessionNoShow('s1')
    expect(captured.invoiceUpdates).toHaveLength(2)
    // Shares must SUM to the fee, not equal the full fee on each invoice.
    expect(sum(captured.invoiceUpdates.map((u) => u.payload.amount))).toBe(60)
    expect(sum(captured.invoiceUpdates.map((u) => u.payload.contractor_pay))).toBe(42)
    expect(sum(captured.invoiceUpdates.map((u) => u.payload.mca_cut))).toBe(18)
  })
})
