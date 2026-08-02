import { createClient } from '@/lib/supabase/server'
import { can, type Permission } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'

export interface StaffSession {
  userId: string
  role: UserRole
  organizationId: string
}

export type StaffSessionResult =
  | { ok: true; session: StaffSession }
  | { ok: false; status: 401 | 403; error: string }

/**
 * The authenticated-request gate for API routes and server actions.
 *
 * Three things in one place, because doing them separately is how they drift:
 *
 *  1. There is a user.
 *  2. **The session has cleared MFA.** `getUser()` happily returns a user at
 *     aal1 — password accepted, TOTP not yet entered. The proxy redirects such
 *     sessions away from page routes, but `/api/*` is not in its `protectedPaths`
 *     allow-list, so before this every API route accepted a half-authenticated
 *     session. `src/lib/supabase/middleware.ts` now blocks that centrally; this
 *     is the second layer, because a single enforcement point is exactly the
 *     fragility that produced the gap.
 *  3. The user has a profile row (role + organization) to authorize against.
 *
 * `requiredPermission` is optional so callers with bespoke authorization (e.g.
 * "admins in org OR the owning contractor") can do their own check on the
 * returned role without the helper guessing.
 */
export async function requireStaffSession(
  requiredPermission?: Permission
): Promise<StaffSessionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, status: 401, error: 'Unauthorized' }

  // Skipped in local development for the same reason the proxy skips it: the
  // seeded local accounts have no enrolled factors and require_mfa is off.
  if (process.env.NODE_ENV === 'production') {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
      return { ok: false, status: 403, error: 'MFA verification required' }
    }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single<{ role: string; organization_id: string }>()

  if (!profile) return { ok: false, status: 403, error: 'User profile not found' }

  const role = profile.role as UserRole

  if (requiredPermission && !can(role, requiredPermission)) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  return {
    ok: true,
    session: { userId: user.id, role, organizationId: profile.organization_id },
  }
}
