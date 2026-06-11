import { describe, it, expect } from 'vitest'
import { sumInvoiceItemTotals } from './batch-totals'

describe('sumInvoiceItemTotals (regression for #32 — batch total drift)', () => {
  it('sums and rounds item totals', () => {
    expect(
      sumInvoiceItemTotals([
        { amount: 60, mca_cut: 18, contractor_pay: 42, rent_amount: 0 },
        { amount: 60, mca_cut: 18, contractor_pay: 42, rent_amount: 0 },
      ])
    ).toEqual({ amount: 120, mca_cut: 36, contractor_pay: 84, rent_amount: 0 })
  })

  it('returns zeros for an empty set', () => {
    expect(sumInvoiceItemTotals([])).toEqual({ amount: 0, mca_cut: 0, contractor_pay: 0, rent_amount: 0 })
  })

  it('tolerates null rent_amount and rounds cents', () => {
    expect(
      sumInvoiceItemTotals([
        { amount: 20.1, mca_cut: 6.03, contractor_pay: 14.07, rent_amount: null },
        { amount: 20.2, mca_cut: 6.06, contractor_pay: 14.14, rent_amount: null },
      ])
    ).toEqual({ amount: 40.3, mca_cut: 12.09, contractor_pay: 28.21, rent_amount: 0 })
  })
})
