export interface SessionTotalInput {
  total_amount?: number | null
  attendees?: { individual_cost?: number | null }[] | null
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
