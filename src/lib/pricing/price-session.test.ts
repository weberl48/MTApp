import { describe, it, expect } from 'vitest'
import type { ServiceType, OrganizationSettings } from '@/types/database'
import { calculateSessionPricing } from '@/lib/pricing'
import { sessionPricingInputs, priceFromInputs, pricingDiff } from './price-session'

const serviceType = (over: Partial<ServiceType> = {}): ServiceType =>
  ({
    id: 'svc-1',
    name: 'Individual',
    base_rate: 60,
    per_person_rate: 0,
    mca_percentage: 25,
    contractor_cap: null,
    rent_percentage: 0,
    is_scholarship: false,
    requires_client: true,
    scholarship_rate: null,
    contractor_pay_schedule: null,
    total_cap: null,
    minimum_attendees: null,
    ...over,
  }) as unknown as ServiceType

const settings = (base?: number) =>
  ({ pricing: { duration_base_minutes: base } }) as unknown as OrganizationSettings

const CLIENTS = [
  { id: 'c-private', payment_method: 'private_pay' },
  { id: 'c-scholar', payment_method: 'scholarship' },
  { id: 'c-agency', payment_method: 'group_home' },
]

describe('sessionPricingInputs — attendee count', () => {
  it('uses group_headcount for a group service (per_person_rate > 0)', () => {
    const inputs = sessionPricingInputs(
      { duration_minutes: 45, group_headcount: 7, attendeeClientIds: ['c-agency'] },
      serviceType({ per_person_rate: 15 }),
      CLIENTS,
      undefined,
      undefined
    )
    expect(inputs?.attendeeCount).toBe(7)
  })

  it('uses 1 for a service that requires no client', () => {
    const inputs = sessionPricingInputs(
      { duration_minutes: 30, group_headcount: null, attendeeClientIds: [] },
      serviceType({ requires_client: false }),
      CLIENTS,
      undefined,
      undefined
    )
    expect(inputs?.attendeeCount).toBe(1)
  })

  it('uses the attendee count for an individual service', () => {
    const inputs = sessionPricingInputs(
      { duration_minutes: 30, group_headcount: null, attendeeClientIds: ['c-private', 'c-scholar'] },
      serviceType(),
      CLIENTS,
      undefined,
      undefined
    )
    expect(inputs?.attendeeCount).toBe(2)
  })

  it('returns null rather than pricing a group session with no headcount', () => {
    // Pricing it as zero attendees would quietly produce a smaller total than the real session.
    expect(
      sessionPricingInputs(
        { duration_minutes: 45, group_headcount: null, attendeeClientIds: ['c-agency'] },
        serviceType({ per_person_rate: 15 }),
        CLIENTS,
        undefined,
        undefined
      )
    ).toBeNull()
  })

  it('returns null for an individual service with no attendees', () => {
    expect(
      sessionPricingInputs(
        { duration_minutes: 30, group_headcount: null, attendeeClientIds: [] },
        serviceType(),
        CLIENTS,
        undefined,
        undefined
      )
    ).toBeNull()
  })
})

describe('sessionPricingInputs — payment method (mirrors session-form.tsx:214)', () => {
  it('a scholarship SERVICE wins over the client payment method', () => {
    const inputs = sessionPricingInputs(
      { duration_minutes: 30, group_headcount: null, attendeeClientIds: ['c-private'] },
      serviceType({ is_scholarship: true }),
      CLIENTS,
      undefined,
      undefined
    )
    expect(inputs?.options.paymentMethod).toBe('scholarship')
  })

  it('a group session uses the billing agency, not the attendees', () => {
    const inputs = sessionPricingInputs(
      {
        duration_minutes: 45,
        group_headcount: 6,
        attendeeClientIds: ['c-agency'],
        groupBillingClientId: 'c-agency',
      },
      serviceType({ per_person_rate: 15 }),
      CLIENTS,
      undefined,
      undefined
    )
    expect(inputs?.options.paymentMethod).toBe('group_home')
  })

  it('a group session falls back to the first attendee when no billing client is recorded', () => {
    const inputs = sessionPricingInputs(
      { duration_minutes: 45, group_headcount: 6, attendeeClientIds: ['c-agency'] },
      serviceType({ per_person_rate: 15 }),
      CLIENTS,
      undefined,
      undefined
    )
    expect(inputs?.options.paymentMethod).toBe('group_home')
  })

  it('a single-client session uses that client', () => {
    const inputs = sessionPricingInputs(
      { duration_minutes: 30, group_headcount: null, attendeeClientIds: ['c-scholar'] },
      serviceType(),
      CLIENTS,
      undefined,
      undefined
    )
    expect(inputs?.options.paymentMethod).toBe('scholarship')
  })

  it('a multi-client session sends no payment method', () => {
    // The form shows normal pricing for mixed groups; scholarship is applied per client at
    // invoice time instead.
    const inputs = sessionPricingInputs(
      { duration_minutes: 30, group_headcount: null, attendeeClientIds: ['c-private', 'c-scholar'] },
      serviceType(),
      CLIENTS,
      undefined,
      undefined
    )
    expect(inputs?.options.paymentMethod).toBeUndefined()
  })

  it('sends no payment method when the client row is missing', () => {
    const inputs = sessionPricingInputs(
      { duration_minutes: 30, group_headcount: null, attendeeClientIds: ['c-gone'] },
      serviceType(),
      CLIENTS,
      undefined,
      undefined
    )
    expect(inputs?.options.paymentMethod).toBeUndefined()
  })
})

describe('sessionPricingInputs — passthrough', () => {
  it('carries duration, contractor overrides and the org duration base', () => {
    const inputs = sessionPricingInputs(
      { duration_minutes: 45, group_headcount: null, attendeeClientIds: ['c-private'] },
      serviceType(),
      CLIENTS,
      settings(30),
      { customContractorPay: 40, durationIncrement: 8 }
    )
    expect(inputs?.durationMinutes).toBe(45)
    expect(inputs?.contractorOverrides).toEqual({ customContractorPay: 40, durationIncrement: 8 })
    expect(inputs?.options.durationBaseMinutes).toBe(30)
  })

  it('leaves the duration base undefined when the org has not set one', () => {
    const inputs = sessionPricingInputs(
      { duration_minutes: 30, group_headcount: null, attendeeClientIds: ['c-private'] },
      serviceType(),
      CLIENTS,
      settings(undefined),
      undefined
    )
    expect(inputs?.options.durationBaseMinutes).toBeUndefined()
  })
})

describe('the no-op invariant', () => {
  // THE test for this feature. Re-pricing a session nobody has touched must reproduce exactly
  // what the form computed, or a bulk re-price silently rewrites correct money.
  it('reproduces calculateSessionPricing called the way session-form.tsx calls it', () => {
    const st = serviceType({ base_rate: 100, per_person_rate: 15, mca_percentage: 20 })
    const fromForm = calculateSessionPricing(st, 7, 45, { customContractorPay: 50 }, {
      paymentMethod: 'group_home',
      durationBaseMinutes: 30,
    })

    const inputs = sessionPricingInputs(
      {
        duration_minutes: 45,
        group_headcount: 7,
        attendeeClientIds: ['c-agency'],
        groupBillingClientId: 'c-agency',
      },
      st,
      CLIENTS,
      settings(30),
      { customContractorPay: 50 }
    )

    expect(priceFromInputs(inputs!)).toEqual(fromForm)
  })

  it('reports no change when the stored snapshot already matches', () => {
    const st = serviceType()
    const priced = calculateSessionPricing(st, 1, 30, undefined, { paymentMethod: 'private_pay' })
    const diff = pricingDiff(
      {
        total_amount: priced.totalAmount,
        mca_cut: priced.mcaCut,
        contractor_pay: priced.contractorPay,
      },
      priced
    )
    expect(diff.changed).toBe(false)
  })
})

describe('pricingDiff', () => {
  const priced = { totalAmount: 150, perPersonCost: 150, mcaCut: 17, contractorPay: 133, rentAmount: 0 }

  it('flags a changed total', () => {
    const diff = pricingDiff({ total_amount: 120, mca_cut: 17, contractor_pay: 133 }, priced)
    expect(diff.changed).toBe(true)
    expect(diff.totalAmount).toEqual({ from: 120, to: 150 })
  })

  it('flags a change in the split even when the total holds steady', () => {
    // Exactly what a contractor-rate edit looks like: the client pays the same, the split moves.
    const diff = pricingDiff({ total_amount: 150, mca_cut: 30, contractor_pay: 120 }, priced)
    expect(diff.changed).toBe(true)
    expect(diff.mcaCut).toEqual({ from: 30, to: 17 })
    expect(diff.contractorPay).toEqual({ from: 120, to: 133 })
  })

  it('treats sub-cent float noise as unchanged', () => {
    const diff = pricingDiff(
      { total_amount: 150.000000001, mca_cut: 17, contractor_pay: 132.999999999 },
      priced
    )
    expect(diff.changed).toBe(false)
  })

  it('treats a null snapshot as a real change, not a match', () => {
    const diff = pricingDiff({ total_amount: null, mca_cut: null, contractor_pay: null }, priced)
    expect(diff.changed).toBe(true)
    expect(diff.totalAmount.from).toBe(0)
  })
})
