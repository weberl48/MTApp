/**
 * User-filed bug reports.
 *
 * Unlike prod-errors.mjs, this does NOT query Supabase directly. Bug report
 * descriptions are encrypted and screenshots need signed URLs, so the portal
 * asks each app's own /api/bug-reports/ endpoint, which already owns
 * ENCRYPTION_KEY and the storage client. Keeping the crypto in one codebase is
 * the whole point — a second implementation here is a second thing to get wrong
 * and a second place holding the key.
 *
 * Reads BOTH the local dev server and production, merged newest-first, the same
 * way the error feed merges its local ring buffer with prod's app_errors. A
 * panel that only ever showed production would be untestable while you were
 * building against it.
 *
 * Auth is the CRON_SECRET bearer, the same one that unlocks prod health detail.
 * Read-only, and failures degrade to whatever is already cached.
 */
import { ENVIRONMENTS } from '../config.mjs'

const LIMIT = 50

// Screenshot URLs are signed with a 10-minute TTL, so caching for long would
// hand the UI dead links. 60s is short enough to keep them live and long enough
// to survive a page refresh.
let cache = { at: 0, reports: [] }
const CACHE_MS = 60_000

/** Environments worth asking. Cert is skipped: it sits behind Vercel SSO. */
const TARGETS = ENVIRONMENTS.filter((e) => e.key === 'local' || e.key === 'prod')

async function fetchFrom(env, secret) {
  try {
    const res = await fetch(`${env.baseUrl}/api/bug-reports/?limit=${LIMIT}`, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const body = await res.json()
    if (!Array.isArray(body?.reports)) return []
    // Tag the origin: ids restart at 1 per database, so "#2" is ambiguous
    // without it, and a local report must never be mistaken for a real one.
    return body.reports.map((r) => ({ ...r, origin: env.key }))
  } catch {
    return []
  }
}

export async function bugReports(repoEnv, { force = false } = {}) {
  const secret = repoEnv?.CRON_SECRET
  if (!secret) return []

  if (!force && Date.now() - cache.at < CACHE_MS) return cache.reports

  const batches = await Promise.all(
    TARGETS.filter((e) => e.baseUrl).map((e) => fetchFrom(e, secret))
  )

  const merged = batches
    .flat()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))

  cache = { at: Date.now(), reports: merged }
  return merged
}
