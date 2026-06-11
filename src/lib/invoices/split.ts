import type { PricingCalculation } from '@/lib/pricing'

export interface InvoiceShare {
  amount: number
  mca_cut: number
  contractor_pay: number
  rent_amount: number
}

const round = (v: number) => Math.round(v * 100) / 100

/**
 * One client's share of a session's invoice when the session is split across `count` per-client
 * invoices. Mirrors how createNewSession divides the pricing: each client's invoice gets the
 * per-person amount (or the full total for a group billed to one agency) and an equal share of
 * mca_cut / contractor_pay / rent. Used when resyncing linked invoices after a session edit.
 */
export function perClientInvoiceShare(
  pricing: PricingCalculation,
  count: number,
  isGroup: boolean
): InvoiceShare {
  const n = Math.max(1, count)
  return {
    amount: isGroup ? pricing.totalAmount : pricing.perPersonCost,
    mca_cut: round(pricing.mcaCut / n),
    contractor_pay: round(pricing.contractorPay / n),
    rent_amount: round(pricing.rentAmount / n),
  }
}
