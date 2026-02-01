import { calculateSessionPricing } from './index'
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
    rent_percentage: 0,
    minimum_attendees: 1,
    scholarship_discount_percentage: 0,
    is_active: true,
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

    // 4 people: 50 + (20 * 3) = 110
    // MCA Cut: 30% of 110 = 33
    // Contractor: 110 - 33 = 77 (under cap)
    const result = calculateSessionPricing(groupService, 4)
    expect(result.totalAmount).toBe(110)
    expect(result.mcaCut).toBe(33)
    expect(result.contractorPay).toBe(77)

    // 10 people: 50 + (20 * 9) = 230
    // MCA Cut: 30% of 230 = 69
    // Contractor: 230 - 69 = 161 (over cap of 105)
    // Capped Contractor: 105
    // Adjusted MCA: 30% cut + (161 - 105) = 69 + 56 = 125
    const cappedResult = calculateSessionPricing(groupService, 10)
    expect(cappedResult.totalAmount).toBe(230)
    expect(cappedResult.contractorPay).toBe(105)
    expect(cappedResult.mcaCut).toBe(125)
  })

  it('calculates rent correctly', () => {
    const rentService: ServiceType = {
      ...mockServiceType,
      rent_percentage: 10,
      mca_percentage: 30,
      base_rate: 55,
    }

    // Total: 55
    // Rent: 10% = 5.5
    // MCA: 30% = 16.5
    // Contractor: 55 - 5.5 - 16.5 = 33
    const result = calculateSessionPricing(rentService, 1)
    expect(result.totalAmount).toBe(55)
    expect(result.rentAmount).toBe(5.5)
    expect(result.mcaCut).toBe(16.5)
    expect(result.contractorPay).toBe(33)
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

