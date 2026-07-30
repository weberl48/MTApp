import { describe, it, expect } from 'vitest'
import { buildHelpCorpus, buildOrgContext, HELP_AI_SYSTEM_RULES } from './ai'
import { DEFAULT_SETTINGS } from '@/lib/organization/settings'
import type { ServiceType } from '@/types/database'

const svc = {
  id: 's1',
  name: 'In-Home Individual',
  base_rate: 80,
  per_person_rate: 0,
  mca_percentage: 25,
  contractor_cap: null,
  rent_percentage: 0,
} as unknown as ServiceType

describe('buildHelpCorpus', () => {
  it('full corpus includes admin-only and public content', () => {
    const full = buildHelpCorpus(true)
    expect(full).toContain('generating-invoices') // adminOnly article
    expect(full).toContain('my-earnings') // public article
    expect(full).toContain('why-no-invoice') // adminOnly FAQ id
  })

  it('contractor corpus contains zero admin-only content', () => {
    const c = buildHelpCorpus(false)
    expect(c).not.toContain('generating-invoices')
    expect(c).not.toContain('scholarship-billing')
    expect(c).toContain('my-earnings')
    expect(c).toContain('installing-the-app')
  })

  it('is deterministic', () => {
    expect(buildHelpCorpus(true)).toBe(buildHelpCorpus(true))
  })
})

describe('buildOrgContext', () => {
  it('includes whitelisted settings and excludes security', () => {
    const ctx = buildOrgContext('May Creative Arts', DEFAULT_SETTINGS, [svc], 'owner')
    expect(ctx).toContain('May Creative Arts')
    expect(ctx).toContain('no_show_fee')
    expect(ctx).not.toContain('lockout')
    expect(ctx).not.toContain('max_login_attempts')
  })

  it('hides financial fields from contractors, shows them to owners', () => {
    const owner = buildOrgContext('X', DEFAULT_SETTINGS, [svc], 'owner')
    const contractor = buildOrgContext('X', DEFAULT_SETTINGS, [svc], 'contractor')
    expect(owner).toContain('mca_percentage')
    expect(contractor).not.toContain('mca_percentage')
    expect(contractor).toContain('In-Home Individual') // still sees the service list
  })
})

describe('HELP_AI_SYSTEM_RULES', () => {
  it('mandates sources and forbids invention', () => {
    expect(HELP_AI_SYSTEM_RULES).toMatch(/Sources:/)
    expect(HELP_AI_SYSTEM_RULES).toMatch(/\[\[/)
  })
})
