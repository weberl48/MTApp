/**
 * Helpers for the dev-only error reporter that forwards browser errors to the
 * local dev portal (tools/dev-portal). Nothing here runs in production.
 */

export interface DevErrorPayload {
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
