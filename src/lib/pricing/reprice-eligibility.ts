/**
 * Which sessions a bulk re-price is allowed to touch, and why the rest are refused.
 *
 * Pure and exhaustive on purpose: every refusal carries a named reason that reaches the UI, so
 * a skipped session is explained rather than silently absent from the result. "Nothing happened
 * and I don't know why" is the failure mode this module exists to prevent.
 */

export type RepriceSkipReason =
  | 'invoice-sent'
  | 'invoice-paid'
  | 'square-linked'
  | 'on-batch-invoice'
  | 'status-not-repriceable'
  | 'no-service-type'

export const REPRICE_SKIP_LABELS: Record<RepriceSkipReason, string> = {
  'invoice-sent': 'Invoice already sent',
  'invoice-paid': 'Invoice already paid',
  'square-linked': 'Invoice exists in Square',
  'on-batch-invoice': 'Billed on a batch invoice',
  'status-not-repriceable': 'Status cannot be re-priced',
  'no-service-type': 'No service type',
}

/**
 * Only `submitted` and `approved` sessions re-price.
 *
 * - `draft` is excluded because it re-prices anyway the moment the contractor saves it, so
 *   touching it here buys nothing and creates a second write path for the same number.
 * - `no_show` is excluded because it is priced by `calculateNoShowPricing` (a flat fee with
 *   normal contractor pay). Running the standard formula over it would erase the no-show
 *   pricing — the single most damaging thing this feature could do.
 * - `cancelled` is excluded: it bills nothing.
 */
export const REPRICEABLE_SESSION_STATUSES = ['submitted', 'approved'] as const

export interface SessionForEligibility {
  status: string
  service_type_id: string | null
}

export interface InvoiceForEligibility {
  status: string
  square_invoice_id: string | null
}

export type RepriceEligibility =
  | { eligible: true }
  | { eligible: false; reason: RepriceSkipReason }

/**
 * Decide whether a session may be re-priced.
 *
 * `invoices` is every invoice pointing at this session; `batchItemCount` is how many
 * `invoice_items` rows reference it (batch/scholarship billing). A session is refused if ANY
 * of its invoices is beyond `pending` — re-pricing one invoice of a split session while its
 * sibling is already paid would leave the two disagreeing about the same session.
 *
 * Checks run most-severe first so the reported reason is the one the user most needs to act on.
 */
export function repriceEligibility(
  session: SessionForEligibility,
  invoices: InvoiceForEligibility[],
  batchItemCount: number
): RepriceEligibility {
  if (!session.service_type_id) {
    return { eligible: false, reason: 'no-service-type' }
  }

  if (!(REPRICEABLE_SESSION_STATUSES as readonly string[]).includes(session.status)) {
    return { eligible: false, reason: 'status-not-repriceable' }
  }

  if (invoices.some((invoice) => invoice.status === 'paid')) {
    return { eligible: false, reason: 'invoice-paid' }
  }

  if (invoices.some((invoice) => invoice.status === 'sent')) {
    return { eligible: false, reason: 'invoice-sent' }
  }

  // Square holds the authoritative copy once an invoice exists there; rewriting the local row
  // would put the two permanently out of step with no reconciliation path.
  if (invoices.some((invoice) => invoice.square_invoice_id)) {
    return { eligible: false, reason: 'square-linked' }
  }

  // Batch invoices aggregate many sessions into one header via `invoice_items`. Re-pricing one
  // line requires recomputing the header with `sumInvoiceItemTotals`; until that is wired up,
  // refuse rather than leave a batch total disagreeing with its lines.
  if (batchItemCount > 0) {
    return { eligible: false, reason: 'on-batch-invoice' }
  }

  return { eligible: true }
}
