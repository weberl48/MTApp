import { calculateSessionPricing, calculateNoShowPricing, getDefaultIncrement } from './index'
import type { ServiceType } from '@/types/database'

describe('calculateSessionPricing', () => {
  const mockServiceType: ServiceType = {
    id: '1',
    name: 'Test Service',
    category: 'music_individual',
    location: 'in_home',
    base_rate: 50,
    per_person_rate: 0,
    mca_percentage: 23,
    contractor_cap: null,
    total_cap: null,
    rent_percentage: 0,
    minimum_attendees: 1,
    scholarship_discount_percentage: 0,
    scholarship_rate: null,
    contractor_pay_schedule: null,
    is_active: true,
    is_scholarship: false,
    requires_client: true,
    allowed_contractor_ids: null,
    display_order: 0,
    organization_id: 'org-1',
    created_at: '',
    updated_at: '',
  }

  it('calculates individual session correctly', () => {
    const result = calculateSessionPricing(mockServiceType, 1)

    expect(result.totalAmount).toBe(50)
    expect(result.mcaCut).toBe(11.5) // 23% of 50
    expect(result.contractorPay).toBe(38.5) // 50 - 11.5
    expect(result.rentAmount).toBe(0)
  })

  it('calculates group session with cap correctly', () => {
    const groupService: ServiceType = {
      ...mockServiceType,
      per_person_rate: 20,
      mca_percentage: 30,
      contractor_cap: 105,
    }

    // 4 people: 50 + (20 * 4) = 130
    // MCA Cut: 30% of 130 = 39
    // Contractor: 130 - 39 = 91 (under cap)
    const result = calculateSessionPricing(groupService, 4)
    expect(result.totalAmount).toBe(130)
    expect(result.mcaCut).toBe(39)
    expect(result.contractorPay).toBe(91)

    // 10 people: 50 + (20 * 10) = 250
    // MCA Cut: 30% of 250 = 75
    // Contractor: 250 - 75 = 175 (over cap of 105)
    // Capped Contractor: 105
    // Adjusted MCA: 250 - 105 = 145
    const cappedResult = calculateSessionPricing(groupService, 10)
    expect(cappedResult.totalAmount).toBe(250)
    expect(cappedResult.contractorPay).toBe(105)
    expect(cappedResult.mcaCut).toBe(145)
  })

  it('skips per_person_rate when only 1 attendee in group service', () => {
    const groupService: ServiceType = {
      ...mockServiceType,
      per_person_rate: 20,
      mca_percentage: 30,
    }

    // 1 person in group: just base rate $50 (no per-person charge)
    const result = calculateSessionPricing(groupService, 1)
    expect(result.totalAmount).toBe(50)
    expect(result.mcaCut).toBe(15) // 30% of 50
    expect(result.contractorPay).toBe(35) // 50 - 15
  })

  it('includes per_person_rate when 2+ attendees', () => {
    const groupService: ServiceType = {
      ...mockServiceType,
      per_person_rate: 20,
      mca_percentage: 30,
    }

    // 3 people: 50 + (20 * 3) = 110
    const result = calculateSessionPricing(groupService, 3)
    expect(result.totalAmount).toBe(110)
    expect(result.mcaCut).toBe(33) // 30% of 110
    expect(result.contractorPay).toBe(77) // 110 - 33
  })

  it('applies total_cap to limit billed amount', () => {
    const groupService: ServiceType = {
      ...mockServiceType,
      per_person_rate: 20,
      mca_percentage: 30,
      total_cap: 150,
    }

    // 8 people: 50 + (20 * 8) = 210 → capped at 150
    const result = calculateSessionPricing(groupService, 8)
    expect(result.totalAmount).toBe(150)
    expect(result.mcaCut).toBe(45) // 30% of 150
    expect(result.contractorPay).toBe(105) // 150 - 45
  })

  it('does not apply total_cap when under limit', () => {
    const groupService: ServiceType = {
      ...mockServiceType,
      per_person_rate: 20,
      mca_percentage: 30,
      total_cap: 150,
    }

    // 3 people: 50 + (20 * 3) = 110 (under cap)
    const result = calculateSessionPricing(groupService, 3)
    expect(result.totalAmount).toBe(110)
  })

  it('scales pricing by duration', () => {
    // 30 min (default): $50
    const result30 = calculateSessionPricing(mockServiceType, 1, 30)
    expect(result30.totalAmount).toBe(50)

    // 60 min: $100 (2x)
    const result60 = calculateSessionPricing(mockServiceType, 1, 60)
    expect(result60.totalAmount).toBe(100)
    expect(result60.mcaCut).toBe(23) // 23% of 100
    expect(result60.contractorPay).toBe(77) // 100 - 23

    // 45 min: $75 (1.5x)
    const result45 = calculateSessionPricing(mockServiceType, 1, 45)
    expect(result45.totalAmount).toBe(75)

    // 90 min: $150 (3x)
    const result90 = calculateSessionPricing(mockServiceType, 1, 90)
    expect(result90.totalAmount).toBe(150)
  })
})

describe('scholarship pricing', () => {
  const mockServiceType: ServiceType = {
    id: '1',
    name: 'In-Home Individual',
    category: 'music_individual',
    location: 'in_home',
    base_rate: 50,
    per_person_rate: 0,
    mca_percentage: 23,
    contractor_cap: null,
    total_cap: null,
    rent_percentage: 0,
    minimum_attendees: 1,
    scholarship_discount_percentage: 0,
    scholarship_rate: 60,
    contractor_pay_schedule: null,
    is_active: true,
    is_scholarship: false,
    requires_client: true,
    allowed_contractor_ids: null,
    display_order: 0,
    organization_id: 'org-1',
    created_at: '',
    updated_at: '',
  }

  it('uses flat scholarship rate when payment method is scholarship', () => {
    // Service with $80 base rate, scholarship rate $60
    const service: ServiceType = {
      ...mockServiceType,
      base_rate: 80,
      scholarship_rate: 60,
    }

    // Normal: $80 total, 23% MCA = $18.40, contractor = $61.60
    // Scholarship: total = $60, contractor still gets $61.60
    // MCA cut = $60 - $61.60 = -$1.60 (MCA absorbs the loss)
    const result = calculateSessionPricing(service, 1, 30, undefined, {
      paymentMethod: 'scholarship',
    })

    expect(result.totalAmount).toBe(60)
    expect(result.contractorPay).toBe(61.6) // Same as non-scholarship
    expect(result.mcaCut).toBe(-1.6) // MCA absorbs the difference
    expect(result.scholarshipDiscount).toBe(20) // $80 - $60
  })

  it('contractor gets normal pay when scholarship rate matches normal rate', () => {
    // scholarship_rate = $60, base_rate = $50 → scholarship is higher
    // Normal: $50, 23% MCA = $11.50, contractor = $38.50
    // Scholarship: total = $60, contractor still = $38.50, MCA = $21.50
    const result = calculateSessionPricing(mockServiceType, 1, 30, undefined, {
      paymentMethod: 'scholarship',
    })

    expect(result.totalAmount).toBe(60)
    expect(result.contractorPay).toBe(38.5) // Same as non-scholarship
    expect(result.mcaCut).toBe(21.5) // $60 - $38.50
  })

  it('does not apply scholarship when payment method is not scholarship', () => {
    const result = calculateSessionPricing(mockServiceType, 1, 30, undefined, {
      paymentMethod: 'private_pay',
    })

    expect(result.totalAmount).toBe(50)
    expect(result.scholarshipDiscount).toBeUndefined()
  })

  it('does not apply scholarship when scholarship_rate is null', () => {
    const service: ServiceType = {
      ...mockServiceType,
      scholarship_rate: null,
    }

    const result = calculateSessionPricing(service, 1, 30, undefined, {
      paymentMethod: 'scholarship',
    })

    expect(result.totalAmount).toBe(50) // Normal pricing
    expect(result.scholarshipDiscount).toBeUndefined()
  })

  it('scholarship rate is flat per session regardless of duration', () => {
    // 60 min: scholarship_rate is flat $60 (not scaled by duration)
    const result = calculateSessionPricing(mockServiceType, 1, 60, undefined, {
      paymentMethod: 'scholarship',
    })

    expect(result.totalAmount).toBe(60) // Flat $60 regardless of duration
    // Normal 60-min contractor pay: $100 * 77% = $77
    expect(result.contractorPay).toBe(77)
    // MCA absorbs: $60 - $77 = -$17
    expect(result.mcaCut).toBe(-17)
  })
})

describe('calculateNoShowPricing', () => {
  const mockServiceType: ServiceType = {
    id: '1',
    name: 'In-Home Individual',
    category: 'music_individual',
    location: 'in_home',
    base_rate: 50,
    per_person_rate: 0,
    mca_percentage: 23,
    contractor_cap: null,
    total_cap: null,
    rent_percentage: 0,
    minimum_attendees: 1,
    scholarship_discount_percentage: 0,
    scholarship_rate: null,
    contractor_pay_schedule: null,
    is_active: true,
    is_scholarship: false,
    requires_client: true,
    allowed_contractor_ids: null,
    display_order: 0,
    organization_id: 'org-1',
    created_at: '',
    updated_at: '',
  }

  it('charges default no-show fee', () => {
    const result = calculateNoShowPricing(mockServiceType)
    expect(result.totalAmount).toBe(60)
    expect(result.isNoShow).toBe(true)
  })

  it('gives contractor their normal 30-min session pay', () => {
    // Normal 30-min: $50 total, 23% MCA = $11.50, contractor = $38.50
    // No-show: total = $60, contractor = $38.50, MCA = $21.50
    const result = calculateNoShowPricing(mockServiceType)

    expect(result.contractorPay).toBe(38.5) // Same as normal session
    expect(result.mcaCut).toBe(21.5) // $60 - $38.50
    expect(result.totalAmount).toBe(60)
    expect(result.rentAmount).toBe(0)
  })

  it('respects contractor overrides for no-show pay', () => {
    // Custom contractor rate: $40 per 30 min
    const result = calculateNoShowPricing(mockServiceType, {
      customContractorPay: 40,
    })

    expect(result.contractorPay).toBe(40)
    expect(result.mcaCut).toBe(20) // $60 - $40
  })

})

describe('contractor pay schedule', () => {
  const mockServiceType: ServiceType = {
    id: '1',
    name: 'Musical Expressions',
    category: 'music_individual',
    location: 'in_home',
    base_rate: 60,
    per_person_rate: 0,
    mca_percentage: 23,
    contractor_cap: null,
    total_cap: null,
    rent_percentage: 0,
    minimum_attendees: 1,
    scholarship_discount_percentage: 0,
    scholarship_rate: null,
    contractor_pay_schedule: { '30': 38.5, '45': 54 },
    is_active: true,
    is_scholarship: false,
    requires_client: true,
    allowed_contractor_ids: null,
    display_order: 0,
    organization_id: 'org-1',
    created_at: '',
    updated_at: '',
  }

  it('uses pay schedule amount for 30 min', () => {
    const result = calculateSessionPricing(mockServiceType, 1, 30)
    expect(result.contractorPay).toBe(38.5)
    expect(result.totalAmount).toBe(60)
    expect(result.mcaCut).toBe(21.5) // 60 - 38.5
  })

  it('uses pay schedule amount for 45 min', () => {
    const result = calculateSessionPricing(mockServiceType, 1, 45)
    expect(result.contractorPay).toBe(54)
    expect(result.totalAmount).toBe(90) // 60 * 1.5
    expect(result.mcaCut).toBe(36) // 90 - 54
  })

  it('falls back to formula for unlisted duration', () => {
    // 60 min not in schedule, so uses formula: total - MCA%
    const result = calculateSessionPricing(mockServiceType, 1, 60)
    expect(result.totalAmount).toBe(120) // 60 * 2
    expect(result.mcaCut).toBe(27.6) // 23% of 120
    expect(result.contractorPay).toBe(92.4) // 120 - 27.6
  })

  it('custom rate used at base duration', () => {
    const result = calculateSessionPricing(mockServiceType, 1, 30, {
      customContractorPay: 40.5,
    })
    expect(result.contractorPay).toBe(40.5)
    expect(result.mcaCut).toBe(19.5) // 60 - 40.5
  })

  it('custom rate + schedule offset at non-base duration', () => {
    // Custom 30-min rate $40.50 + schedule offset (54 - 38.5 = 15.5) = $56
    const result = calculateSessionPricing(mockServiceType, 1, 45, {
      customContractorPay: 40.5,
    })
    expect(result.contractorPay).toBe(56) // 40.5 + (54 - 38.5)
    expect(result.mcaCut).toBe(34) // 90 - 56
  })

  it('custom rate scales linearly when no schedule for duration', () => {
    // 60 min not in schedule, so custom rate scales linearly: 40.5 * 2 = 81
    const result = calculateSessionPricing(mockServiceType, 1, 60, {
      customContractorPay: 40.5,
    })
    expect(result.contractorPay).toBe(81) // 40.5 * (60/30)
    expect(result.mcaCut).toBe(39) // 120 - 81
  })
})

describe('contractor duration increment', () => {
  const mockServiceType: ServiceType = {
    id: '1',
    name: 'Musical Expressions',
    category: 'music_individual',
    location: 'in_home',
    base_rate: 60,
    per_person_rate: 0,
    mca_percentage: 23,
    contractor_cap: null,
    total_cap: null,
    rent_percentage: 0,
    minimum_attendees: 1,
    scholarship_discount_percentage: 0,
    scholarship_rate: null,
    contractor_pay_schedule: { '30': 38.5, '45': 54 },
    is_active: true,
    is_scholarship: false,
    requires_client: true,
    allowed_contractor_ids: null,
    display_order: 0,
    organization_id: 'org-1',
    created_at: '',
    updated_at: '',
  }

  it('uses explicit increment at 45 min', () => {
    // Colleen: $41.50 base, +$13.50/15min
    const result = calculateSessionPricing(mockServiceType, 1, 45, {
      customContractorPay: 41.5,
      durationIncrement: 13.5,
    })
    expect(result.contractorPay).toBe(55) // 41.5 + 13.5*1
  })

  it('uses explicit increment at 60 min', () => {
    const result = calculateSessionPricing(mockServiceType, 1, 60, {
      customContractorPay: 41.5,
      durationIncrement: 13.5,
    })
    expect(result.contractorPay).toBe(68.5) // 41.5 + 13.5*2
  })

  it('uses explicit increment at 90 min', () => {
    const result = calculateSessionPricing(mockServiceType, 1, 90, {
      customContractorPay: 41.5,
      durationIncrement: 13.5,
    })
    expect(result.contractorPay).toBe(95.5) // 41.5 + 13.5*4
  })

  it('null increment falls back to service type default', () => {
    // null durationIncrement → derive from schedule: 54 - 38.5 = 15.5
    const result = calculateSessionPricing(mockServiceType, 1, 45, {
      customContractorPay: 41.5,
      durationIncrement: null,
    })
    expect(result.contractorPay).toBe(57) // 41.5 + 15.5*1
  })

  it('undefined increment uses schedule offset (backward compat)', () => {
    // No durationIncrement field → existing behavior: schedule offset
    const result = calculateSessionPricing(mockServiceType, 1, 45, {
      customContractorPay: 41.5,
    })
    expect(result.contractorPay).toBe(57) // 41.5 + (54 - 38.5)
  })

  it('increment at base duration always uses custom rate directly', () => {
    const result = calculateSessionPricing(mockServiceType, 1, 30, {
      customContractorPay: 41.5,
      durationIncrement: 13.5,
    })
    expect(result.contractorPay).toBe(41.5) // Increment irrelevant at base
  })
})

describe('getDefaultIncrement', () => {
  it('derives increment from schedule', () => {
    expect(getDefaultIncrement({ '30': 38.5, '45': 54 })).toBe(15.5)
  })

  it('returns null for null schedule', () => {
    expect(getDefaultIncrement(null)).toBeNull()
  })

  it('returns null when schedule missing next duration', () => {
    expect(getDefaultIncrement({ '30': 38.5 })).toBeNull()
  })

  it('works with art schedule', () => {
    expect(getDefaultIncrement({ '30': 32, '45': 45 })).toBe(13)
  })
})
