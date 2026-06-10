/**
 * Session statuses that represent unpaid contractor work eligible for payroll.
 *
 * This MUST stay in sync between the admin Payroll Hub (`/payments`, who to pay)
 * and the contractor Earnings page (`/earnings`, what they're owed). Historically
 * these diverged: the Payroll Hub filtered on `submitted` only, so the moment an
 * admin approved a session it silently vanished from payroll — while still showing
 * as pending on the contractor's earnings page — and was never marked paid,
 * causing contractors to be underpaid. Keep both views pointed at this constant.
 *
 * `no_show` is included because a no-show still pays the contractor their normal session
 * pay (the client is billed a flat no-show fee instead).
 */
export const UNPAID_PAYROLL_STATUSES: string[] = ['submitted', 'approved', 'no_show']
