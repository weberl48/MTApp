import { NextRequest, NextResponse } from 'next/server'
import { checkLockout, recordLoginAttempt } from '@/lib/auth/lockout'
import { createServiceClient } from '@/lib/supabase/service'
import { lockoutBodySchema } from '@/lib/validation/schemas'
import type { OrganizationSettings } from '@/types/database'

/**
 * Look up org security settings by email (pre-auth, uses service role)
 */
async function getOrgSecuritySettings(email: string) {
  const supabase = createServiceClient()

  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('email', email.toLowerCase())
    .limit(1)
    .single()

  if (!user) return null

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', user.organization_id)
    .single()

  if (!org) return null

  const settings = org.settings as OrganizationSettings | null
  return settings?.security ?? null
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

    // Look up org-specific lockout settings
    const security = await getOrgSecuritySettings(email)
    const lockoutOptions = security
      ? { maxAttempts: security.max_login_attempts, lockoutMinutes: security.lockout_duration_minutes }
      : undefined

    if (action === 'check') {
      const status = await checkLockout(email, lockoutOptions)
      return NextResponse.json(status)
    }

    if (action === 'record') {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      await recordLoginAttempt(email, !!success, ip)
      return NextResponse.json({ recorded: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
