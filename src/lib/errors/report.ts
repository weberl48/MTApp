/**
 * Helpers for the browser error reporter.
 *
 * This used to live under `dev/` and run only in development, forwarding to the
 * local dev portal. It now runs in production too, posting to /api/errors/ which
 * writes to `app_errors` — so treat everything here as production code. The
 * throttle below is what stands between one broken render loop and a few
 * thousand rows.
 */

export interface ErrorReportPayload {
  source: 'frontend' | 'backend'
  kind: string
  message: string
  stack?: string
  url?: string
}

/**
 * Gate that keeps the reporter from flooding the portal: identical errors are
 * suppressed for `dedupeMs`, and at most `maxPerWindow` reports pass per
 * `windowMs` regardless of key.
 */
export function createReportGate({
  now = Date.now,
  dedupeMs = 5_000,
  windowMs = 60_000,
  maxPerWindow = 20,
}: {
  now?: () => number
  dedupeMs?: number
  windowMs?: number
  maxPerWindow?: number
} = {}): (key: string) => boolean {
  const lastSeen = new Map<string, number>()
  let windowStart = 0
  let windowCount = 0

  return function shouldReport(key: string): boolean {
    const t = now()
    const prev = lastSeen.get(key)
    if (prev !== undefined && t - prev < dedupeMs) return false

    if (t - windowStart >= windowMs) {
      windowStart = t
      windowCount = 0
    }
    if (windowCount >= maxPerWindow) return false

    lastSeen.set(key, t)
    windowCount++

    if (lastSeen.size > 200) {
      for (const [k, seen] of lastSeen) {
        if (t - seen > dedupeMs) lastSeen.delete(k)
      }
    }
    return true
  }
}

/** Render one console.error argument as text without ever throwing. */
export function formatConsoleArg(arg: unknown): string {
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`
  if (typeof arg === 'string') return arg
  try {
    return JSON.stringify(arg) ?? String(arg)
  } catch {
    return '[unserializable]'
  }
}

export function consoleArgsToMessage(args: unknown[]): string {
  return args.map(formatConsoleArg).join(' ').slice(0, 2000)
}
