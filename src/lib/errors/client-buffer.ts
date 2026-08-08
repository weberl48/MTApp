/**
 * A tiny in-memory ring of the JavaScript errors seen in this browser session.
 *
 * WHY
 * The single most useful thing a bug report can carry is what the console said
 * just before the user gave up. Asking them to paste it is hopeless, so the
 * error reporter feeds every error it sees into this buffer and the report form
 * attaches whatever is in it.
 *
 * Memory only, never persisted: this is a debugging convenience, not a record,
 * and it dies with the tab.
 */

export interface BufferedError {
  kind: string
  message: string
  at: string
}

export interface ErrorBuffer {
  record(kind: string, message: string): void
  /** Newest last. Full messages — for Supabase only, never for GitHub. */
  snapshot(): BufferedError[]
  /** Kinds and counts, newest kind first. This is the GitHub-safe view. */
  summarizeKinds(): { kind: string; count: number }[]
  clear(): void
}

export const DEFAULT_CAPACITY = 20
const MAX_MESSAGE = 500

export function createErrorBuffer(
  capacity: number = DEFAULT_CAPACITY,
  now: () => Date = () => new Date()
): ErrorBuffer {
  let entries: BufferedError[] = []

  return {
    record(kind, message) {
      entries.push({
        kind: String(kind || 'error').slice(0, 60),
        message: String(message || '').slice(0, MAX_MESSAGE),
        at: now().toISOString(),
      })
      // Drop oldest past capacity — a render loop must not grow this without
      // bound, and the errors right before the report are the relevant ones.
      if (entries.length > capacity) entries = entries.slice(entries.length - capacity)
    },

    snapshot() {
      return [...entries]
    },

    summarizeKinds() {
      const counts = new Map<string, number>()
      // Reverse so the most recently seen kind leads the list.
      for (let i = entries.length - 1; i >= 0; i--) {
        const { kind } = entries[i]
        counts.set(kind, (counts.get(kind) ?? 0) + 1)
      }
      return [...counts].map(([kind, count]) => ({ kind, count }))
    },

    clear() {
      entries = []
    },
  }
}

/** The app-wide buffer. One per tab, by construction. */
export const clientErrorBuffer = createErrorBuffer()
