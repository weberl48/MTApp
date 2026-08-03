/**
 * Safe logger that prevents PHI from leaking to console.
 *
 * Rules:
 * - Never pass full database objects (may contain notes, client info)
 * - Only log IDs, counts, status codes, and safe metadata
 * - Use logger.dev() for debug logging that should not appear in production
 */
export const logger = {
  /** Log general info — never pass PHI fields */
  // '%s' keeps the message a plain argument: a '%' inside interpolated data can
  // never act as a console format directive (CodeQL js/tainted-format-string).
  info(message: string, data?: Record<string, string | number | boolean | null | undefined>) {
    console.log('[MCA] %s', message, data ? JSON.stringify(data) : '')
  },

  /** Log errors safely — extracts only name/message from Error objects */
  error(message: string, error?: unknown) {
    const safeError =
      error instanceof Error
        ? { name: error.name, message: error.message }
        : typeof error === 'string'
          ? error
          : undefined
    if (safeError) {
      console.error('[MCA] %s', message, safeError)
    } else {
      console.error('[MCA] %s', message)
    }
    forwardToDevPortal(message, safeError)
    recordProductionError(message, safeError)
  },

  /** Log warnings safely */
  warn(message: string, data?: Record<string, string | number | boolean | null | undefined>) {
    console.warn('[MCA] %s', message, data ? JSON.stringify(data) : '')
  },

  /** Development-only logging — stripped in production. Safe to pass any data. */
  dev(message: string, ...args: unknown[]) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MCA:dev] %s', message, ...args)
    }
  },
}

/**
 * Production counterpart to forwardToDevPortal.
 *
 * The dev portal lives on the LAN, so a Vercel deployment cannot post to it —
 * which is why production errors were captured nowhere at all. Instead the app
 * appends to `public.app_errors` in its own Supabase project, and the portal
 * reads that table through the Management API it already uses. No public ingest
 * endpoint, no third-party processor, and error text stays inside the project
 * that already holds the PHI.
 *
 * Written with plain fetch rather than the Supabase SDK on purpose: `logger` is
 * imported by `src/proxy.ts`, which Next bundles for the edge runtime, and
 * pulling the SDK in there would bloat (or break) that bundle.
 *
 * Rules this must never violate:
 *  - never throw, never block the caller (fire-and-forget)
 *  - never call logger.error on failure — that would recurse forever
 *  - only the PHI-safe { name, message } shape, same as what is console-logged
 */
function recordProductionError(message: string, safeError?: { name: string; message: string } | string) {
  if (process.env.NODE_ENV !== 'production') return

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return

  try {
    const detail = typeof safeError === 'string' ? safeError : safeError?.message
    fetch(`${url}/rest/v1/app_errors`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        environment: process.env.VERCEL_ENV || 'production',
        source: 'backend',
        kind: (typeof safeError === 'object' && safeError ? safeError.name : 'logger.error').slice(0, 60),
        message: [message, detail].filter(Boolean).join(' — ').slice(0, 4000),
      }),
      signal: AbortSignal.timeout(2000),
    }).catch(() => {
      // Swallowed deliberately: an error while recording an error must not
      // surface, retry, or recurse.
    })
  } catch {
    // Same reasoning — never let telemetry break the request it describes.
  }
}

/**
 * Dev-only: mirror server-side errors to the local dev portal
 * (tools/dev-portal) so they show up in its error feed. Sends the same
 * PHI-safe name/message shape that gets logged — never full error objects.
 */
function forwardToDevPortal(message: string, safeError?: { name: string; message: string } | string) {
  if (process.env.NODE_ENV !== 'development') return
  try {
    // Comma-separated list: the PC portal and (optionally) the Pi mirror.
    const targets = (process.env.DEV_PORTAL_URL || 'http://localhost:4321').split(',')
    const payload = JSON.stringify({
      source: 'backend',
      kind: typeof safeError === 'object' && safeError ? safeError.name : 'logger.error',
      message: [message, typeof safeError === 'string' ? safeError : safeError?.message]
        .filter(Boolean)
        .join(' — '),
    })
    for (const target of targets) {
      const url = target.trim()
      if (!url) continue
      fetch(`${url}/api/errors`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        signal: AbortSignal.timeout(1500),
      }).catch(() => {
        // Portal not running — drop it, never disrupt the app.
      })
    }
  } catch {
    // Same: dev telemetry must never throw.
  }
}
