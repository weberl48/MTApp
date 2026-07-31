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
}
