import type { WalkthroughAudience } from '@/lib/walkthroughs/audience'

export type WalkthroughStep = {
  title: string
  description: string
  /**
   * Limit this single step to a role (see Walkthrough.audience). The provider
   * drops non-matching steps at start, so a shared tour (e.g. App Overview)
   * never shows a contractor a step about admin-only navigation.
   */
  audience?: WalkthroughAudience
  /** Replaces `description` below Tailwind's lg breakpoint, for steps where
   *  the mobile UI differs (drawer nav, floating action button). */
  mobileDescription?: string
  /**
   * CSS selector for the element to highlight. Supports comma-separated
   * fallbacks — the first VISIBLE match wins (e.g. a desktop button first,
   * a mobile FAB second). When nothing matches/is visible, the popover
   * renders centered instead of highlighting a hidden element.
   */
  element?: string
  // driver.js 1.6 dropped 'over' from its Side type; no walkthrough ever used it.
  popoverSide?: 'top' | 'right' | 'bottom' | 'left'
  /**
   * Label for THIS step's Next button — say what pressing it does ("Next",
   * "Open the Form", "Finish" on the last step), so page jumps and dialog
   * openings never surprise the user.
   */
  ctaLabel: string
  href: string
  /**
   * The target lives inside the sidebar nav. On mobile the sidebar is an
   * off-canvas drawer, so the provider opens it for this step (and closes
   * it for steps without this flag).
   */
  mobileNav?: boolean
  /**
   * Selector for a control to click while waiting for `element` to appear —
   * for targets that only mount after activating something (e.g. a tab's
   * content panel). Clicked only when the step's page is ready and `element`
   * still isn't visible, so it must be safe to click repeatedly.
   */
  preClick?: string
}

export type Walkthrough = {
  id: string
  name: string
  description: string
  /**
   * Who this tour is for; omit for everyone. 'admin' = admin/owner/developer,
   * 'owner' = owner/developer, 'contractor' = contractors (the only role that
   * can even open pages like /earnings/). Must stay consistent with the
   * launching help article's adminOnly flag (enforced by the help integrity
   * test: admin/owner tours need an adminOnly article, contractor/everyone
   * tours need a contractor-visible one). Used to hide the tour in the Guided
   * Tours card, on article pages, and when suggesting the next tour.
   */
  audience?: WalkthroughAudience
  steps: WalkthroughStep[]
}
