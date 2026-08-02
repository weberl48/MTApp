import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkLockout, recordLoginAttempt } from '@/lib/auth/lockout'
import { createServiceClient } from '@/lib/supabase/service'
import { loginBodySchema } from '@/lib/validation/schemas'
import { logger } from '@/lib/logger'
import type { OrganizationSettings } from '@/types/database'

/**
 * POST /api/auth/login
 *
 * Authenticates server-side so the organization's lockout policy is actually
 * enforced.
 *
 * WHY THIS EXISTS
 * Lockout used to be a cooperative protocol: the browser asked
 * /api/auth/lockout whether it was allowed to proceed, called
 * signInWithPassword() against GoTrue directly, then reported the outcome back.
 * An attacker scripting the GoTrue endpoint simply never made either call, so
 * `security.max_login_attempts` / `lockout_duration_minutes` had no effect on
 * anyone who did not opt in. The only real limit was Supabase's platform-wide
 * ~30 sign-ins per 5 minutes per IP.
 *
 * Here the check, the credential exchange, and the record are one server-side
 * transaction the caller cannot step around. The session cookies are set by the
 * SSR client on the way out, so the browser is signed in exactly as before.
 */

/** Look up org-specific lockout settings by email (pre-auth, service role). */
async function getOrgContext(
  email: string
): Promise<{ security: OrganizationSettings['security'] | null; organizationId: string | null }> {
  const supabase = createServiceClient()

  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('email', email.toLowerCase())
    .limit(1)
    .single()

  if (!user) return { security: null, organizationId: null }

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', user.organization_id)
    .single()

  const settings = org?.settings as OrganizationSettings | null
  return { security: settings?.security ?? null, organizationId: user.organization_id }
}

export async function POST(request: NextRequest) {
  let parsed
  try {
    parsed = loginBodySchema.safeParse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!parsed.success) {
    // Same shape as a credential failure so a malformed body cannot be used to
    // probe which addresses exist.
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const { email, password } = parsed.data

  // The platform sets x-forwarded-for to the real client IP on Vercel.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

  const orgContext = await getOrgContext(email)
  const lockoutOptions = orgContext.security
    ? {
        maxAttempts: orgContext.security.max_login_attempts,
        lockoutMinutes: orgContext.security.lockout_duration_minutes,
      }
    : undefined

  // 1. Gate. This is now authoritative — there is no path to the credential
  //    exchange that skips it.
  const lockout = await checkLockout(email, ip, lockoutOptions)
  if (lockout.locked) {
    return NextResponse.json(
      {
        error: 'locked',
        remainingMinutes: lockout.remainingMinutes,
      },
      { status: 423 } // 423 Locked
    )
  }

  // 2. Exchange credentials. The SSR client writes the session cookies onto the
  //    response, so a success here signs the browser in.
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  // 3. Record the outcome, always.
  await recordLoginAttempt(email, !error, ip ?? undefined, orgContext.organizationId)

  if (error || !data.user) {
    // Distinguish "the auth service is unreachable" (paused project, network
    // fault) from "these credentials are wrong". GoTrue answers a bad password
    // with 400; a connectivity failure has no status or a 5xx. Without this the
    // login page shows "invalid password" when the database is simply asleep.
    const status = (error as { status?: number } | null)?.status
    if (!error?.message || status === undefined || status >= 500) {
      logger.error('Login failed: auth service unreachable', error)
      return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
    }

    // Deliberately uniform: never distinguish "no such account" from "wrong
    // password", and never echo GoTrue's message (it varies by failure mode).
    logger.info('Login attempt rejected')
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  // 4. Tell the client where to go next. Computed here rather than trusted from
  //    the browser; the proxy independently enforces the same thing.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const needsMfa = aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2'

  return NextResponse.json({ success: true, needsMfa })
}
