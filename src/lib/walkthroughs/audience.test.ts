import { describe, it, expect } from 'vitest'
import { audienceAllows, visibleWalkthroughSteps, type AudienceFlags } from './audience'

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
