const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ENCRYPTION_KEY',
] as const

const RECOMMENDED_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'RESEND_API_KEY',
  'EMAIL_FROM_DOMAIN',
] as const

export function validateEnv() {
  if (process.env.NODE_ENV !== 'production') return

  const missing = REQUIRED_VARS.filter(v => !process.env[v])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  const missingRecommended = RECOMMENDED_VARS.filter(v => !process.env[v])
  if (missingRecommended.length > 0) {
    console.warn(`[MCA] Missing recommended environment variables: ${missingRecommended.join(', ')}`)
  }
}
