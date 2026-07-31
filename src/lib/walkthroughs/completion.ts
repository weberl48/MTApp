/**
 * Completed-walkthrough tracking and the recommended onboarding order.
 *
 * Completion is stored per-browser in localStorage: it's a learning aid, not
 * authoritative user data, so device-local is fine and keeps this PHI-free.
 * All functions are safe to call during SSR (no-ops without a window).
 */

export const COMPLETED_WALKTHROUGHS_KEY = 'mca-completed-walkthroughs'
/** Dispatched on window whenever the completed set changes. */
export const WALKTHROUGHS_CHANGED_EVENT = 'mca:walkthroughs-changed'

/**
 * Suggested order for new staff — mirrors the Admin Onboarding Guide: orient,
 * learn the daily review job, then the surrounding money workflows, then team,
 * with owner-level configuration tours last. Each user only sees the tours
 * their role's audience allows, so the effective list stays short (e.g.
 * contractors get app-overview → log-session → my-earnings).
 */
export const RECOMMENDED_WALKTHROUGH_ORDER = [
  'app-overview',
  'approve-sessions',
  'log-session',
  'add-client',
  'send-invoice',
  'scholarship-billing',
  'payroll',
  'my-earnings',
  'invite-contractor',
  'contractor-rates',
  'configure-services',
  'edit-service-type',
  'automation',
  'custom-lists',
  'analytics',
] as const

export function getCompletedWalkthroughs(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(COMPLETED_WALKTHROUGHS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function markWalkthroughCompleted(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const completed = getCompletedWalkthroughs()
    if (!completed.includes(id)) {
      window.localStorage.setItem(COMPLETED_WALKTHROUGHS_KEY, JSON.stringify([...completed, id]))
    }
    window.dispatchEvent(new CustomEvent(WALKTHROUGHS_CHANGED_EVENT))
  } catch {
    // storage unavailable (private mode, quota) — tracking is best-effort
  }
}

/**
 * The next tour to suggest after finishing `justCompleted`: the first
 * recommended tour that isn't done yet and passes the `allowed` filter
 * (used to skip admin-only tours for contractors).
 */
export function nextRecommendedWalkthrough(
  justCompleted: string,
  completed: string[] = getCompletedWalkthroughs(),
  allowed: (id: string) => boolean = () => true
): string | null {
  const done = new Set([...completed, justCompleted])
  return RECOMMENDED_WALKTHROUGH_ORDER.find((id) => !done.has(id) && allowed(id)) ?? null
}
