/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { ensureSessionInvoices, ensureInvoicesForSessionId } from './ensure-session-invoices'

const PRICING = { totalAmount: 90, perPersonCost: 90, mcaCut: 27, contractorPay: 63, rentAmount: 0 }

interface MockOpts {
  existingInvoices?: Array<{ id: string }>
  existingItems?: Array<{ id: string }>
  clients?: Array<{ id: string; payment_method: string; billing_frequency: string | null; square_fee_enabled: boolean | null }>
  insertError?: boolean
  invoicesCheckError?: boolean
}

function makeSupabase(opts: MockOpts) {
  const inserted: any[] = []
  const supabase: any = {
    from(table: string) {
      if (table === 'invoices') {
        return {
          select: () => ({
            eq: () => ({
              limit: async () =>
                opts.invoicesCheckError
                  ? { data: null, error: { message: 'check failed' } }
                  : { data: opts.existingInvoices ?? [], error: null },
            }),
          }),
          insert: async (rows: any[]) => {
            inserted.push(...rows)
            return { error: opts.insertError ? { message: 'insert fail' } : null }
          },
        }
      }
      if (table === 'invoice_items') {
        return {
          select: () => ({
            eq: () => ({
              limit: async () => ({ data: opts.existingItems ?? [], error: null }),
            }),
          }),
        }
      }
      if (table === 'clients') {
        return {
          select: () => ({
            in: async () => ({ data: opts.clients ?? [], error: null }),
          }),
        }
      }
      return {}
    },
  }
  return { supabase, inserted }
}

function baseParams(supabase: any) {
  return {
    supabase,
    sessionId: 's1',
    organizationId: 'o1',
    date: '2026-02-09',
    clientIds: ['c1'],
    isGroup: false,
    pricing: PRICING,
    isScholarshipService: false,
  }
}

const PER_SESSION_CLIENT = { id: 'c1', payment_method: 'group_home', billing_frequency: 'per_session', square_fee_enabled: null }

describe('ensureSessionInvoices', () => {
  it('creates a pending invoice for a per-session client when none exists', async () => {
    const { supabase, inserted } = makeSupabase({ clients: [PER_SESSION_CLIENT] })
    const result = await ensureSessionInvoices(baseParams(supabase))
    expect(result).toEqual({ created: 1, alreadyInvoiced: false, invoiceError: false })
    expect(inserted).toHaveLength(1)
    expect(inserted[0]).toMatchObject({
      session_id: 's1',
      client_id: 'c1',
      amount: 90,
      mca_cut: 27,
      contractor_pay: 63,
      rent_amount: 0,
      payment_method: 'group_home',
      status: 'pending',
      apply_square_fee: null,
      organization_id: 'o1',
    })
    // No dueDays passed → no due_date field
    expect(inserted[0].due_date).toBeUndefined()
  })

  it('computes due_date from the session date + dueDays', async () => {
    const { supabase, inserted } = makeSupabase({ clients: [PER_SESSION_CLIENT] })
    await ensureSessionInvoices({ ...baseParams(supabase), dueDays: 30 })
    // 2026-02-09 + 30 days (Feb 2026 has 28 days) = 2026-03-11
    expect(inserted[0].due_date).toBe('2026-03-11')
  })

  it('no-ops when ANY invoice already exists for the session (even paid)', async () => {
    const { supabase, inserted } = makeSupabase({ existingInvoices: [{ id: 'inv-paid' }], clients: [PER_SESSION_CLIENT] })
    const result = await ensureSessionInvoices(baseParams(supabase))
    expect(result).toEqual({ created: 0, alreadyInvoiced: true, invoiceError: false })
    expect(inserted).toHaveLength(0)
  })

  it('no-ops when the session is on a batch invoice (invoice_items row exists)', async () => {
    const { supabase, inserted } = makeSupabase({ existingItems: [{ id: 'item1' }], clients: [PER_SESSION_CLIENT] })
    const result = await ensureSessionInvoices(baseParams(supabase))
    expect(result).toEqual({ created: 0, alreadyInvoiced: true, invoiceError: false })
    expect(inserted).toHaveLength(0)
  })

  it('fails safe: does NOT create when the idempotency check errors', async () => {
    const { supabase, inserted } = makeSupabase({ invoicesCheckError: true, clients: [PER_SESSION_CLIENT] })
    const result = await ensureSessionInvoices(baseParams(supabase))
    expect(result).toEqual({ created: 0, alreadyInvoiced: false, invoiceError: true })
    expect(inserted).toHaveLength(0)
  })

  it('creates nothing for a scholarship service type', async () => {
    const { supabase, inserted } = makeSupabase({ clients: [PER_SESSION_CLIENT] })
    const result = await ensureSessionInvoices({ ...baseParams(supabase), isScholarshipService: true })
    expect(result).toEqual({ created: 0, alreadyInvoiced: false, invoiceError: false })
    expect(inserted).toHaveLength(0)
  })

  it('skips scholarship-payment and monthly-billed clients, invoicing only eligible ones', async () => {
    const { supabase, inserted } = makeSupabase({
      clients: [
        { id: 'c1', payment_method: 'private_pay', billing_frequency: 'per_session', square_fee_enabled: null },
        { id: 'c2', payment_method: 'scholarship', billing_frequency: 'per_session', square_fee_enabled: null },
        { id: 'c3', payment_method: 'private_pay', billing_frequency: 'monthly', square_fee_enabled: null },
      ],
    })
    const result = await ensureSessionInvoices({ ...baseParams(supabase), clientIds: ['c1', 'c2', 'c3'] })
    expect(result.created).toBe(1)
    expect(inserted).toHaveLength(1)
    expect(inserted[0].client_id).toBe('c1')
    // Shares are split across ELIGIBLE clients only → the single invoice carries the full cut
    expect(inserted[0].mca_cut).toBe(27)
  })

  it('splits mca_cut/contractor_pay across eligible clients so the shares sum exactly', async () => {
    const clients = ['a', 'b', 'c'].map((id) => ({ id, payment_method: 'private_pay', billing_frequency: 'per_session', square_fee_enabled: null }))
    const { supabase, inserted } = makeSupabase({ clients })
    await ensureSessionInvoices({
      ...baseParams(supabase),
      clientIds: ['a', 'b', 'c'],
      pricing: { totalAmount: 100, perPersonCost: 33.33, mcaCut: 10, contractorPay: 90, rentAmount: 0 },
    })
    expect(inserted).toHaveLength(3)
    const mcaSum = inserted.reduce((s, inv) => s + inv.mca_cut, 0)
    const paySum = inserted.reduce((s, inv) => s + inv.contractor_pay, 0)
    expect(Math.round(mcaSum * 100) / 100).toBe(10)
    expect(Math.round(paySum * 100) / 100).toBe(90)
  })

  it('invoices the full session total to the billing client for group sessions', async () => {
    const { supabase, inserted } = makeSupabase({ clients: [{ id: 'agency', payment_method: 'group_home', billing_frequency: 'per_session', square_fee_enabled: null }] })
    await ensureSessionInvoices({
      ...baseParams(supabase),
      clientIds: ['agency'],
      isGroup: true,
      pricing: { totalAmount: 240, perPersonCost: 60, mcaCut: 0, contractorPay: 240, rentAmount: 0 },
    })
    expect(inserted[0].amount).toBe(240)
  })

  it("snapshots the client's Square-fee opt-in", async () => {
    const { supabase, inserted } = makeSupabase({ clients: [{ ...PER_SESSION_CLIENT, square_fee_enabled: true }] })
    await ensureSessionInvoices(baseParams(supabase))
    expect(inserted[0].apply_square_fee).toBe(true)
  })

  it('reports invoiceError when the insert fails', async () => {
    const { supabase } = makeSupabase({ clients: [PER_SESSION_CLIENT], insertError: true })
    const result = await ensureSessionInvoices(baseParams(supabase))
    expect(result).toEqual({ created: 0, alreadyInvoiced: false, invoiceError: true })
  })

  it('no-ops with empty clientIds', async () => {
    const { supabase, inserted } = makeSupabase({})
    const result = await ensureSessionInvoices({ ...baseParams(supabase), clientIds: [] })
    expect(result).toEqual({ created: 0, alreadyInvoiced: false, invoiceError: false })
    expect(inserted).toHaveLength(0)
  })
})

interface WrapperOpts extends MockOpts {
  session?: any
  orgSettings?: any
}

function makeWrapperSupabase(opts: WrapperOpts) {
  const base = makeSupabase(opts)
  const inner = base.supabase.from.bind(base.supabase)
  base.supabase.from = (table: string) => {
    if (table === 'sessions') {
      return {
        select: () => ({
          eq: () => ({
            single: async () => opts.session
              ? { data: opts.session, error: null }
              : { data: null, error: { message: 'not found' } },
          }),
        }),
      }
    }
    if (table === 'organizations') {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { settings: opts.orgSettings ?? {} }, error: null }),
          }),
        }),
      }
    }
    return inner(table)
  }
  return base
}

const STORED_SESSION = {
  id: 's1',
  date: '2026-02-09',
  status: 'submitted',
  organization_id: 'o1',
  total_amount: 90,
  mca_cut: 27,
  contractor_pay: 63,
  group_headcount: null,
  service_type: { is_scholarship: false },
  attendees: [{ client_id: 'c1', individual_cost: 90 }],
}

describe('ensureInvoicesForSessionId', () => {
  it('creates the invoice from the stored session amounts', async () => {
    const { supabase, inserted } = makeWrapperSupabase({
      session: STORED_SESSION,
      clients: [PER_SESSION_CLIENT],
      orgSettings: { invoice: { due_days: 30 } },
    })
    const result = await ensureInvoicesForSessionId(supabase, 's1')
    expect(result.created).toBe(1)
    expect(result.error).toBeUndefined()
    expect(inserted[0]).toMatchObject({
      session_id: 's1',
      amount: 90,
      mca_cut: 27,
      contractor_pay: 63,
      rent_amount: 0,
      due_date: '2026-03-11',
    })
  })

  it('refuses sessions that are not submitted/approved', async () => {
    const { supabase, inserted } = makeWrapperSupabase({
      session: { ...STORED_SESSION, status: 'draft' },
      clients: [PER_SESSION_CLIENT],
    })
    const result = await ensureInvoicesForSessionId(supabase, 's1')
    expect(result.error).toBe('Only submitted or approved sessions can be invoiced')
    expect(inserted).toHaveLength(0)
  })

  it('returns an error for a missing session', async () => {
    const { supabase } = makeWrapperSupabase({})
    const result = await ensureInvoicesForSessionId(supabase, 'nope')
    expect(result.error).toBe('Session not found')
  })

  it('invoices the full total for group sessions', async () => {
    const { supabase, inserted } = makeWrapperSupabase({
      session: {
        ...STORED_SESSION,
        group_headcount: 4,
        total_amount: 240,
        contractor_pay: 240,
        mca_cut: 0,
        attendees: [{ client_id: 'agency', individual_cost: 240 }],
      },
      clients: [{ id: 'agency', payment_method: 'group_home', billing_frequency: 'per_session', square_fee_enabled: null }],
    })
    await ensureInvoicesForSessionId(supabase, 's1')
    expect(inserted[0].amount).toBe(240)
  })

  it('creates nothing for scholarship service types', async () => {
    const { supabase, inserted } = makeWrapperSupabase({
      session: { ...STORED_SESSION, service_type: { is_scholarship: true } },
      clients: [PER_SESSION_CLIENT],
    })
    const result = await ensureInvoicesForSessionId(supabase, 's1')
    expect(result.created).toBe(0)
    expect(inserted).toHaveLength(0)
  })
})
