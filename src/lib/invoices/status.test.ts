import { describe, it, expect } from 'vitest'
import { invoiceStatusUpdate } from './status'

describe('invoiceStatusUpdate (regression for #24 — stale paid_date)', () => {
  it('sets paid_date when moving to paid', () => {
    expect(invoiceStatusUpdate('paid', '2026-06-10')).toEqual({ status: 'paid', paid_date: '2026-06-10' })
  })

  it('clears paid_date when moving OFF paid (no stale date left behind)', () => {
    expect(invoiceStatusUpdate('sent', '2026-06-10')).toEqual({ status: 'sent', paid_date: null })
    expect(invoiceStatusUpdate('pending', '2026-06-10')).toEqual({ status: 'pending', paid_date: null })
  })
})
