export type InvoiceSortKey =
  | 'created_desc'
  | 'created_asc'
  | 'submitted_desc'
  | 'approved_desc'
  | 'amount_desc'
  | 'amount_asc'

export const INVOICE_SORT_OPTIONS: { value: InvoiceSortKey; label: string }[] = [
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc', label: 'Oldest first' },
  { value: 'submitted_desc', label: 'Date submitted (by contractor)' },
  { value: 'approved_desc', label: 'Date approved (by admin)' },
  { value: 'amount_desc', label: 'Amount (high to low)' },
  { value: 'amount_asc', label: 'Amount (low to high)' },
]

export interface SortableInvoice {
  created_at: string
  amount: number
  session?: {
    submitted_at?: string | null
    approved_at?: string | null
  } | null
}

/**
 * Sort invoices for the invoices page.
 *
 * "Date submitted" / "Date approved" use the linked session's status
 * timestamps (sessions.submitted_at / approved_at, trigger-maintained).
 * Batch invoices have no single session, so they fall back to the invoice's
 * own created_at — for a monthly batch that IS its generation date, which is
 * the closest meaningful equivalent. Returns a new array; input untouched.
 */
export function sortInvoices<T extends SortableInvoice>(invoices: T[], key: InvoiceSortKey): T[] {
  const sorted = [...invoices]

  const submittedAt = (inv: T) => inv.session?.submitted_at || inv.created_at
  const approvedAt = (inv: T) => inv.session?.approved_at || inv.created_at

  switch (key) {
    case 'created_asc':
      sorted.sort((a, b) => a.created_at.localeCompare(b.created_at))
      break
    case 'submitted_desc':
      sorted.sort((a, b) => submittedAt(b).localeCompare(submittedAt(a)))
      break
    case 'approved_desc':
      sorted.sort((a, b) => approvedAt(b).localeCompare(approvedAt(a)))
      break
    case 'amount_desc':
      sorted.sort((a, b) => b.amount - a.amount)
      break
    case 'amount_asc':
      sorted.sort((a, b) => a.amount - b.amount)
      break
    case 'created_desc':
    default:
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
      break
  }

  return sorted
}
