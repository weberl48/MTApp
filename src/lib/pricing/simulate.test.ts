import { describe, it, expect } from 'vitest'
import type { ServiceType, OrganizationSettings } from '@/types/database'
import { calculateSessionPricing } from '@/lib/pricing'
import {
  simulate,
  isGroupService,
  scholarshipLocked,
  PAY_SOURCE_LABELS,
  type SimulatorState,
} from './simulate'

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
    group_contractor_pay: null,
    ...over,
  }) as unknown as ServiceType

const settings = (over: Partial<OrganizationSettings['pricing']> = {}): OrganizationSettings =>
  ({ pricing: { duration_base_minutes: 30, no_show_fee: 60, ...over } }) as unknown as OrganizationSettings

const baseState = (over: Partial<SimulatorState> = {}): SimulatorState => ({
  serviceType: serviceType(),
  headcount: 1,
  durationMinutes: 30,
  scholarship: false,
  noShow: false,
  ...over,
})

describe('isGroupService', () => {
  it('is true when per_person_rate > 0', () => {
    expect(isGroupService(serviceType({ per_person_rate: 15 }))).toBe(true)
  })

  it('is false when per_person_rate is 0', () => {
    expect(isGroupService(serviceType({ per_person_rate: 0 }))).toBe(false)
  })
})

describe('scholarshipLocked', () => {
  it('is true when the service is a scholarship service', () => {
    expect(scholarshipLocked(serviceType({ is_scholarship: true }))).toBe(true)
  })

  it('is false otherwise', () => {
    expect(scholarshipLocked(serviceType({ is_scholarship: false }))).toBe(false)
  })
})

describe('simulate — headcount', () => {
  it('uses headcount for a group service', () => {
    const st = serviceType({ per_person_rate: 20, base_rate: 60, mca_percentage: 0 })
    const result = simulate(baseState({ serviceType: st, headcount: 3 }), settings())
    // 60 + 20*3 = 120
    expect(result.totalAmount).toBe(120)
  })

  it('clamps group headcount to a minimum of 1', () => {
    const st = serviceType({ per_person_rate: 20, base_rate: 60, mca_percentage: 0 })
    const result = simulate(baseState({ serviceType: st, headcount: 0 }), settings())
    // headcount clamped to 1 → group per-person waived at 1 attendee → base rate only
    expect(result.totalAmount).toBe(60)
  })

  it('forces attendeeCount to 1 for an individual service regardless of headcount', () => {
    const st = serviceType({ per_person_rate: 0, base_rate: 60, mca_percentage: 0 })
    const result = simulate(baseState({ serviceType: st, headcount: 5 }), settings())
    expect(result.totalAmount).toBe(60)
  })
})

describe('simulate — scholarship', () => {
  it('maps state.scholarship=true to paymentMethod scholarship', () => {
    const st = serviceType({ scholarship_rate: 40, base_rate: 80 })
    const result = simulate(baseState({ serviceType: st, scholarship: true }), settings())
    expect(result.totalAmount).toBe(40)
    expect(result.scholarshipDiscount).toBe(40)
  })

  it('forces scholarship pricing on for is_scholarship services even when state.scholarship is false', () => {
    const st = serviceType({ is_scholarship: true, scholarship_rate: 40, base_rate: 80 })
    const result = simulate(baseState({ serviceType: st, scholarship: false }), settings())
    expect(result.totalAmount).toBe(40)
    expect(result.scholarshipDiscount).toBe(40)
  })

  it('does not apply scholarship pricing when neither flag is set', () => {
    const st = serviceType({ scholarship_rate: 40, base_rate: 80 })
    const result = simulate(baseState({ serviceType: st, scholarship: false }), settings())
    expect(result.totalAmount).toBe(80)
    expect(result.scholarshipDiscount).toBeUndefined()
  })
})

describe('simulate — no-show', () => {
  it('routes through calculateNoShowPricing using settings.pricing.no_show_fee', () => {
    const result = simulate(baseState({ noShow: true }), settings({ no_show_fee: 75 }))
    expect(result.isNoShow).toBe(true)
    expect(result.totalAmount).toBe(75)
    expect(result.appliedNoShowFee).toBe(75)
  })

  it('defaults the no-show fee to 60 when settings are absent', () => {
    const result = simulate(baseState({ noShow: true }), undefined)
    expect(result.totalAmount).toBe(60)
    expect(result.appliedNoShowFee).toBe(60)
  })

  it('defaults the no-show fee to 60 when settings are null', () => {
    const result = simulate(baseState({ noShow: true }), null)
    expect(result.totalAmount).toBe(60)
    expect(result.appliedNoShowFee).toBe(60)
  })
})

describe('simulate — duration base', () => {
  it('passes durationBaseMinutes from settings for rate scaling', () => {
    const st = serviceType({ base_rate: 75, mca_percentage: 0 })
    // base rate is for a 45-min session per settings; a 90-min session should be 2x
    const result = simulate(
      baseState({ serviceType: st, durationMinutes: 90 }),
      settings({ duration_base_minutes: 45 })
    )
    expect(result.totalAmount).toBe(150)
  })

  it('matches calling calculateSessionPricing directly with the same inputs', () => {
    const st = serviceType({ base_rate: 100, per_person_rate: 10, mca_percentage: 20 })
    const overrides = { customContractorPay: 50 }
    const result = simulate(
      baseState({ serviceType: st, headcount: 4, durationMinutes: 45, contractorOverrides: overrides }),
      settings({ duration_base_minutes: 30 })
    )
    const direct = calculateSessionPricing(st, 4, 45, undefined, {
      contractorOverrides: overrides,
      paymentMethod: undefined,
      durationBaseMinutes: 30,
    })
    expect(result).toEqual(direct)
  })
})

describe('PAY_SOURCE_LABELS', () => {
  it('has a label for every ContractorPaySource', () => {
    expect(Object.keys(PAY_SOURCE_LABELS).sort()).toEqual(
      [
        'group_matrix',
        'custom_rate_increment',
        'custom_rate_schedule_offset',
        'custom_rate_scaled',
        'pay_schedule',
        'formula',
      ].sort()
    )
  })
})
