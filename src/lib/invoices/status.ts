/**
 * Build the invoice fields to write for a status change.
 *
 * Always sets paid_date: to the given date when moving to 'paid', and to null otherwise — so an
 * invoice moved OFF 'paid' (via "Mark as Unpaid", or a bulk "Mark Sent" that includes paid rows)
 * doesn't keep a stale paid_date. Previously paid_date was only ever set, never cleared, leaving
 * 'sent' invoices with a populated paid_date.
 */
export function invoiceStatusUpdate(
  status: string,
  paidDate: string
): { status: string; paid_date: string | null } {
  return { status, paid_date: status === 'paid' ? paidDate : null }
}
