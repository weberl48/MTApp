/**
 * Dev-only auto-login gate: on the local dev server, unauthenticated requests
 * are signed in as the seeded developer account so no credentials are needed.
 *
 * Triple-gated so it cannot exist anywhere else:
 *  1. NODE_ENV must be 'development' (dead code in production builds)
 *  2. DEV_AUTO_LOGIN=1 must be set explicitly (.env.local only, never Vercel)
 *  3. The Supabase URL must be the LOCAL stack (loopback). This gate used to
 *     require the MCA-Dev ref, but that project became CERT and now holds real
 *     production PHI — so the old check pointed auto-login at exactly the
 *     database it was written to protect against. Loopback-only, plus an
 *     explicit blocklist, means a misconfigured env can reach neither cert nor
 *     production.
 *
 * Auth pages are exempt so manual login (e.g. as dev-contractor), sign-out,
 * and the e2e suite's login helper behave exactly as in production.
 */

/** Cloud projects auto-login must never touch: production and cert. */
const FORBIDDEN_REFS = ['ysmwowzxkgisshaormmf', 'gzrukevymmguqxuoynqk']
const EXEMPT_PREFIXES = ['/login', '/signup', '/reset-password', '/auth', '/mfa-verify']

export const DEV_AUTO_LOGIN_EMAIL = 'dev-owner@maycreativearts.test'

/**
 * True only for the local `supabase start` stack. Fail-closed: an unparseable or
 * absent URL is not local, and a known cloud ref is rejected even if it somehow
 * appeared on a loopback host.
 */
export function isLocalSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false
  if (FORBIDDEN_REFS.some(ref => url.includes(ref))) return false
  try {
    const { hostname } = new URL(url)
    return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]' || hostname === '::1'
  } catch {
    return false
  }
}

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
  if (!isLocalSupabaseUrl(opts.supabaseUrl)) return false
  if (!opts.password) return false
  if (opts.hasUser) return false
  return !EXEMPT_PREFIXES.some(p => opts.pathname.startsWith(p))
}
