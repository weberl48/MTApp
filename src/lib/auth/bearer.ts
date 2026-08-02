/**
 * Constant-time bearer-token comparison.
 *
 * `authHeader === \`Bearer ${secret}\`` short-circuits on the first differing
 * byte, so the comparison time leaks a prefix-match length. Network jitter makes
 * that impractical to exploit in most deployments, but the correct primitive is
 * free and we already use it for the Square webhook HMAC — so there is no reason
 * for the cron and health secrets to be the odd ones out.
 *
 * Kept runtime-agnostic (no node:crypto import) so it is safe to pull into the
 * proxy or an edge route later without a rewrite.
 */

/** Constant-time string equality. Length differences still short-circuit — the
 * length of a secret is not the secret. */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Verify an `Authorization: Bearer <secret>` header against an expected secret.
 * Returns false when either side is missing/empty — an unset secret must never
 * authorize anything (fail closed).
 */
export function verifyBearerSecret(
  authHeader: string | null | undefined,
  expectedSecret: string | undefined | null
): boolean {
  if (!authHeader || !expectedSecret) return false
  return timingSafeEqualString(authHeader, `Bearer ${expectedSecret}`)
}
