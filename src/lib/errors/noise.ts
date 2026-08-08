/**
 * Framework and browser noise that must never reach the error feed.
 *
 * WHY THIS EXISTS
 * Promoting the reporter to production means every `console.error` on the page
 * gets shipped — including Next.js's own. A short verification session produced
 * 112 rows of `Failed to fetch RSC payload`, none of which was an application
 * bug. A feed nobody trusts is a feed nobody reads, and the whole point of this
 * system is that someone reads it.
 *
 * THE BAR FOR ADDING A PATTERN
 * Only add something the app cannot act on: emitted by the framework, the
 * browser, or an extension, and not caused by our code. When in doubt, leave it
 * in — a noisy feed is recoverable, a filtered-out real bug is invisible.
 * Everything here is a substring/regex match on the message, never on the kind,
 * so a genuine `TypeError` is never silenced by accident.
 */

const NOISE_PATTERNS: { pattern: RegExp; why: string }[] = [
  {
    // Next.js client router losing a prefetch/navigation payload. Fires on any
    // flaky network hop and self-heals with a full navigation.
    pattern: /Failed to fetch RSC payload/i,
    why: 'Next.js router prefetch miss; falls back to browser navigation',
  },
  {
    // Benign per spec; browsers report it, nothing can act on it.
    pattern: /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i,
    why: 'benign ResizeObserver notice',
  },
  {
    // Chrome extensions talking to a page they were injected into.
    pattern: /Extension context invalidated|chrome-extension:\/\/|moz-extension:\/\//i,
    why: 'browser extension, not our code',
  },
  {
    // Fired when the user navigates away mid-request. Not a failure.
    pattern: /The (operation was aborted|user aborted a request)|AbortError/i,
    why: 'request aborted by navigation',
  },
  {
    // React dev-only advisory noise; never actionable from a production feed.
    pattern: /Warning: .*(did not match|useLayoutEffect does nothing on the server)/i,
    why: 'React hydration/SSR advisory',
  },
  {
    // Cross-origin script errors carry no message, file or line — literally
    // nothing to act on.
    pattern: /^Script error\.?$/i,
    why: 'opaque cross-origin script error',
  },
]

/**
 * True when this error is framework/browser noise and should never be reported.
 * Empty or whitespace-only messages are noise too — a row with no message is
 * pure cost.
 */
export function isIgnorableClientError(message: string | null | undefined): boolean {
  if (!message || !message.trim()) return true
  return NOISE_PATTERNS.some(({ pattern }) => pattern.test(message))
}

/** Exposed for the test, so a new pattern cannot be added without a reason. */
export const NOISE_PATTERN_COUNT = NOISE_PATTERNS.length
export const NOISE_REASONS = NOISE_PATTERNS.map((p) => p.why)
