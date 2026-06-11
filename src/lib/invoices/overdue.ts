import { parseLocalDate, todayLocal } from '@/lib/dates'

/**
 * Whether a 'sent' invoice is past due, by LOCAL calendar date.
 *
 * `due_date` is a date-only string. Date-only strings compare lexicographically the same
 * as chronologically, so this avoids the `new Date('YYYY-MM-DD')` UTC-parse off-by-one that
 * flagged invoices overdue the evening before — and on — their actual due date.
 */
export function isInvoiceOverdue(
  status: string,
  dueDate: string | null | undefined,
  today: string = todayLocal()
): boolean {
  if (status !== 'sent' || !dueDate) return false
  return dueDate < today
}

/** Whole days an invoice is overdue (0 when not overdue), by local calendar date. */
export function invoiceDaysOverdue(
  dueDate: string | null | undefined,
  today: string = todayLocal()
): number {
  if (!dueDate || dueDate >= today) return 0
  const ms = parseLocalDate(today).getTime() - parseLocalDate(dueDate).getTime()
  return Math.round(ms / 86_400_000)
}
