/**
 * Which API paths require a session that has cleared MFA.
 *
 * The proxy's `protectedPaths` is an allow-list of PAGE prefixes, so `/api/*` was
 * never covered: an aal1 session (password accepted, TOTP not yet entered) could
 * call any API route, including ones that decrypt PHI. The fix inverts the
 * default for `/api/*` — everything is guarded unless it authenticates with
 * something other than a staff session.
 *
 * Deny-by-default matters here: a new API route is protected the moment it is
 * created, which is the opposite of how `protectedPaths` behaves.
 */

/** Routes that authenticate with a portal token, an HMAC, a bearer secret, or nothing at all. */
export const MFA_EXEMPT_API_PREFIXES = [
  '/api/portal/', // client portal access tokens
  '/api/webhooks/', // Square HMAC signature
  '/api/cron/', // CRON_SECRET bearer
  '/api/health', // public liveness; detail is CRON_SECRET-gated
  '/api/auth/', // pre-authentication (lockout check/record, login)
  '/api/invites/validate', // pre-authentication invite lookup
  '/api/dev/', // dev-only relay, 404s in production
] as const

/**
 * Match on a path SEGMENT boundary, not a raw string prefix. A bare
 * `startsWith('/api/health')` would also exempt `/api/healthz`, and
 * `startsWith('/api/invites/validate')` would exempt a future
 * `/api/invites/validate-all`. Exemptions must never widen by accident.
 */
function matchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix.endsWith('/')) return pathname.startsWith(prefix)
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/**
 * True when a request to `pathname` must be rejected if the caller's session has
 * MFA enrolled but not yet verified.
 */
export function isMfaGuardedApiPath(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) return false
  return !MFA_EXEMPT_API_PREFIXES.some(prefix => matchesPrefix(pathname, prefix))
}
