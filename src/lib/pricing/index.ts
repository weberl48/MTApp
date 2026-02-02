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
  /** @deprecated Rent is no longer used in pricing calculations */
  rentAmount: number
  scholarshipDiscount?: number
  isNoShow?: boolean
}

/**
 * Per-contractor pricing overrides
 * These can be fetched from contractor_rates table and users.pay_increase
 */
export interface ContractorPricingOverrides {
  /** Custom contractor pay for this service type (overrides calculated pay) */
  customContractorPay?: number
  /** Per-session bonus added on top of contractor pay */
  payIncrease?: number
}

/**
 * Validate if attendee count meets minimum requirements for service type
 * @returns Error message if validation fails, null if valid
 */
export function validateMinimumAttendees(
  serviceType: ServiceType,
  attendeeCount: number
): string | null {
  if (serviceType.minimum_attendees && attendeeCount < serviceType.minimum_attendees) {
    return `This service requires at least ${serviceType.minimum_attendees} attendees (currently ${attendeeCount})`
  }
  return null
}

/**
 * Options for pricing calculation
 */
export interface PricingOptions {
  /** Optional per-contractor pricing overrides */
  contractorOverrides?: ContractorPricingOverrides
  /** Client payment method - used for scholarship discounts */
  paymentMethod?: 'private_pay' | 'self_directed' | 'group_home' | 'scholarship' | 'venmo'
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
 *
 * @param serviceType - Service type configuration
 * @param attendeeCount - Number of attendees
 * @param durationMinutes - Session duration in minutes (default 30)
 * @param contractorOverrides - Optional per-contractor pricing overrides (deprecated, use options)
 * @param options - Additional pricing options
 */
export function calculateSessionPricing(
  serviceType: ServiceType,
  attendeeCount: number,
  durationMinutes: number = 30,
  contractorOverrides?: ContractorPricingOverrides,
  options?: PricingOptions
): PricingCalculation {
  // Support both old and new API
  const effectiveOverrides = options?.contractorOverrides || contractorOverrides
  const paymentMethod = options?.paymentMethod

  // Ensure at least 1 attendee
  const count = Math.max(1, attendeeCount)

  // Duration multiplier (base rates are for 30 minutes)
  const durationMultiplier = durationMinutes / 30

  // Calculate total amount
  // For groups: base_rate + (per_person_rate * additional people)
  // "Additional person" means everyone after the first
  const additionalPeople = count > 1 ? count - 1 : 0
  const baseAmount = serviceType.base_rate + (serviceType.per_person_rate * additionalPeople)
  let totalAmount = baseAmount * durationMultiplier

  // Apply scholarship discount if applicable
  let scholarshipDiscount = 0
  if (paymentMethod === 'scholarship' && serviceType.scholarship_discount_percentage) {
    scholarshipDiscount = round((totalAmount * serviceType.scholarship_discount_percentage) / 100)
    totalAmount = totalAmount - scholarshipDiscount
  }

  // Per-person cost (for billing purposes, divided evenly)
  const perPersonCost = totalAmount / count

  // Rent is no longer used - keeping field for backwards compatibility
  const rentAmount = 0

  // Calculate MCA cut (percentage of total)
  let mcaCut = (totalAmount * serviceType.mca_percentage) / 100

  // Calculate contractor pay
  let contractorPay: number

  if (effectiveOverrides?.customContractorPay !== undefined) {
    // Use custom contractor pay rate (from contractor_rates table)
    // Scale by duration multiplier since custom rates are for 30 min base
    contractorPay = effectiveOverrides.customContractorPay * durationMultiplier
    // Recalculate MCA cut: total - contractor pay
    mcaCut = totalAmount - contractorPay
  } else {
    // Default: total - MCA cut
    contractorPay = totalAmount - mcaCut

    // Apply contractor cap if specified (e.g., In-Home Group caps at $105)
    if (serviceType.contractor_cap !== null && contractorPay > serviceType.contractor_cap) {
      // Contractor maxes out, MCA takes the remainder
      const excess = contractorPay - serviceType.contractor_cap
      contractorPay = serviceType.contractor_cap
      mcaCut += excess
    }
  }

  // Add per-session pay increase bonus (from users.pay_increase)
  if (effectiveOverrides?.payIncrease && effectiveOverrides.payIncrease > 0) {
    contractorPay += effectiveOverrides.payIncrease
    // Pay increase comes out of MCA's portion
    mcaCut -= effectiveOverrides.payIncrease
  }

  const result: PricingCalculation = {
    totalAmount: round(totalAmount),
    perPersonCost: round(perPersonCost),
    mcaCut: round(mcaCut),
    contractorPay: round(contractorPay),
    rentAmount: round(rentAmount),
  }

  if (scholarshipDiscount > 0) {
    result.scholarshipDiscount = scholarshipDiscount
  }

  return result
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

  // Only show formula details (MCA %, cap) if requested
  if (showFormula) {
    description += ` (${serviceType.mca_percentage}% MCA)`

    if (serviceType.contractor_cap) {
      description += `, contractor max $${serviceType.contractor_cap}`
    }
  }

  return description
}
