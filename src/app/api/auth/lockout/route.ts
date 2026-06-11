import { NextRequest, NextResponse } from 'next/server'
import { checkLockout, recordLoginAttempt } from '@/lib/auth/lockout'
import { createServiceClient } from '@/lib/supabase/service'
import { lockoutBodySchema } from '@/lib/validation/schemas'
import type { OrganizationSettings } from '@/types/database'

/**
 * Look up the org context (security settings + org id) by email (pre-auth, uses service role).
 * The org id is used to tag the login attempt so reads can be scoped per-tenant.
 */
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

/**
 * POST /api/auth/lockout
 *
 * Check lockout status or record a login attempt.
 * Body: { email, action: 'check' | 'record', success?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = lockoutBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { email, action, success } = parsed.data

    // The platform sets x-forwarded-for to the real client IP (clients can't spoof it on
    // Vercel); we scope lockout by this IP so failed attempts can't lock out other IPs.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

    // Look up org-specific lockout settings + the org id to tag the attempt with
    const orgContext = await getOrgContext(email)
    const lockoutOptions = orgContext.security
      ? { maxAttempts: orgContext.security.max_login_attempts, lockoutMinutes: orgContext.security.lockout_duration_minutes }
      : undefined

    if (action === 'check') {
      const status = await checkLockout(email, ip, lockoutOptions)
      return NextResponse.json(status)
    }

    if (action === 'record') {
      await recordLoginAttempt(email, !!success, ip ?? undefined, orgContext.organizationId)
      return NextResponse.json({ recorded: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
