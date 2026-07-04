export interface ScholarshipBatchResult {
  success: boolean
  generated?: number
  failed?: string[]
  error?: string
  /** IDs of the invoices created (single-id → toast links straight to it). */
  invoiceIds?: string[]
}

/** Where a toast's "View" action should take the user. */
export type BatchToastView =
  | { kind: 'invoice'; invoiceId: string }
  | { kind: 'list' }

export interface BatchToast {
  level: 'success' | 'warning' | 'info' | 'error'
  message: string
  /** Present when the toast should offer a "View" action. */
  view?: BatchToastView
}

/**
 * Decide which toast(s) to show after "Generate All" scholarship batches.
 *
 * The handler previously did `if (result.success) { ... }` with no else, so a failed
 * action (e.g. permission denied) produced no feedback at all — the button just stopped
 * spinning. Always return at least one message, including the error and the
 * nothing-to-do cases.
 *
 * The success toast carries a `view` target: directly to the invoice when exactly
 * one was generated, to the full invoice list when several were.
 */
export function scholarshipBatchToasts(result: ScholarshipBatchResult): BatchToast[] {
  if (!result.success) {
    return [{ level: 'error', message: result.error || 'Failed to generate scholarship invoices' }]
  }

  const generated = result.generated ?? 0
  const failed = result.failed ?? []
  const invoiceIds = result.invoiceIds ?? []
  const toasts: BatchToast[] = []

  if (generated > 0) {
    const view: BatchToastView = invoiceIds.length === 1
      ? { kind: 'invoice', invoiceId: invoiceIds[0] }
      : { kind: 'list' }
    toasts.push({
      level: 'success',
      message: `Generated ${generated} invoice${generated !== 1 ? 's' : ''}`,
      view,
    })
  }
  if (failed.length > 0) {
    toasts.push({ level: 'warning', message: `${failed.length} failed` })
  }
  if (generated === 0 && failed.length === 0) {
    toasts.push({ level: 'info', message: 'No unbilled scholarship sessions to generate' })
  }
  return toasts
}
