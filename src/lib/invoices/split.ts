import type { PricingCalculation } from '@/lib/pricing'

export interface InvoiceShare {
  amount: number
  mca_cut: number
  contractor_pay: number
  rent_amount: number
}

/**
 * Distribute a dollar `total` across `count` shares that sum EXACTLY to the rounded total.
 * Independent per-share rounding (`round(total / n)` on every invoice) doesn't sum back — e.g.
 * $100 / 3 -> 3 × $33.33 = $99.99 (a cent lost) and $77 / 3 -> 3 × $25.67 = $77.01 (a cent gained).
 * Here we round the total to cents once, give everyone the floor share, and hand the leftover
 * cents to the earliest shares, so the parts always reconcile to the whole.
 */
export function distributeAmount(total: number, count: number): number[] {
  const n = Math.max(1, count)
  const totalCents = Math.round(total * 100)
  const base = Math.trunc(totalCents / n)
  const step = totalCents >= 0 ? 1 : -1
  let remainder = Math.abs(totalCents - base * n)
  const shares: number[] = []
  for (let i = 0; i < n; i++) {
    let cents = base
    if (remainder > 0) {
      cents += step
      remainder--
    }
    shares.push(cents / 100)
  }
  return shares
}

/**
 * One client's share of a session's invoice when the session is split across `count` per-client
 * invoices. Mirrors how createNewSession divides the pricing: each client's invoice gets the
 * per-person amount (or the full total for a group billed to one agency) and a remainder-aware
 * share of mca_cut / contractor_pay / rent. `index` identifies which of the `count` invoices this
 * is, so the leftover cents are allocated deterministically and the shares sum to the total.
 * Used when resyncing linked invoices after a session edit.
 */
export function perClientInvoiceShare(
  pricing: PricingCalculation,
  count: number,
  isGroup: boolean,
  index = 0
): InvoiceShare {
  const n = Math.max(1, count)
  const i = Math.min(Math.max(index, 0), n - 1)
  return {
    amount: isGroup ? pricing.totalAmount : pricing.perPersonCost,
    mca_cut: distributeAmount(pricing.mcaCut, n)[i],
    contractor_pay: distributeAmount(pricing.contractorPay, n)[i],
    rent_amount: distributeAmount(pricing.rentAmount, n)[i],
  }
}
