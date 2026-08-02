import { verifyBearerSecret } from '@/lib/auth/bearer'

/**
 * Whether to include detailed per-check info (version/commit, which integrations are configured,
 * encryption status, DB/auth error messages) in the /api/health response.
 *
 * In production this requires the CRON_SECRET bearer token — otherwise the endpoint discloses
 * ops/infrastructure detail to anonymous callers. In non-production it's always allowed, so local
 * `npm run health` and dev debugging keep working without a secret.
 *
 * The comparison is constant-time (see @/lib/auth/bearer) so the check does not leak a
 * prefix-match length for the secret.
 */
export function isHealthDetailAuthorized(
  authHeader: string | null,
  cronSecret: string | undefined,
  isProduction: boolean
): boolean {
  if (!isProduction) return true
  return verifyBearerSecret(authHeader, cronSecret)
}
