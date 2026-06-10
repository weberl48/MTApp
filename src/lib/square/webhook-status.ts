/**
 * Resolve the local invoice status from a Square webhook's invoice status, FORWARD-ONLY.
 *
 * Square does not guarantee event ordering and retries deliveries, and an invoice can be
 * marked paid locally (e.g. by check) while still 'open' in Square. The webhook previously
 * applied the mapping unconditionally, so a later/out-of-order `invoice.updated` with status
 * UNPAID would regress a paid invoice back to 'sent' — re-starting reminders and corrupting
 * reports. Never un-pay an already-paid invoice.
 *
 * Returns null when there is nothing to change (unknown Square status, or a regression of a
 * paid invoice).
 */
export function resolveSquareWebhookStatus(
  current: string | null | undefined,
  squareStatus: string | null | undefined
): { status: 'pending' | 'sent' | 'paid'; setPaidDate: boolean } | null {
  let target: 'pending' | 'sent' | 'paid'
  let setPaidDate = false

  if (squareStatus === 'PAID') {
    target = 'paid'
    setPaidDate = true
  } else if (squareStatus === 'UNPAID' || squareStatus === 'SCHEDULED') {
    target = 'sent'
  } else if (squareStatus === 'CANCELED' || squareStatus === 'DRAFT') {
    target = 'pending'
  } else {
    return null
  }

  // Never un-pay an invoice that is already paid (paid by check, or a stale/out-of-order event).
  if (current === 'paid' && target !== 'paid') return null

  return { status: target, setPaidDate }
}
