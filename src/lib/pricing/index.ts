import type { ServiceType } from '@/types/database'

/**
 * Flat fee charged for no-show sessions regardless of service type or group size
 */
export const NO_SHOW_FEE = 50

export interface PricingCalculation {
  totalAmount: number
  perPersonCost: number
  mcaCut: number
  contractorPay: number
  rentAmount: number
  isNoShow?: boolean
}

/**
 * Calculate pricing for a session based on service type, number of attendees, and duration
 *
 * Pricing rules from project_notes.md:
 * - In-Home Individual: $50/30min, 23% MCA
 * - In-Home Group: $50 flat + $20/person, 30% MCA, contractor caps at $105
 * - Matt's Music Individual: $55, 30% MCA, 10% rent
 * - Matt's Music Group: $50 flat + $20/person
 * - Individual Art: $40, 20% MCA
 * - Group Art: $40 flat + $15/person, 30% MCA
 *
 * Duration multiplier: base rates are for 30 minutes, scale proportionally
 */
export function calculateSessionPricing(
  serviceType: ServiceType,
  attendeeCount: number,
  durationMinutes: number = 30
): PricingCalculation {
  // Ensure at least 1 attendee
  const count = Math.max(1, attendeeCount)

  // Duration multiplier (base rates are for 30 minutes)
  const durationMultiplier = durationMinutes / 30

  // Calculate total amount
  // For groups: base_rate + (per_person_rate * additional people)
  // "Additional person" means everyone after the first
  const additionalPeople = count > 1 ? count - 1 : 0
  const baseAmount = serviceType.base_rate + (serviceType.per_person_rate * additionalPeople)
  const totalAmount = baseAmount * durationMultiplier

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
    durationMinutes?: number
  }>
): number {
  return sessions.reduce((total, session) => {
    const calc = calculateSessionPricing(session.serviceType, session.attendeeCount, session.durationMinutes)
    return total + calc.contractorPay
  }, 0)
}

/**
 * Calculate pricing for a no-show session
 * No-show sessions are charged a flat $50 fee regardless of service type or group size
 * MCA takes their percentage, contractor gets the rest (no rent for no-shows)
 */
export function calculateNoShowPricing(serviceType: ServiceType): PricingCalculation {
  const totalAmount = NO_SHOW_FEE
  const mcaCut = round((totalAmount * serviceType.mca_percentage) / 100)
  const contractorPay = round(totalAmount - mcaCut)

  return {
    totalAmount,
    perPersonCost: totalAmount,
    mcaCut,
    contractorPay,
    rentAmount: 0,
    isNoShow: true,
  }
}

/**
 * Get a human-readable description of the pricing for a service type
 * @param showFormula - If false, returns simplified pricing without formula details (for contractors)
 */
export function getPricingDescription(serviceType: ServiceType, showFormula: boolean = true): string {
  const isGroup = serviceType.per_person_rate > 0

  let description = `$${serviceType.base_rate}`

  if (isGroup) {
    description += ` + $${serviceType.per_person_rate}/additional person`
  }

  // Only show formula details (MCA %, cap, rent) if requested
  if (showFormula) {
    description += ` (${serviceType.mca_percentage}% MCA)`

    if (serviceType.contractor_cap) {
      description += `, contractor max $${serviceType.contractor_cap}`
    }

    if (serviceType.rent_percentage > 0) {
      description += `, ${serviceType.rent_percentage}% rent`
    }
  }

  return description
}
