/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { perClientInvoiceShare } from './split'

const pricing = {
  totalAmount: 120,
  perPersonCost: 60,
  mcaCut: 36,
  contractorPay: 84,
  rentAmount: 0,
} as any

describe('perClientInvoiceShare (regression for #21 — multi-client invoice resync)', () => {
  it('splits evenly across clients for a non-group session', () => {
    expect(perClientInvoiceShare(pricing, 2, false)).toEqual({
      amount: 60,
      mca_cut: 18,
      contractor_pay: 42,
      rent_amount: 0,
    })
  })

  it('bills the full total to the agency for a group session', () => {
    expect(perClientInvoiceShare(pricing, 1, true)).toEqual({
      amount: 120,
      mca_cut: 36,
      contractor_pay: 84,
      rent_amount: 0,
    })
  })

  it('guards against divide-by-zero', () => {
    expect(perClientInvoiceShare(pricing, 0, false).mca_cut).toBe(36)
  })
})
