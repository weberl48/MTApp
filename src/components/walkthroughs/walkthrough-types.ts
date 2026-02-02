export type WalkthroughStep = {
  title: string
  description: string
  ctaLabel: string
  href: string
}

export type Walkthrough = {
  id: string
  name: string
  description: string
  steps: WalkthroughStep[]
}
