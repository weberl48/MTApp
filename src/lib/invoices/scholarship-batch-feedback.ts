export interface ScholarshipBatchResult {
  success: boolean
  generated?: number
  failed?: string[]
  error?: string
}

export interface BatchToast {
  level: 'success' | 'warning' | 'info' | 'error'
  message: string
}

/**
 * Decide which toast(s) to show after "Generate All" scholarship batches.
 *
 * The handler previously did `if (result.success) { ... }` with no else, so a failed
 * action (e.g. permission denied) produced no feedback at all — the button just stopped
 * spinning. Always return at least one message, including the error and the
 * nothing-to-do cases.
 */
export function scholarshipBatchToasts(result: ScholarshipBatchResult): BatchToast[] {
  if (!result.success) {
    return [{ level: 'error', message: result.error || 'Failed to generate scholarship invoices' }]
  }

  const generated = result.generated ?? 0
  const failed = result.failed ?? []
  const toasts: BatchToast[] = []

  if (generated > 0) {
    toasts.push({ level: 'success', message: `Generated ${generated} invoice${generated !== 1 ? 's' : ''}` })
  }
  if (failed.length > 0) {
    toasts.push({ level: 'warning', message: `${failed.length} failed` })
  }
  if (generated === 0 && failed.length === 0) {
    toasts.push({ level: 'info', message: 'No unbilled scholarship sessions to generate' })
  }
  return toasts
}
