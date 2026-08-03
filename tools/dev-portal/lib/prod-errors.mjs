/**
 * Production error feed.
 *
 * The app cannot post to this portal from Vercel — the portal lives on the LAN.
 * Instead production appends to `public.app_errors` in its own Supabase project
 * (see supabase/migrations/20260803_app_errors.sql) and we pull from there using
 * the same Management API token the cert panel already uses.
 *
 * Read-only, and failures degrade to an empty list: a portal that cannot reach
 * Supabase should show the local feed, not an error page.
 */
import { ENVIRONMENTS } from '../config.mjs'

const PROD = ENVIRONMENTS.find((e) => e.key === 'prod')
const LIMIT = 100

let cache = { at: 0, rows: [] }
const CACHE_MS = 20_000

export async function prodErrors(repoEnv) {
  const token = repoEnv?.SUPABASE_ACCESS_TOKEN
  if (!token || !PROD?.supabaseRef) return []

  if (Date.now() - cache.at < CACHE_MS) return cache.rows

  const sql = `select id, created_at, environment, source, kind, message, path
               from public.app_errors
               order by created_at desc
               limit ${LIMIT}`

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROD.supabaseRef}/database/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query: sql }),
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return cache.rows
    const rows = await res.json()
    if (!Array.isArray(rows)) return cache.rows

    // Same record shape the local ring buffer produces, so the existing feed UI
    // renders these without any front-end change. Negative ids keep them from
    // colliding with locally captured errors.
    cache = {
      at: Date.now(),
      rows: rows.map((r) => ({
        id: -Number(r.id),
        ts: r.created_at,
        source: r.source === 'frontend' ? 'frontend' : 'backend',
        kind: String(r.kind || 'error').slice(0, 60),
        message: String(r.message || '(no message)').slice(0, 2000),
        url: r.path || undefined,
        env: r.environment || 'production',
      })),
    }
    return cache.rows
  } catch {
    return cache.rows
  }
}
