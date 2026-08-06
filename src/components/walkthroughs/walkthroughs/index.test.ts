import { describe, it, expect } from 'vitest'
import { canStartWalkthrough, ALL_WALKTHROUGHS } from './index'
import type { AudienceFlags } from '@/lib/walkthroughs/audience'

const CONTRACTOR: AudienceFlags = { isAdmin: false, isOwner: false, isContractor: true }
const ADMIN: AudienceFlags = { isAdmin: true, isOwner: false, isContractor: false }

describe('canStartWalkthrough', () => {
  it('rejects missing or unknown ids', () => {
    expect(canStartWalkthrough(undefined, ADMIN)).toBe(false)
    expect(canStartWalkthrough('no-such-tour', ADMIN)).toBe(false)
  })

  it('enforces audience', () => {
    expect(canStartWalkthrough('client-portal', ADMIN)).toBe(true)
    expect(canStartWalkthrough('client-portal', CONTRACTOR)).toBe(false)
  })

  it('hides a feature-gated tour when its flag is off', () => {
    expect(
      canStartWalkthrough('client-portal', ADMIN, { features: { client_portal: false } })
    ).toBe(false)
    expect(
      canStartWalkthrough('client-portal', ADMIN, { features: { client_portal: true } })
    ).toBe(true)
  })

  it('fails open when settings are absent or silent on the flag', () => {
    expect(canStartWalkthrough('client-portal', ADMIN)).toBe(true)
    expect(canStartWalkthrough('client-portal', ADMIN, null)).toBe(true)
    expect(canStartWalkthrough('client-portal', ADMIN, {})).toBe(true)
    expect(canStartWalkthrough('client-portal', ADMIN, { features: {} })).toBe(true)
  })

  it('does not gate tours without requiresFeature on any flag', () => {
    const settings = { features: { client_portal: false, ai_help: false } }
    for (const w of ALL_WALKTHROUGHS.filter((w) => !w.requiresFeature && !w.audience)) {
      expect(canStartWalkthrough(w.id, ADMIN, settings)).toBe(true)
    }
  })

  it('every requiresFeature tour highlights something only rendered behind that feature', () => {
    // Guard against the inverse regression: if a tour gains steps targeting
    // feature-gated UI, it should declare requiresFeature. Today that is
    // exactly the client-portal tour and its Portal Access card steps.
    const portal = ALL_WALKTHROUGHS.find((w) => w.id === 'client-portal')
    expect(portal?.requiresFeature).toBe('client_portal')
  })
})
