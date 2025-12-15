import { OWNER_ONBOARDING_STEPS, OWNER_ONBOARDING_WIZARD_KEY } from './owner-onboarding-wizard'

describe('owner onboarding wizard metadata', () => {
  it('has a stable wizard key', () => {
    expect(OWNER_ONBOARDING_WIZARD_KEY).toBe('owner_v1')
  })

  it('defines a non-empty set of steps with routes', () => {
    expect(OWNER_ONBOARDING_STEPS.length).toBeGreaterThan(0)

    for (const step of OWNER_ONBOARDING_STEPS) {
      expect(step.title).toBeTruthy()
      expect(step.description).toBeTruthy()
      expect(step.ctaLabel).toBeTruthy()
      expect(step.href.startsWith('/')).toBe(true)
    }
  })
})


