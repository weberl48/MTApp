export type WalkthroughStep = {
  title: string
  description: string
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
   * content panel, a dialog trigger). Fired AT MOST ONCE per step transition,
   * when the step's page is ready and `element` hasn't appeared: dialog
   * triggers toggle, so the provider never re-fires it. Pressing Previous
   * away from a preClick step dispatches Escape to close what it opened.
   */
  preClick?: string
  /**
   * This step exists only for admins/owners (its target is admin-only UI).
   * The provider drops it from the tour for contractors instead of stalling
   * on a target their UI never renders.
   */
  adminOnly?: boolean
  /**
   * Keep the highlighted element non-interactive (driver.js
   * disableActiveInteraction). Use for form-field steps the user acts on
   * AFTER the tour — a highlighted Select would otherwise open its dropdown
   * underneath driver's overlay.
   */
  disableInteraction?: boolean
}

export type Walkthrough = {
  id: string
  name: string
  description: string
  /**
   * Tour covers admin/owner-only UI. Must stay in sync with the linked help
   * article's adminOnly flag (enforced by the help integrity test); used to
   * hide the tour from contractors in the Guided Tours card and when
   * suggesting the next tour after completion.
   */
  adminOnly?: boolean
  steps: WalkthroughStep[]
}
