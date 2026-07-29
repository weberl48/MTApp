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
 * Dev-only: mirror server-side errors to the local dev portal
 * (tools/dev-portal) so they show up in its error feed. Sends the same
 * PHI-safe name/message shape that gets logged — never full error objects.
 */
function forwardToDevPortal(message: string, safeError?: { name: string; message: string } | string) {
  if (process.env.NODE_ENV !== 'development') return
  try {
    const portalUrl = process.env.DEV_PORTAL_URL || 'http://localhost:4321'
    fetch(`${portalUrl}/api/errors`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'backend',
        kind: typeof safeError === 'object' && safeError ? safeError.name : 'logger.error',
        message: [message, typeof safeError === 'string' ? safeError : safeError?.message]
          .filter(Boolean)
          .join(' — '),
      }),
      signal: AbortSignal.timeout(1500),
    }).catch(() => {
      // Portal not running — drop it, never disrupt the app.
    })
  } catch {
    // Same: dev telemetry must never throw.
  }
}
