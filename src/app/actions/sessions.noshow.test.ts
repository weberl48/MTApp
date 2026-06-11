/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Captures what the action writes.
const captured: { sessionUpdate?: any; invoiceUpdate?: any; invoiceFilters: Array<[string, unknown]> } = {
  invoiceFilters: [],
}

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
          update: (payload: any) => {
            captured.invoiceUpdate = payload
            const chain: any = {
              eq: (col: string, val: unknown) => {
                captured.invoiceFilters.push([col, val])
                return chain
              },
              then: (resolve: (v: { error: null }) => unknown) => resolve({ error: null }),
            }
            return chain
          },
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

describe('markSessionNoShow (regression for #5 — no-show reprices to the fee)', () => {
  beforeEach(() => {
    captured.sessionUpdate = undefined
    captured.invoiceUpdate = undefined
    captured.invoiceFilters = []
  })

  it("sets status='no_show' and reprices the session to the no-show fee (contractor keeps normal pay)", async () => {
    const result = await markSessionNoShow('s1')
    expect(result).toEqual({ success: true })
    expect(captured.sessionUpdate.status).toBe('no_show')
    expect(captured.sessionUpdate.total_amount).toBe(60) // flat no-show fee
    expect(captured.sessionUpdate.contractor_pay).toBe(42) // normal 30-min pay
    expect(captured.sessionUpdate.mca_cut).toBe(18)
  })

  it('reprices only the PENDING linked invoice', async () => {
    await markSessionNoShow('s1')
    expect(captured.invoiceUpdate.amount).toBe(60)
    expect(captured.invoiceUpdate.contractor_pay).toBe(42)
    expect(captured.invoiceFilters).toContainEqual(['session_id', 's1'])
    expect(captured.invoiceFilters).toContainEqual(['status', 'pending'])
  })
})
