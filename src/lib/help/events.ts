import { createClient } from '@/lib/supabase/client'

/** Canonical form for dedupe + storage: trimmed, lowercased, single spaces. */
export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Session-scoped dedupe: returns true the first time a query is seen. */
export function createSearchMissGate(): (q: string) => boolean {
  const seen = new Set<string>()
  return (q: string) => {
    const key = normalizeQuery(q)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }
}

function fireAndForget(insert: PromiseLike<unknown>) {
  insert.then(() => {}, () => {}) // help telemetry must never surface errors
}

export function logSearchMiss(orgId: string, userId: string, query: string): void {
  try {
    fireAndForget(
      createClient().from('help_events').insert({
        organization_id: orgId,
        user_id: userId,
        event_type: 'search_miss',
        query: normalizeQuery(query).slice(0, 200),
      })
    )
  } catch {
    // never break the page over telemetry
  }
}

/**
 * A walkthrough step's target element couldn't be found (UI drift, role
 * hiding it, empty list) and the popover fell back to centered. Recorded so
 * broken tours surface on the Help gaps card instead of failing silently.
 * Requires the 20260730_walkthrough_fallback_events migration; until it's
 * applied the insert fails the CHECK constraint and is swallowed.
 */
export function logWalkthroughFallback(orgId: string, userId: string, walkthroughId: string, stepTitle: string): void {
  try {
    fireAndForget(
      createClient().from('help_events').insert({
        organization_id: orgId,
        user_id: userId,
        event_type: 'walkthrough_fallback',
        article_slug: walkthroughId,
        query: stepTitle.slice(0, 200),
      })
    )
  } catch {
    // never break the page over telemetry
  }
}

export function logArticleFeedback(orgId: string, userId: string, slug: string, helpful: boolean): void {
  try {
    fireAndForget(
      createClient().from('help_events').insert({
        organization_id: orgId,
        user_id: userId,
        event_type: 'article_feedback',
        article_slug: slug,
        helpful,
      })
    )
  } catch {
    // never break the page over telemetry
  }
}
