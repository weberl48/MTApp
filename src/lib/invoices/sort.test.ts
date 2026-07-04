import { describe, it, expect } from 'vitest'
import { sortInvoices } from './sort'

const inv = (id: string, created: string, amount: number, session?: { submitted_at?: string | null; approved_at?: string | null } | null) => ({
  id, created_at: created, amount, session,
})

const A = inv('a', '2026-01-10T10:00:00Z', 60, { submitted_at: '2026-01-09T08:00:00Z', approved_at: '2026-01-15T12:00:00Z' })
const B = inv('b', '2026-02-01T10:00:00Z', 45, { submitted_at: '2026-01-20T08:00:00Z', approved_at: '2026-01-21T12:00:00Z' })
const BATCH = inv('batch', '2026-01-25T10:00:00Z', 260, null) // no session — falls back to created_at

describe('sortInvoices', () => {
  it('defaults to newest created first', () => {
    expect(sortInvoices([A, B, BATCH], 'created_desc').map((i) => i.id)).toEqual(['b', 'batch', 'a'])
  })

  it('sorts oldest first', () => {
    expect(sortInvoices([B, BATCH, A], 'created_asc').map((i) => i.id)).toEqual(['a', 'batch', 'b'])
  })

  it('sorts by session submitted date, batch invoices falling back to created_at', () => {
    // submitted: A=01-09, B=01-20, BATCH→created 01-25
    expect(sortInvoices([A, B, BATCH], 'submitted_desc').map((i) => i.id)).toEqual(['batch', 'b', 'a'])
  })

  it('sorts by session approved date, batch invoices falling back to created_at', () => {
    // approved: B=01-21, BATCH→01-25, A=01-15  → desc: batch, b, a? No: 01-25 > 01-21 > 01-15
    expect(sortInvoices([A, B, BATCH], 'approved_desc').map((i) => i.id)).toEqual(['batch', 'b', 'a'])
  })

  it('sorts by amount both directions', () => {
    expect(sortInvoices([A, B, BATCH], 'amount_desc').map((i) => i.id)).toEqual(['batch', 'a', 'b'])
    expect(sortInvoices([A, B, BATCH], 'amount_asc').map((i) => i.id)).toEqual(['b', 'a', 'batch'])
  })

  it('does not mutate the input array', () => {
    const input = [B, A]
    sortInvoices(input, 'created_asc')
    expect(input.map((i) => i.id)).toEqual(['b', 'a'])
  })
})
