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
 * Note: when the no-show flow is fixed (adds the `no_show` enum value and reprices
 * the invoice), add `'no_show'` here so no-show pay is also payable in both views.
 */
export const UNPAID_PAYROLL_STATUSES: string[] = ['submitted', 'approved']
