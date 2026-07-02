/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { perClientInvoiceShare, distributeAmount } from './split'

const sum = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) * 100) / 100

describe('distributeAmount (remainder-aware split)', () => {
  it('shares always sum back to the rounded total', () => {
    expect(sum(distributeAmount(100, 3))).toBe(100) // 33.34 + 33.33 + 33.33
    expect(sum(distributeAmount(77, 3))).toBe(77)   // 25.67 + 25.67 + 25.66
    expect(sum(distributeAmount(50, 3))).toBe(50)
    expect(sum(distributeAmount(23, 3))).toBe(23)
  })

  it('allocates the leftover cents to the earliest shares', () => {
    expect(distributeAmount(100, 3)).toEqual([33.34, 33.33, 33.33])
    expect(distributeAmount(77, 3)).toEqual([25.67, 25.67, 25.66])
  })

  it('handles count of 1 and 0 (never divides by zero)', () => {
    expect(distributeAmount(60, 1)).toEqual([60])
    expect(distributeAmount(60, 0)).toEqual([60])
  })

  it('returns exact shares when evenly divisible', () => {
    expect(distributeAmount(120, 2)).toEqual([60, 60])
  })
})

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

  it('index-based shares sum to the session total (no penny drift)', () => {
    const odd = { totalAmount: 100, perPersonCost: 33.33, mcaCut: 23, contractorPay: 77, rentAmount: 0 } as any
    const count = 3
    const contractor = [0, 1, 2].map((i) => perClientInvoiceShare(odd, count, false, i).contractor_pay)
    const mca = [0, 1, 2].map((i) => perClientInvoiceShare(odd, count, false, i).mca_cut)
    expect(sum(contractor)).toBe(77)
    expect(sum(mca)).toBe(23)
  })
})
