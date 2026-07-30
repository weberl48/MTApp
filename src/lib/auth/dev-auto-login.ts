/**
 * Dev-only auto-login gate: on the local dev server, unauthenticated requests
 * are signed in as the seeded developer account so no credentials are needed.
 *
 * Triple-gated so it cannot exist anywhere else:
 *  1. NODE_ENV must be 'development' (dead code in production builds)
 *  2. DEV_AUTO_LOGIN=1 must be set explicitly (.env.local only, never Vercel)
 *  3. The Supabase URL must be the MCA-Dev project — a misconfigured env can
 *     never auto-login against production
 *
 * Auth pages are exempt so manual login (e.g. as dev-contractor), sign-out,
 * and the e2e suite's login helper behave exactly as in production.
 */

const DEV_SUPABASE_REF = 'gzrukevymmguqxuoynqk'
const EXEMPT_PREFIXES = ['/login', '/signup', '/reset-password', '/auth', '/mfa-verify']

export const DEV_AUTO_LOGIN_EMAIL = 'dev-owner@maycreativearts.test'

export function shouldDevAutoLogin(opts: {
  nodeEnv: string | undefined
  flag: string | undefined
  supabaseUrl: string | undefined
  password: string | undefined
  pathname: string
  hasUser: boolean
}): boolean {
  if (opts.nodeEnv !== 'development') return false
  if (opts.flag !== '1') return false
  if (!opts.supabaseUrl?.includes(DEV_SUPABASE_REF)) return false
  if (!opts.password) return false
  if (opts.hasUser) return false
  return !EXEMPT_PREFIXES.some(p => opts.pathname.startsWith(p))
}
