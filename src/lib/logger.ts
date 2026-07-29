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
