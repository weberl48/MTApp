import { calculateSessionPricing, calculateNoShowPricing, getDefaultIncrement, lookupGroupContractorPay, validateMinimumAttendees, formatCurrency, calculateContractorTotal, getPricingDescription } from './index'
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
    group_contractor_pay: null,
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
    group_contractor_pay: null,
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
    group_contractor_pay: null,
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
    group_contractor_pay: null,
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
    group_contractor_pay: null,
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

describe('lookupGroupContractorPay', () => {
  const matrix: Record<string, number> = {
    '1_30': 40, '2_30': 49, '3_30': 63, '4_30': 77, '5_30': 91, '6_30': 105,
    '2_45': 55, '3_45': 74, '4_45': 94, '5_45': 113, '6_45': 133,
    '2_60': 60, '3_60': 85, '4_60': 111, '5_60': 136, '6_60': 161,
  }

  it('returns exact match', () => {
    expect(lookupGroupContractorPay(matrix, 3, 30)).toBe(63)
    expect(lookupGroupContractorPay(matrix, 5, 45)).toBe(113)
  })

  it('clamps headcount above max to max entry', () => {
    // 8 clients → clamp to 6
    expect(lookupGroupContractorPay(matrix, 8, 30)).toBe(105)
    expect(lookupGroupContractorPay(matrix, 10, 45)).toBe(133)
  })

  it('returns undefined for missing duration', () => {
    // 90-min not in matrix
    expect(lookupGroupContractorPay(matrix, 3, 90)).toBeUndefined()
  })

  it('returns undefined for empty matrix', () => {
    expect(lookupGroupContractorPay({}, 3, 30)).toBeUndefined()
  })

  it('returns solo entry when 1 client', () => {
    expect(lookupGroupContractorPay(matrix, 1, 30)).toBe(40)
  })
})

describe('group contractor pay matrix in pricing', () => {
  const groupServiceWithMatrix: ServiceType = {
    id: '1',
    name: 'Group Music',
    category: 'music_group',
    location: 'in_home',
    base_rate: 60,
    per_person_rate: 20,
    mca_percentage: 0,
    contractor_cap: null,
    total_cap: null,
    rent_percentage: 0,
    minimum_attendees: 1,
    scholarship_discount_percentage: 0,
    scholarship_rate: null,
    contractor_pay_schedule: null,
    group_contractor_pay: {
      '1_30': 40, '2_30': 49, '3_30': 63, '4_30': 77, '5_30': 91, '6_30': 105,
      '2_45': 55, '3_45': 74, '4_45': 94, '5_45': 113, '6_45': 133,
    },
    is_active: true,
    is_scholarship: false,
    requires_client: true,
    allowed_contractor_ids: null,
    display_order: 0,
    organization_id: 'org-1',
    created_at: '',
    updated_at: '',
  }

  it('uses matrix pay for 3 clients at 30 min', () => {
    const result = calculateSessionPricing(groupServiceWithMatrix, 3, 30)
    expect(result.contractorPay).toBe(63)
    // Total: 60 + 20*3 = 120, MCA: 120 - 63 = 57
    expect(result.totalAmount).toBe(120)
    expect(result.mcaCut).toBe(57)
  })

  it('uses matrix pay for different duration', () => {
    const result = calculateSessionPricing(groupServiceWithMatrix, 3, 45)
    expect(result.contractorPay).toBe(74)
    // Total: (60+20*3)*1.5 = 180
    expect(result.totalAmount).toBe(180)
    expect(result.mcaCut).toBe(106) // 180 - 74
  })

  it('clamps headcount above max', () => {
    // 8 clients → uses 6_30 = 105
    const result = calculateSessionPricing(groupServiceWithMatrix, 8, 30)
    expect(result.contractorPay).toBe(105)
    // Total: 60 + 20*8 = 220
    expect(result.totalAmount).toBe(220)
    expect(result.mcaCut).toBe(115) // 220 - 105
  })

  it('falls through to existing logic when matrix has no entry for duration', () => {
    // 60-min not in matrix → fall through to formula (mca_percentage=0 → contractor gets all)
    const result = calculateSessionPricing(groupServiceWithMatrix, 3, 60)
    // Total: (60+20*3)*2 = 240, MCA 0% → contractor = 240
    expect(result.totalAmount).toBe(240)
    expect(result.contractorPay).toBe(240)
  })

  it('does not use matrix for individual services', () => {
    const individualService: ServiceType = {
      ...groupServiceWithMatrix,
      per_person_rate: 0, // Not a group service
    }
    // per_person_rate=0 → matrix ignored
    const result = calculateSessionPricing(individualService, 1, 30)
    // Total: 60, MCA 0% → contractor = 60
    expect(result.totalAmount).toBe(60)
    expect(result.contractorPay).toBe(60)
  })

  it('uses matrix solo entry for 1 client in group service', () => {
    const result = calculateSessionPricing(groupServiceWithMatrix, 1, 30)
    expect(result.contractorPay).toBe(40) // "1_30" entry
    // 1 person in group → base_rate only = 60
    expect(result.totalAmount).toBe(60)
    expect(result.mcaCut).toBe(20) // 60 - 40
  })

  it('ignores matrix when group_contractor_pay is null', () => {
    const serviceNoMatrix: ServiceType = {
      ...groupServiceWithMatrix,
      group_contractor_pay: null,
    }
    const result = calculateSessionPricing(serviceNoMatrix, 3, 30)
    // No matrix → formula: total=120, mca=0% → contractor=120
    expect(result.totalAmount).toBe(120)
    expect(result.contractorPay).toBe(120)
  })
})

describe('validateMinimumAttendees', () => {
  const mockServiceType: ServiceType = {
    id: '1',
    name: 'Group Music',
    category: 'music_group',
    location: 'in_home',
    base_rate: 60,
    per_person_rate: 20,
    mca_percentage: 23,
    contractor_cap: null,
    total_cap: null,
    rent_percentage: 0,
    minimum_attendees: 3,
    scholarship_discount_percentage: 0,
    scholarship_rate: null,
    contractor_pay_schedule: null,
    group_contractor_pay: null,
    is_active: true,
    is_scholarship: false,
    requires_client: true,
    allowed_contractor_ids: null,
    display_order: 0,
    organization_id: 'org-1',
    created_at: '',
    updated_at: '',
  }

  it('returns null when attendee count meets minimum', () => {
    expect(validateMinimumAttendees(mockServiceType, 3)).toBeNull()
    expect(validateMinimumAttendees(mockServiceType, 5)).toBeNull()
  })

  it('returns error message when below minimum', () => {
    const result = validateMinimumAttendees(mockServiceType, 2)
    expect(result).toContain('at least 3')
    expect(result).toContain('currently 2')
  })

  it('returns null when minimum_attendees is not set', () => {
    const noMinService: ServiceType = { ...mockServiceType, minimum_attendees: 0 }
    expect(validateMinimumAttendees(noMinService, 1)).toBeNull()
  })
})

describe('formatCurrency', () => {
  it('formats whole dollar amounts', () => {
    expect(formatCurrency(100)).toBe('$100.00')
  })

  it('formats cents', () => {
    expect(formatCurrency(38.5)).toBe('$38.50')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats negative amounts', () => {
    expect(formatCurrency(-17)).toBe('-$17.00')
  })

  it('formats large amounts with comma', () => {
    expect(formatCurrency(1250)).toBe('$1,250.00')
  })
})

describe('calculateContractorTotal', () => {
  const individualService: ServiceType = {
    id: '1',
    name: 'Individual Music',
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
    group_contractor_pay: null,
    is_active: true,
    is_scholarship: false,
    requires_client: true,
    allowed_contractor_ids: null,
    display_order: 0,
    organization_id: 'org-1',
    created_at: '',
    updated_at: '',
  }

  const groupService: ServiceType = {
    ...individualService,
    name: 'Group Music',
    base_rate: 60,
    per_person_rate: 20,
    mca_percentage: 0,
  }

  it('sums contractor pay across multiple sessions', () => {
    // Session 1: $50, 23% MCA → contractor $38.50
    // Session 2: $50, 23% MCA → contractor $38.50
    const total = calculateContractorTotal([
      { serviceType: individualService, attendeeCount: 1 },
      { serviceType: individualService, attendeeCount: 1 },
    ])
    expect(total).toBe(77) // 38.50 + 38.50
  })

  it('returns 0 for empty array', () => {
    expect(calculateContractorTotal([])).toBe(0)
  })

  it('handles mix of individual and group sessions', () => {
    // Individual: $50, 23% MCA → contractor $38.50
    // Group 3 people: $60+$20*3=$120, 0% MCA → contractor $120
    const total = calculateContractorTotal([
      { serviceType: individualService, attendeeCount: 1 },
      { serviceType: groupService, attendeeCount: 3 },
    ])
    expect(total).toBe(158.5) // 38.50 + 120
  })
})

describe('getPricingDescription', () => {
  const baseService: ServiceType = {
    id: '1',
    name: 'Individual Music',
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
    group_contractor_pay: null,
    is_active: true,
    is_scholarship: false,
    requires_client: true,
    allowed_contractor_ids: null,
    display_order: 0,
    organization_id: 'org-1',
    created_at: '',
    updated_at: '',
  }

  it('returns base rate for individual service', () => {
    const service: ServiceType = { ...baseService, mca_percentage: 0 }
    expect(getPricingDescription(service)).toBe('$50')
  })

  it('includes per-person rate for groups', () => {
    const service: ServiceType = { ...baseService, base_rate: 60, per_person_rate: 20, mca_percentage: 0 }
    expect(getPricingDescription(service)).toBe('$60 + $20/person')
  })

  it('includes MCA percentage when showFormula is true', () => {
    expect(getPricingDescription(baseService)).toBe('$50 (23% MCA)')
  })

  it('includes contractor cap and total cap', () => {
    const service: ServiceType = { ...baseService, contractor_cap: 105, total_cap: 150 }
    expect(getPricingDescription(service)).toContain('contractor max $105')
    expect(getPricingDescription(service)).toContain('total max $150')
  })

  it('omits formula details when showFormula is false', () => {
    const service: ServiceType = { ...baseService, contractor_cap: 105 }
    const result = getPricingDescription(service, false)
    expect(result).toBe('$50')
    expect(result).not.toContain('MCA')
    expect(result).not.toContain('contractor max')
  })
})

describe('perPersonCost', () => {
  const mockServiceType: ServiceType = {
    id: '1',
    name: 'Individual Music',
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
    group_contractor_pay: null,
    is_active: true,
    is_scholarship: false,
    requires_client: true,
    allowed_contractor_ids: null,
    display_order: 0,
    organization_id: 'org-1',
    created_at: '',
    updated_at: '',
  }

  it('equals totalAmount for individual sessions', () => {
    const result = calculateSessionPricing(mockServiceType, 1)
    expect(result.perPersonCost).toBe(result.totalAmount)
    expect(result.perPersonCost).toBe(50)
  })

  it('divides totalAmount by attendee count for groups', () => {
    const groupService: ServiceType = {
      ...mockServiceType,
      base_rate: 60,
      per_person_rate: 20,
      mca_percentage: 0,
    }
    // 3 people: 60 + 20*3 = 120 total, 120/3 = 40 per person
    const result = calculateSessionPricing(groupService, 3)
    expect(result.totalAmount).toBe(120)
    expect(result.perPersonCost).toBe(40)
  })

  it('divides correctly with scholarship pricing', () => {
    const service: ServiceType = {
      ...mockServiceType,
      scholarship_rate: 60,
    }
    // Scholarship total = $60, 1 attendee → per person = $60
    const result = calculateSessionPricing(service, 1, 30, undefined, {
      paymentMethod: 'scholarship',
    })
    expect(result.totalAmount).toBe(60)
    expect(result.perPersonCost).toBe(60)
  })

  it('divides correctly when total_cap is applied', () => {
    const groupService: ServiceType = {
      ...mockServiceType,
      base_rate: 60,
      per_person_rate: 20,
      mca_percentage: 0,
      total_cap: 150,
    }
    // 8 people: 60 + 20*8 = 220 → capped at 150
    // Per person: 150/8 = 18.75
    const result = calculateSessionPricing(groupService, 8)
    expect(result.totalAmount).toBe(150)
    expect(result.perPersonCost).toBe(18.75)
  })
})

describe('custom duration base', () => {
  const mockServiceType: ServiceType = {
    id: '1',
    name: 'Test Service',
    category: 'music_individual',
    location: 'in_home',
    base_rate: 75,
    per_person_rate: 0,
    mca_percentage: 20,
    contractor_cap: null,
    total_cap: null,
    rent_percentage: 0,
    minimum_attendees: 1,
    scholarship_discount_percentage: 0,
    scholarship_rate: null,
    contractor_pay_schedule: null,
    group_contractor_pay: null,
    is_active: true,
    is_scholarship: false,
    requires_client: true,
    allowed_contractor_ids: null,
    display_order: 0,
    organization_id: 'org-1',
    created_at: '',
    updated_at: '',
  }

  it('uses custom base for scaling', () => {
    // Base rate $75 is for 45 min; a 90-min session = 2x
    const result = calculateSessionPricing(mockServiceType, 1, 90, undefined, {
      durationBaseMinutes: 45,
    })
    expect(result.totalAmount).toBe(150) // 75 * (90/45)
  })

  it('defaults to 30-min base when not specified', () => {
    // Base rate $75 is for 30 min; a 60-min session = 2x
    const result = calculateSessionPricing(mockServiceType, 1, 60)
    expect(result.totalAmount).toBe(150) // 75 * (60/30)
  })
})

describe('calculateNoShowPricing extended', () => {
  const mockServiceType: ServiceType = {
    id: '1',
    name: 'Individual Music',
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
    contractor_pay_schedule: { '30': 38.5, '45': 54 },
    group_contractor_pay: null,
    is_active: true,
    is_scholarship: false,
    requires_client: true,
    allowed_contractor_ids: null,
    display_order: 0,
    organization_id: 'org-1',
    created_at: '',
    updated_at: '',
  }

  it('uses custom no-show fee when provided', () => {
    const result = calculateNoShowPricing(mockServiceType, undefined, 75)
    expect(result.totalAmount).toBe(75)
    expect(result.isNoShow).toBe(true)
  })

  it('uses pay schedule for contractor pay in no-show', () => {
    // No-show calculates contractor as normal 30-min session
    // Pay schedule says 30-min = $38.50
    const result = calculateNoShowPricing(mockServiceType)
    expect(result.contractorPay).toBe(38.5)
    expect(result.mcaCut).toBe(21.5) // 60 - 38.5
  })
})

// =============================================================================
// BILLING RULES DOCUMENT VERIFICATION
// Tests that match the exact examples from MCA-Billing-and-Pay-Rules.md
// =============================================================================

describe('billing rules: where every dollar goes', () => {
  // Section 9 of the billing rules doc — exact dollar examples Amara signed off on

  it('typical session: $100 total → $77 contractor → $23 MCA', () => {
    const service: ServiceType = {
      id: '1', name: 'In-Home Individual', category: 'music_individual', location: 'in_home',
      base_rate: 100, per_person_rate: 0, mca_percentage: 23,
      contractor_cap: null, total_cap: null, rent_percentage: 0,
      minimum_attendees: 1, scholarship_discount_percentage: 0, scholarship_rate: null,
      contractor_pay_schedule: null, group_contractor_pay: null,
      is_active: true, is_scholarship: false, requires_client: true,
      allowed_contractor_ids: null, display_order: 0,
      organization_id: 'org-1', created_at: '', updated_at: '',
    }

    const result = calculateSessionPricing(service, 1, 30)
    expect(result.totalAmount).toBe(100)
    expect(result.contractorPay).toBe(77)
    expect(result.mcaCut).toBe(23)
  })

  it('scholarship session: $60 billed, contractor still $77, MCA absorbs -$17', () => {
    const service: ServiceType = {
      id: '1', name: 'In-Home Individual', category: 'music_individual', location: 'in_home',
      base_rate: 100, per_person_rate: 0, mca_percentage: 23,
      contractor_cap: null, total_cap: null, rent_percentage: 0,
      minimum_attendees: 1, scholarship_discount_percentage: 0, scholarship_rate: 60,
      contractor_pay_schedule: null, group_contractor_pay: null,
      is_active: true, is_scholarship: false, requires_client: true,
      allowed_contractor_ids: null, display_order: 0,
      organization_id: 'org-1', created_at: '', updated_at: '',
    }

    const result = calculateSessionPricing(service, 1, 30, undefined, {
      paymentMethod: 'scholarship',
    })
    expect(result.totalAmount).toBe(60)
    expect(result.contractorPay).toBe(77) // Same as non-scholarship
    expect(result.mcaCut).toBe(-17) // MCA absorbs the loss
    expect(result.scholarshipDiscount).toBe(40) // $100 - $60
  })

  it('no-show: $60 fee → $38.50 contractor → $21.50 MCA', () => {
    const service: ServiceType = {
      id: '1', name: 'In-Home Individual', category: 'music_individual', location: 'in_home',
      base_rate: 50, per_person_rate: 0, mca_percentage: 23,
      contractor_cap: null, total_cap: null, rent_percentage: 0,
      minimum_attendees: 1, scholarship_discount_percentage: 0, scholarship_rate: null,
      contractor_pay_schedule: null, group_contractor_pay: null,
      is_active: true, is_scholarship: false, requires_client: true,
      allowed_contractor_ids: null, display_order: 0,
      organization_id: 'org-1', created_at: '', updated_at: '',
    }

    const result = calculateNoShowPricing(service)
    expect(result.totalAmount).toBe(60)
    expect(result.contractorPay).toBe(38.5)
    expect(result.mcaCut).toBe(21.5)
    expect(result.isNoShow).toBe(true)
  })
})

describe('billing rules: group session billing with duration', () => {
  // Section 2: Total = (Base Rate + Per-Person Rate × Attendees) × duration multiplier
  // Solo exception: 1 attendee → per-person charge waived

  const groupService: ServiceType = {
    id: '1', name: 'Group Music', category: 'music_group', location: 'in_home',
    base_rate: 60, per_person_rate: 20, mca_percentage: 0,
    contractor_cap: null, total_cap: null, rent_percentage: 0,
    minimum_attendees: 1, scholarship_discount_percentage: 0, scholarship_rate: null,
    contractor_pay_schedule: null, group_contractor_pay: null,
    is_active: true, is_scholarship: false, requires_client: true,
    allowed_contractor_ids: null, display_order: 0,
    organization_id: 'org-1', created_at: '', updated_at: '',
  }

  it('3 attendees at 30 min: $60 + $20×3 = $120', () => {
    const result = calculateSessionPricing(groupService, 3, 30)
    expect(result.totalAmount).toBe(120)
  })

  it('3 attendees at 45 min: ($60 + $20×3) × 1.5 = $180', () => {
    const result = calculateSessionPricing(groupService, 3, 45)
    expect(result.totalAmount).toBe(180)
  })

  it('6 attendees at 60 min: ($60 + $20×6) × 2 = $360', () => {
    const result = calculateSessionPricing(groupService, 6, 60)
    expect(result.totalAmount).toBe(360)
  })

  it('solo exception at 45 min: 1 attendee → $60 × 1.5 = $90 (no per-person)', () => {
    const result = calculateSessionPricing(groupService, 1, 45)
    expect(result.totalAmount).toBe(90) // base only, scaled by 1.5
  })
})

describe('billing rules: contractor pay priority chain', () => {
  // Section 3: Priority 1 = group matrix, 2 = custom rate, 3 = pay schedule, 4 = formula

  const serviceWithEverything: ServiceType = {
    id: '1', name: 'Group Music', category: 'music_group', location: 'in_home',
    base_rate: 60, per_person_rate: 20, mca_percentage: 23,
    contractor_cap: null, total_cap: null, rent_percentage: 0,
    minimum_attendees: 1, scholarship_discount_percentage: 0, scholarship_rate: null,
    contractor_pay_schedule: { '30': 38.5, '45': 54 },
    group_contractor_pay: { '3_30': 63 },
    is_active: true, is_scholarship: false, requires_client: true,
    allowed_contractor_ids: null, display_order: 0,
    organization_id: 'org-1', created_at: '', updated_at: '',
  }

  it('priority 1: group matrix beats custom rate when matrix entry exists', () => {
    // Matrix says 3 clients 30 min = $63
    // Custom rate would give $45
    // Matrix should win
    const result = calculateSessionPricing(serviceWithEverything, 3, 30, {
      customContractorPay: 45,
    })
    expect(result.contractorPay).toBe(63) // Matrix wins
  })

  it('priority 2: custom rate beats pay schedule', () => {
    // No matrix entry for 1 client (individual), so matrix skipped
    // Custom rate = $42, schedule says $38.50
    // Custom should win
    const individualService: ServiceType = {
      ...serviceWithEverything,
      per_person_rate: 0, // Not a group → matrix ignored
    }
    const result = calculateSessionPricing(individualService, 1, 30, {
      customContractorPay: 42,
    })
    expect(result.contractorPay).toBe(42) // Custom rate wins over schedule's $38.50
  })

  it('priority 3: pay schedule beats formula', () => {
    // No custom rate, no matrix (individual service)
    // Schedule says 30 min = $38.50
    // Formula would give: $60 - 23% = $46.20
    // Schedule should win
    const individualService: ServiceType = {
      ...serviceWithEverything,
      per_person_rate: 0,
    }
    const result = calculateSessionPricing(individualService, 1, 30)
    expect(result.contractorPay).toBe(38.5) // Schedule wins over formula's $46.20
  })

  it('priority 4: formula used when nothing else applies', () => {
    // No matrix, no custom rate, no schedule
    const bareService: ServiceType = {
      ...serviceWithEverything,
      per_person_rate: 0,
      contractor_pay_schedule: null,
      group_contractor_pay: null,
    }
    const result = calculateSessionPricing(bareService, 1, 30)
    // Formula: $60 - 23% = $46.20
    expect(result.contractorPay).toBe(46.2)
    expect(result.mcaCut).toBe(13.8) // 23% of 60
  })
})

describe('billing rules: MCA cut invariant', () => {
  // Fundamental rule: MCA cut always = total amount - contractor pay

  it('individual session', () => {
    const service: ServiceType = {
      id: '1', name: 'Test', category: 'music_individual', location: 'in_home',
      base_rate: 80, per_person_rate: 0, mca_percentage: 25,
      contractor_cap: null, total_cap: null, rent_percentage: 0,
      minimum_attendees: 1, scholarship_discount_percentage: 0, scholarship_rate: null,
      contractor_pay_schedule: null, group_contractor_pay: null,
      is_active: true, is_scholarship: false, requires_client: true,
      allowed_contractor_ids: null, display_order: 0,
      organization_id: 'org-1', created_at: '', updated_at: '',
    }
    const result = calculateSessionPricing(service, 1, 30)
    expect(result.mcaCut).toBe(result.totalAmount - result.contractorPay)
  })

  it('group session with per-person rate', () => {
    const service: ServiceType = {
      id: '1', name: 'Test', category: 'music_group', location: 'in_home',
      base_rate: 60, per_person_rate: 20, mca_percentage: 30,
      contractor_cap: null, total_cap: null, rent_percentage: 0,
      minimum_attendees: 1, scholarship_discount_percentage: 0, scholarship_rate: null,
      contractor_pay_schedule: null, group_contractor_pay: null,
      is_active: true, is_scholarship: false, requires_client: true,
      allowed_contractor_ids: null, display_order: 0,
      organization_id: 'org-1', created_at: '', updated_at: '',
    }
    const result = calculateSessionPricing(service, 5, 45)
    expect(result.mcaCut).toBe(result.totalAmount - result.contractorPay)
  })

  it('scholarship session (negative MCA is valid)', () => {
    const service: ServiceType = {
      id: '1', name: 'Test', category: 'music_individual', location: 'in_home',
      base_rate: 100, per_person_rate: 0, mca_percentage: 23,
      contractor_cap: null, total_cap: null, rent_percentage: 0,
      minimum_attendees: 1, scholarship_discount_percentage: 0, scholarship_rate: 60,
      contractor_pay_schedule: null, group_contractor_pay: null,
      is_active: true, is_scholarship: false, requires_client: true,
      allowed_contractor_ids: null, display_order: 0,
      organization_id: 'org-1', created_at: '', updated_at: '',
    }
    const result = calculateSessionPricing(service, 1, 30, undefined, {
      paymentMethod: 'scholarship',
    })
    expect(result.mcaCut).toBe(result.totalAmount - result.contractorPay)
    expect(result.mcaCut).toBeLessThan(0) // MCA absorbs the loss
  })

  it('session with contractor cap', () => {
    const service: ServiceType = {
      id: '1', name: 'Test', category: 'music_individual', location: 'in_home',
      base_rate: 200, per_person_rate: 0, mca_percentage: 20,
      contractor_cap: 100, total_cap: null, rent_percentage: 0,
      minimum_attendees: 1, scholarship_discount_percentage: 0, scholarship_rate: null,
      contractor_pay_schedule: null, group_contractor_pay: null,
      is_active: true, is_scholarship: false, requires_client: true,
      allowed_contractor_ids: null, display_order: 0,
      organization_id: 'org-1', created_at: '', updated_at: '',
    }
    const result = calculateSessionPricing(service, 1, 30)
    expect(result.contractorPay).toBe(100) // Capped
    expect(result.mcaCut).toBe(result.totalAmount - result.contractorPay)
  })

  it('no-show session', () => {
    const service: ServiceType = {
      id: '1', name: 'Test', category: 'music_individual', location: 'in_home',
      base_rate: 50, per_person_rate: 0, mca_percentage: 23,
      contractor_cap: null, total_cap: null, rent_percentage: 0,
      minimum_attendees: 1, scholarship_discount_percentage: 0, scholarship_rate: null,
      contractor_pay_schedule: null, group_contractor_pay: null,
      is_active: true, is_scholarship: false, requires_client: true,
      allowed_contractor_ids: null, display_order: 0,
      organization_id: 'org-1', created_at: '', updated_at: '',
    }
    const result = calculateNoShowPricing(service)
    expect(result.mcaCut).toBe(result.totalAmount - result.contractorPay)
  })
})
