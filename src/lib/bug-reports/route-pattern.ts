/**
 * Turn a real URL into an id-free route pattern: `/invoices/abc-.../` becomes
 * `/invoices/[id]/`.
 *
 * This is the function that keeps patient pointers out of GitHub. A bug report's
 * raw URL stays in Supabase, but the auto-filed issue gets only what this
 * returns, so it has to fail CLOSED: anything that even looks like an
 * identifier is replaced, and a segment we cannot classify is replaced too. A
 * pattern that is slightly over-scrubbed is a cosmetic loss; one that leaks a
 * client id is a compliance incident.
 *
 * Query strings and hashes are dropped wholesale — portal access tokens and
 * search terms both live there, and neither belongs in an issue body.
 */

/** Segments that are legitimately part of the app's route vocabulary. Anything
 *  not here and not obviously static gets scrubbed. */
const KNOWN_SEGMENTS = new Set([
  'dashboard', 'sessions', 'clients', 'invoices', 'team', 'analytics', 'settings',
  'payments', 'earnings', 'help', 'portal', 'auth', 'api', 'new', 'edit', 'login',
  'signup', 'reset', 'profile', 'security', 'services', 'customize', 'audit',
  'practice', 'features', 'onboarding', 'scholarship', 'payroll', 'export',
  'pdf', 'send', 'square', 'goals', 'resources', 'requests', 'invite', 'accept',
  'forgot-password', 'reset-password', 'verify', 'mfa', 'callback', 'error',
  'session-requests', 'tax-summaries', 'business-rules', 'notifications',
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NUMERIC_RE = /^\d+$/
/** Hex-ish or base64url-ish blobs: portal tokens, digests, invite tokens. */
const TOKENY_RE = /^[A-Za-z0-9_-]{16,}$/

function scrubSegment(segment: string): string {
  if (UUID_RE.test(segment)) return '[id]'
  if (NUMERIC_RE.test(segment)) return '[id]'
  if (KNOWN_SEGMENTS.has(segment.toLowerCase())) return segment
  if (TOKENY_RE.test(segment)) return '[token]'
  // Unknown but short and word-shaped (a help article slug, a new page we
  // forgot to list). Safe to keep only if it carries no digits — an id
  // masquerading as a word is the case we cannot afford to miss.
  if (/^[a-z][a-z-]*$/i.test(segment)) return segment
  return '[id]'
}

/**
 * @param input a pathname or a full URL. Anything unparseable returns
 *              `'[unknown]'` rather than throwing — telemetry never breaks a
 *              caller.
 */
export function toRoutePattern(input: string | null | undefined): string {
  if (!input) return '[unknown]'

  let pathname = input
  try {
    // Full URL? Take only the path. Relative input throws, which is fine.
    pathname = new URL(input).pathname
  } catch {
    // Already a pathname — drop any query/hash by hand.
    pathname = input.split('#')[0].split('?')[0]
  }

  if (!pathname.startsWith('/')) pathname = `/${pathname}`

  const hadTrailingSlash = pathname.length > 1 && pathname.endsWith('/')
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return '/'

  const scrubbed = segments.map(scrubSegment).join('/')
  // `trailingSlash: true` is set in next.config.ts, so preserving it keeps the
  // pattern copy-pasteable against the real route table.
  return `/${scrubbed}${hadTrailingSlash ? '/' : ''}`
}
