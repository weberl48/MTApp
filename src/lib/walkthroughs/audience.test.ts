import { describe, it, expect } from 'vitest'
import { audienceAllows, visibleWalkthroughSteps, type AudienceFlags } from './audience'
import { ALL_WALKTHROUGHS } from '@/components/walkthroughs/walkthroughs'

const CONTRACTOR: AudienceFlags = { isAdmin: false, isOwner: false, isContractor: true }
const ADMIN: AudienceFlags = { isAdmin: true, isOwner: false, isContractor: false }
const OWNER: AudienceFlags = { isAdmin: true, isOwner: true, isContractor: false }

describe('audienceAllows', () => {
  it('no audience means everyone', () => {
    expect(audienceAllows(undefined, CONTRACTOR)).toBe(true)
    expect(audienceAllows(undefined, ADMIN)).toBe(true)
    expect(audienceAllows(undefined, OWNER)).toBe(true)
  })

  it('admin audience includes owners but not contractors', () => {
    expect(audienceAllows('admin', ADMIN)).toBe(true)
    expect(audienceAllows('admin', OWNER)).toBe(true)
    expect(audienceAllows('admin', CONTRACTOR)).toBe(false)
  })

  it('owner audience excludes plain admins', () => {
    expect(audienceAllows('owner', OWNER)).toBe(true)
    expect(audienceAllows('owner', ADMIN)).toBe(false)
    expect(audienceAllows('owner', CONTRACTOR)).toBe(false)
  })

  it('contractor audience is contractors only', () => {
    expect(audienceAllows('contractor', CONTRACTOR)).toBe(true)
    expect(audienceAllows('contractor', ADMIN)).toBe(false)
    expect(audienceAllows('contractor', OWNER)).toBe(false)
  })
})

describe('visibleWalkthroughSteps', () => {
  const steps = [
    { title: 'everyone' },
    { title: 'admin only', audience: 'admin' as const },
    { title: 'contractor only', audience: 'contractor' as const },
  ]

  it('keeps only the steps the role should see, in order', () => {
    expect(visibleWalkthroughSteps(steps, ADMIN).map((s) => s.title)).toEqual([
      'everyone',
      'admin only',
    ])
    expect(visibleWalkthroughSteps(steps, CONTRACTOR).map((s) => s.title)).toEqual([
      'everyone',
      'contractor only',
    ])
  })
})

/**
 * Selectors whose element only ever renders for an admin. A step pointing at one
 * without an admin/owner audience is offered to contractors and then highlights
 * nothing — they get a floating popover describing UI they don't have, and (for a
 * real contractor, where View As isn't active) it logs a permanent false gap to
 * the owner's Help gaps card. Add a selector here whenever a tour starts pointing
 * at another admin-gated surface.
 */
const ADMIN_ONLY_TOUR_TARGETS = [
  // src/app/(dashboard)/dashboard/page.tsx renders this behind `stats.isAdmin`
  '[data-tour="dashboard-action-center"]',
]

describe('walkthrough steps vs. the roles they are offered to', () => {
  it('never points a contractor-visible step at admin-only UI', () => {
    const offenders: string[] = []
    for (const w of ALL_WALKTHROUGHS) {
      if (!audienceAllows(w.audience, CONTRACTOR)) continue
      for (const step of visibleWalkthroughSteps(w.steps, CONTRACTOR)) {
        const hit = ADMIN_ONLY_TOUR_TARGETS.find((sel) => step.element?.includes(sel))
        if (hit) offenders.push(`${w.id} / "${step.title}" targets ${hit}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('gives each role its own App Overview', () => {
    const appOverview = ALL_WALKTHROUGHS.find((w) => w.id === 'app-overview')!
    const titles = (flags: AudienceFlags) =>
      visibleWalkthroughSteps(appOverview.steps, flags).map((s) => s.title)

    // Contractors skip the admin surfaces and get the Earnings stop instead.
    expect(titles(CONTRACTOR)).toEqual([
      'Welcome to the Dashboard',
      'Recent Sessions',
      'Sessions',
      'Earnings',
      'Settings',
    ])
    expect(titles(ADMIN)).toEqual([
      'Welcome to the Dashboard',
      'Action Center',
      'Recent Sessions',
      'Sessions',
      'Clients',
      'Invoices',
      'Settings',
    ])
    expect(titles(OWNER)).toEqual(titles(ADMIN))
  })
})
