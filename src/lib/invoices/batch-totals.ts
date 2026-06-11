export interface InvoiceItemTotals {
  amount: number
  mca_cut: number
  contractor_pay: number
  rent_amount: number
}

const round = (v: number) => Math.round(v * 100) / 100

/**
 * Sum a batch invoice's line items into header totals.
 *
 * Used when a session is removed from a batch (scholarship) invoice. The previous code
 * decremented the header arithmetically (`header.amount - item.amount`), which drifts when two
 * removals run concurrently (both read the same header, each subtracts, one write is lost).
 * Recomputing from the surviving items is idempotent and converges to the correct total.
 */
export function sumInvoiceItemTotals(
  items: Array<{ amount: number; mca_cut: number; contractor_pay: number; rent_amount?: number | null }>
): InvoiceItemTotals {
  const sum: InvoiceItemTotals = { amount: 0, mca_cut: 0, contractor_pay: 0, rent_amount: 0 }
  for (const r of items) {
    sum.amount += Number(r.amount)
    sum.mca_cut += Number(r.mca_cut)
    sum.contractor_pay += Number(r.contractor_pay)
    sum.rent_amount += Number(r.rent_amount ?? 0)
  }
  return {
    amount: round(sum.amount),
    mca_cut: round(sum.mca_cut),
    contractor_pay: round(sum.contractor_pay),
    rent_amount: round(sum.rent_amount),
  }
}
