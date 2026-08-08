import { resolveSquareWebhookStatus } from './webhook-status'

/**
 * Manual linking of dashboard-created Square invoices to local invoices
 * (spec: docs/superpowers/specs/2026-08-08-square-invoice-linking-design.md).
 *
 * Pure logic only — the API routes under /api/square/invoices/candidates and
 * /api/invoices/[id]/square/link stay thin on top of this.
 */

/** Structural subset of the Square SDK's Invoice — keeps this module and its tests SDK-free. */
export interface SquareInvoiceLike {
  id?: string
  invoiceNumber?: string | null
  title?: string | null
  status?: string
  createdAt?: string
  publicUrl?: string
  primaryRecipient?: {
    customerId?: string | null
    givenName?: string
    familyName?: string
    companyName?: string
    emailAddress?: string
  }
  paymentRequests?: Array<{
    computedAmountMoney?: { amount?: bigint | number | null }
  }> | null
}

export interface SquareInvoiceCandidate {
  id: string
  invoiceNumber: string | null
  title: string | null
  customerName: string | null
  customerEmail: string | null
  customerId: string | null
  amount: number | null
  status: string
  createdAt: string | null
  publicUrl: string | null
  suggested: boolean
}

/** Square invoices in these states can never be paid, so linking one is always a mistake. */
export const NON_LINKABLE_SQUARE_STATUSES: ReadonlySet<string> = new Set(['CANCELED', 'FAILED'])

export function squareInvoiceToCandidate(invoice: SquareInvoiceLike): SquareInvoiceCandidate | null {
  if (!invoice.id) return null

  const recipient = invoice.primaryRecipient
  const personName = [recipient?.givenName, recipient?.familyName].filter(Boolean).join(' ')

  let amount: number | null = null
  for (const request of invoice.paymentRequests ?? []) {
    const cents = request?.computedAmountMoney?.amount
    if (cents != null) amount = (amount ?? 0) + Number(cents) / 100
  }

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber ?? null,
    title: invoice.title ?? null,
    customerName: personName || recipient?.companyName || null,
    customerEmail: recipient?.emailAddress ?? null,
    customerId: recipient?.customerId ?? null,
    amount,
    status: invoice.status ?? 'UNKNOWN',
    createdAt: invoice.createdAt ?? null,
    publicUrl: invoice.publicUrl ?? null,
    suggested: false,
  }
}

export interface CandidateSortContext {
  /** The local invoice amount, in dollars. */
  amount: number | null | undefined
  /** The client's saved Square customer id, if any. */
  squareCustomerId?: string | null
}

/**
 * Flag suggested matches (exact amount, or same Square customer as the client)
 * and sort suggested-first, newest-first within each group. Amounts compare in
 * cents so float noise can't break an exact match.
 */
export function sortCandidates(
  candidates: SquareInvoiceCandidate[],
  context: CandidateSortContext
): SquareInvoiceCandidate[] {
  const targetCents = context.amount != null ? Math.round(context.amount * 100) : null

  return candidates
    .map((candidate) => ({
      ...candidate,
      suggested:
        (targetCents != null &&
          candidate.amount != null &&
          Math.round(candidate.amount * 100) === targetCents) ||
        (!!context.squareCustomerId && candidate.customerId === context.squareCustomerId),
    }))
    .sort((a, b) => {
      if (a.suggested !== b.suggested) return a.suggested ? -1 : 1
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    })
}

const LOCAL_STATUS_RANK: Record<string, number> = { pending: 0, sent: 1, paid: 2 }

/**
 * Status to adopt when linking, derived from the webhook mapping but strictly
 * forward-only in BOTH directions: linking must never regress a local status
 * (an emailed-then-linked invoice stays 'sent' even if the Square copy is
 * still DRAFT), where the webhook mapping only protects 'paid'.
 */
export function linkStatusUpdate(
  currentStatus: string | null | undefined,
  squareStatus: string | null | undefined
): { status: 'pending' | 'sent' | 'paid'; setPaidDate: boolean } | null {
  const resolved = resolveSquareWebhookStatus(currentStatus, squareStatus)
  if (!resolved) return null

  const currentRank = LOCAL_STATUS_RANK[currentStatus ?? ''] ?? -1
  if (LOCAL_STATUS_RANK[resolved.status] <= currentRank) return null

  return resolved
}

const SQUARE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  UNPAID: 'Unpaid',
  SCHEDULED: 'Scheduled',
  PARTIALLY_PAID: 'Partially paid',
  PAID: 'Paid',
  PAYMENT_PENDING: 'Payment pending',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partially refunded',
  CANCELED: 'Canceled',
  FAILED: 'Failed',
}

export function squareStatusLabel(status: string): string {
  return SQUARE_STATUS_LABELS[status] ?? status
}
