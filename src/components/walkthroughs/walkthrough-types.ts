export type WalkthroughStep = {
  title: string
  description: string
  /**
   * CSS selector for the element to highlight. Supports comma-separated
   * fallbacks — the first VISIBLE match wins (e.g. a desktop button first,
   * a mobile FAB second). When nothing matches/is visible, the popover
   * renders centered instead of highlighting a hidden element.
   */
  element?: string
  popoverSide?: 'top' | 'right' | 'bottom' | 'left' | 'over'
  ctaLabel: string
  href: string
  /**
   * The target lives inside the sidebar nav. On mobile the sidebar is an
   * off-canvas drawer, so the provider opens it for this step (and closes
   * it for steps without this flag).
   */
  mobileNav?: boolean
}

export type Walkthrough = {
  id: string
  name: string
  description: string
  steps: WalkthroughStep[]
}
