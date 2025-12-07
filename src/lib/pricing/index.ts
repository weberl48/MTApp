import type { ServiceType } from '@/types/database'

export interface PricingCalculation {
  totalAmount: number
  perPersonCost: number
  mcaCut: number
  contractorPay: number
  rentAmount: number
}

/**
 * Calculate pricing for a session based on service type and number of attendees
 *
 * Pricing rules from project_notes.md:
 * - In-Home Individual: $50/30min, 23% MCA
 * - In-Home Group: $50 flat + $20/person, 30% MCA, contractor caps at $105
 * - Matt's Music Individual: $55, 30% MCA, 10% rent
 * - Matt's Music Group: $50 flat + $20/person
 * - Individual Art: $40, 20% MCA
 * - Group Art: $40 flat + $15/person, 30% MCA
 */
export function calculateSessionPricing(
  serviceType: ServiceType,
  attendeeCount: number
): PricingCalculation {
  // Ensure at least 1 attendee
  const count = Math.max(1, attendeeCount)

  // Calculate total amount
  // For groups: base_rate + (per_person_rate * additional people)
  // "Additional person" means everyone after the first
  const additionalPeople = count > 1 ? count - 1 : 0
  const totalAmount = serviceType.base_rate + (serviceType.per_person_rate * additionalPeople)

  // Per-person cost (for billing purposes, divided evenly)
  const perPersonCost = totalAmount / count

  // Calculate rent (Matt's Music gets 10% rent)
  const rentAmount = (totalAmount * serviceType.rent_percentage) / 100

  // Calculate MCA cut (percentage of total)
  let mcaCut = (totalAmount * serviceType.mca_percentage) / 100

  // Calculate contractor pay
  // Start with: total - MCA cut - rent
  let contractorPay = totalAmount - mcaCut - rentAmount

  // Apply contractor cap if specified (e.g., In-Home Group caps at $105)
  if (serviceType.contractor_cap !== null && contractorPay > serviceType.contractor_cap) {
    // Contractor maxes out, MCA takes the remainder
    const excess = contractorPay - serviceType.contractor_cap
    contractorPay = serviceType.contractor_cap
    mcaCut += excess
  }

  return {
    totalAmount: round(totalAmount),
    perPersonCost: round(perPersonCost),
    mcaCut: round(mcaCut),
    contractorPay: round(contractorPay),
    rentAmount: round(rentAmount),
  }
}

/**
 * Round to 2 decimal places for currency
 */
function round(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Format amount as currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/**
 * Calculate the total contractor payout for multiple sessions
 */
export function calculateContractorTotal(
  sessions: Array<{
    serviceType: ServiceType
    attendeeCount: number
  }>
): number {
  return sessions.reduce((total, session) => {
    const calc = calculateSessionPricing(session.serviceType, session.attendeeCount)
    return total + calc.contractorPay
  }, 0)
}

/**
 * Get a human-readable description of the pricing for a service type
 */
export function getPricingDescription(serviceType: ServiceType): string {
  const isGroup = serviceType.per_person_rate > 0

  let description = `$${serviceType.base_rate}`

  if (isGroup) {
    description += ` + $${serviceType.per_person_rate}/additional person`
  }

  description += ` (${serviceType.mca_percentage}% MCA)`

  if (serviceType.contractor_cap) {
    description += `, contractor max $${serviceType.contractor_cap}`
  }

  if (serviceType.rent_percentage > 0) {
    description += `, ${serviceType.rent_percentage}% rent`
  }

  return description
}
