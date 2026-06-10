import { describe, it, expect } from 'vitest'
import { isInvoiceOverdue, invoiceDaysOverdue } from './overdue'

describe('isInvoiceOverdue (regression for #15 — invoices flagged overdue a day early)', () => {
  it('is NOT overdue on the due date itself', () => {
    expect(isInvoiceOverdue('sent', '2026-06-10', '2026-06-10')).toBe(false)
  })

  it('is overdue the day after the due date', () => {
    expect(isInvoiceOverdue('sent', '2026-06-10', '2026-06-11')).toBe(true)
  })

  it('is NOT overdue before the due date', () => {
    expect(isInvoiceOverdue('sent', '2026-06-10', '2026-06-09')).toBe(false)
  })

  it('only applies to sent invoices that have a due date', () => {
    expect(isInvoiceOverdue('paid', '2020-01-01', '2026-06-10')).toBe(false)
    expect(isInvoiceOverdue('pending', '2020-01-01', '2026-06-10')).toBe(false)
    expect(isInvoiceOverdue('sent', null, '2026-06-10')).toBe(false)
  })
})

describe('invoiceDaysOverdue', () => {
  it('is 0 on and before the due date', () => {
    expect(invoiceDaysOverdue('2026-06-10', '2026-06-10')).toBe(0)
    expect(invoiceDaysOverdue('2026-06-10', '2026-06-09')).toBe(0)
  })

  it('counts whole calendar days overdue (not inflated by 1)', () => {
    expect(invoiceDaysOverdue('2026-06-10', '2026-06-11')).toBe(1)
    expect(invoiceDaysOverdue('2026-06-10', '2026-06-20')).toBe(10)
  })
})
