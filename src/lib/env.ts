import { PILOT_ENV_VAR, isPilotModeActive, getPilotRecipients } from './email/pilot'

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ENCRYPTION_KEY',
] as const

const RECOMMENDED_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'RESEND_API_KEY',
  'EMAIL_FROM_DOMAIN', // getFromAddress() throws without it — every send fails
  'EMAIL_REPLY_TO', // without it mail sends from noreply@ with no reply path
  'ANTHROPIC_API_KEY', // AI help assistant (feature hides itself when absent)
  // Both of these now fail CLOSED at their route (401/503) rather than falling
  // open, so a missing value is an outage, not a hole. They are warned rather
  // than required so adding this check cannot itself take production down on
  // the next deploy — promote them into REQUIRED_VARS once you have confirmed
  // both are set in the Vercel Production scope.
  'CRON_SECRET', // all four cron routes + /api/health detail + /api/health/restore
  'SQUARE_WEBHOOK_SIGNATURE_KEY', // /api/webhooks/square rejects everything without it
] as const

export function validateEnv() {
  if (process.env.NODE_ENV !== 'production') return
  // Skip during next build — server-side vars aren't available at build time.
  // The proxy enforces ENCRYPTION_KEY at runtime instead.
  if (process.env.NEXT_PHASE === 'phase-production-build') return

  const missing = REQUIRED_VARS.filter(v => !process.env[v])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Email config is a pair: a Resend key without the verified sending domain
  // means getFromAddress() throws on EVERY send while /api/health stays green
  // (it only checks the key). Half-configured email fails the boot instead of
  // failing at send time. No key at all stays a warning — email is optional.
  if (process.env.RESEND_API_KEY && !process.env.EMAIL_FROM_DOMAIN) {
    throw new Error(
      'EMAIL_FROM_DOMAIN is required when RESEND_API_KEY is set — without it every email send throws at getFromAddress()'
    )
  }

  const missingRecommended = RECOMMENDED_VARS.filter(v => !process.env[v])
  if (missingRecommended.length > 0) {
    console.warn(`[MCA] Missing recommended environment variables: ${missingRecommended.join(', ')}`)
  }

  // Pilot mode redirects every client-facing email to a fixed tester list.
  // It's easy to forget it's armed after a deploy, so call it out loudly in
  // boot logs every time — an unusable list is an ERROR (sending will throw
  // at send time), a usable one is a prominent WARNING naming the recipients.
  if (isPilotModeActive()) {
    const recipients = getPilotRecipients()
    if (recipients.length === 0) {
      console.error(
        `[MCA] ${PILOT_ENV_VAR} is set but contains no usable email address — all client-facing email sends will throw until it is fixed or unset.`
      )
    } else {
      console.warn(
        `[MCA] PILOT MODE ACTIVE — all client-facing email is being redirected to: ${recipients.join(', ')}. Unset ${PILOT_ENV_VAR} to resume normal delivery.`
      )
    }
  }
}
