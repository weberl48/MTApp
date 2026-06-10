/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { deletePendingSessionInvoices, hasBilledSessionInvoice } from './session-invoice-cleanup'

function mockDeleteChain() {
  const filters: Array<[string, unknown]> = []
  let op = ''
  let table = ''
  const chain: any = {
    from(t: string) { table = t; return chain },
    delete() { op = 'delete'; return chain },
    eq(col: string, val: unknown) { filters.push([col, val]); return chain },
    // make the builder awaitable
    then(resolve: (v: { data: null; error: null }) => unknown) { return resolve({ data: null, error: null }) },
  }
  return { chain, get: () => ({ table, op, filters }) }
}

function mockSelectChain(rows: unknown[]) {
  const ins: Array<[string, unknown[]]> = []
  const chain: any = {
    from() { return chain },
    select() { return chain },
    eq() { return chain },
    in(col: string, vals: unknown[]) { ins.push([col, vals]); return chain },
    limit() { return Promise.resolve({ data: rows, error: null }) },
  }
  return { chain, get: () => ({ ins }) }
}

describe('deletePendingSessionInvoices (regression for #7)', () => {
  it("only deletes invoices with status='pending' for the session", async () => {
    const { chain, get } = mockDeleteChain()
    await deletePendingSessionInvoices(chain, 'sess-1')
    const { table, op, filters } = get()
    expect(table).toBe('invoices')
    expect(op).toBe('delete')
    expect(filters).toContainEqual(['session_id', 'sess-1'])
    // critical: without this filter, reject/cancel/delete would wipe sent/paid invoices
    expect(filters).toContainEqual(['status', 'pending'])
  })
})

describe('hasBilledSessionInvoice (regression for #7)', () => {
  it('returns true when a sent/paid invoice exists, scoped to sent+paid', async () => {
    const { chain, get } = mockSelectChain([{ id: 'i1' }])
    expect(await hasBilledSessionInvoice(chain, 'sess-1')).toBe(true)
    expect(get().ins).toContainEqual(['status', ['sent', 'paid']])
  })

  it('returns false when no sent/paid invoice exists', async () => {
    const { chain } = mockSelectChain([])
    expect(await hasBilledSessionInvoice(chain, 'sess-1')).toBe(false)
  })
})
