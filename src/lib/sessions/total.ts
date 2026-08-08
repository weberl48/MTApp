export interface SessionTotalInput {
  total_amount?: number | null
  attendees?: { individual_cost?: number | null }[] | null
}

export interface SessionBreakdownInput {
  mca_cut?: number | null
  contractor_pay?: number | null
}

export interface SessionDisplayBreakdown {
  mcaCut: number | null
  contractorPay: number | null
}

/**
 * The dollar total to DISPLAY for a session row.
 *
 * `sessions.total_amount` is a snapshot written at save time (session-form / approveSession),
 * but it is nullable — rows predating 20250228_add_session_pricing_columns.sql have none. For
 * those we fall back to summing the attendees' `individual_cost`.
 *
 * Returns null — not 0 — when neither source exists, so callers render "—" instead of asserting
 * "$0.00". A group session carries no `session_attendees` rows, so the old `?? 0` fallback made
 * every pre-migration group session look free. A stored `total_amount` of 0 is a real number and
 * is preserved.
 *
 * Single source for the three surfaces that show a session's money in a list or summary:
 * the dashboard Pending Approvals card, the sessions list, and the session detail page.
 */
export function sessionDisplayTotal(session: SessionTotalInput): number | null {
  if (session.total_amount != null) return session.total_amount

  const attendees = session.attendees
  if (!attendees || attendees.length === 0) return null

  return attendees.reduce((sum, a) => sum + (a.individual_cost || 0), 0)
}

/**
 * The MCA-cut / contractor-pay split to DISPLAY alongside a session's total.
 *
 * Both columns are snapshots written at save time and are nullable for the same reason
 * `total_amount` is — rows predating 20250228_add_session_pricing_columns.sql have neither.
 * Unlike the total there is NO fallback source: `session_attendees` records what each client
 * was charged, not how that split between the org and the contractor. So a missing column is
 * reported as null and the caller omits it rather than deriving it (`total - pay` would invent
 * a number that was never priced).
 *
 * Returns null when BOTH are missing, so a caller can drop the whole line in one check instead
 * of rendering "— · —".
 *
 * `mcaCut` is legitimately NEGATIVE when the contractor is paid more than the session bills —
 * in-school sessions currently price at $0 total against real contractor pay. Callers must
 * render that as a value, not clamp or hide it; it is the single most useful thing this line
 * shows. Grep `sessionDisplayBreakdown` before changing the sign handling.
 */
export function sessionDisplayBreakdown(
  session: SessionBreakdownInput
): SessionDisplayBreakdown | null {
  const mcaCut = session.mca_cut ?? null
  const contractorPay = session.contractor_pay ?? null

  if (mcaCut === null && contractorPay === null) return null

  return { mcaCut, contractorPay }
}
