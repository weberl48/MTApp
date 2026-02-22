export type WalkthroughStep = {
  title: string
  description: string
  element?: string // CSS selector for the element to highlight
  ctaLabel: string
  href: string
}

export type Walkthrough = {
  id: string
  name: string
  description: string
  steps: WalkthroughStep[]
}
