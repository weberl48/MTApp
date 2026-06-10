import { createServiceClient } from '@/lib/supabase/service'

/** Default lockout settings (used when org settings aren't available pre-login) */
const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_LOCKOUT_MINUTES = 15

interface LockoutStatus {
  locked: boolean
  remainingMinutes: number
  attempts: number
  maxAttempts: number
}

/**
 * Check if an email is currently locked out due to too many failed login attempts.
 * Uses service role to bypass RLS (this runs before authentication).
 */
export async function checkLockout(
  email: string,
  ipAddress?: string | null,
  options?: { maxAttempts?: number; lockoutMinutes?: number }
): Promise<LockoutStatus> {
  const supabase = createServiceClient()
  const lockoutMinutes = options?.lockoutMinutes ?? DEFAULT_LOCKOUT_MINUTES
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS

  const windowStart = new Date(Date.now() - lockoutMinutes * 60 * 1000).toISOString()

  // Scope the lockout to the requesting IP so an attacker cannot lock out a victim's
  // account by spamming failed attempts from a different IP — the victim logging in from
  // their own (clean) IP is unaffected. Falls back to email-only when the IP is unknown
  // (local dev; in production the platform always sets x-forwarded-for).
  let countQuery = supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('email', email.toLowerCase())
    .eq('success', false)
  if (ipAddress) {
    countQuery = countQuery.eq('ip_address', ipAddress)
  }
  const { count } = await countQuery.gte('attempted_at', windowStart)

  const attempts = count ?? 0

  if (attempts >= maxAttempts) {
    // Find the most recent failed attempt (same scope) to calculate remaining lockout time
    let latestQuery = supabase
      .from('login_attempts')
      .select('attempted_at')
      .eq('email', email.toLowerCase())
      .eq('success', false)
    if (ipAddress) {
      latestQuery = latestQuery.eq('ip_address', ipAddress)
    }
    const { data: latest } = await latestQuery
      .order('attempted_at', { ascending: false })
      .limit(1)
      .single()

    if (latest) {
      const latestTime = new Date(latest.attempted_at).getTime()
      const unlockTime = latestTime + lockoutMinutes * 60 * 1000
      const remaining = Math.ceil((unlockTime - Date.now()) / 60000)

      if (remaining > 0) {
        return { locked: true, remainingMinutes: remaining, attempts, maxAttempts }
      }
    }
  }

  return { locked: false, remainingMinutes: 0, attempts, maxAttempts }
}

/**
 * Record a login attempt (success or failure).
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string
): Promise<void> {
  const supabase = createServiceClient()

  await supabase.from('login_attempts').insert({
    email: email.toLowerCase(),
    success,
    ip_address: ipAddress ?? null,
  })
}
