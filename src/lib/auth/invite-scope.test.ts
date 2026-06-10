import { describe, it, expect } from 'vitest'
import { canTargetOrgForInvite } from './invite-scope'

describe('canTargetOrgForInvite (regression for #3 — cross-org invite injection)', () => {
  it('blocks an admin from inviting into another org', () => {
    expect(canTargetOrgForInvite('admin', 'orgA', 'orgB')).toBe(false)
  })

  it('allows an admin to invite into their own org', () => {
    expect(canTargetOrgForInvite('admin', 'orgA', 'orgA')).toBe(true)
  })

  it('allows developers and owners to invite into any org (intentional cross-org access)', () => {
    expect(canTargetOrgForInvite('developer', 'orgA', 'orgB')).toBe(true)
    expect(canTargetOrgForInvite('owner', 'orgA', 'orgB')).toBe(true)
  })

  it('blocks a non-privileged caller that has no org of their own', () => {
    // Role validity is enforced separately in the route; this helper only scopes by org.
    expect(canTargetOrgForInvite('admin', null, 'orgB')).toBe(false)
    expect(canTargetOrgForInvite('admin', undefined, 'orgA')).toBe(false)
  })
})
