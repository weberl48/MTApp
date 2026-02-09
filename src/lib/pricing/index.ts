import type { ServiceType } from '@/types/database'

/**
 * Flat fee charged for no-show sessions regardless of service type or group size
 */
export const NO_SHOW_FEE = 60

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
  /** Base duration in minutes for rate scaling (default: 30) */
  durationBaseMinutes?: number
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

  // Duration multiplier (base rates are for the configured base duration)
  const durationBase = options?.durationBaseMinutes ?? 30
  const durationMultiplier = durationMinutes / durationBase

  // Calculate total amount
  // For groups: base_rate + (per_person_rate * total attendees)
  const baseAmount = serviceType.base_rate + (serviceType.per_person_rate * count)
  let totalAmount = baseAmount * durationMultiplier

  // Rent is no longer used - keeping field for backwards compatibility
  const rentAmount = 0

  // Calculate MCA cut (percentage of total)
  let mcaCut = (totalAmount * serviceType.mca_percentage) / 100

  // Calculate contractor pay
  // Priority: 1) custom rate (30-min only), 2) pay schedule, 3) formula
  let contractorPay: number

  // Check for explicit pay schedule amount for this duration
  const scheduleKey = String(durationMinutes)
  const schedulePay = serviceType.contractor_pay_schedule?.[scheduleKey]

  if (effectiveOverrides?.customContractorPay !== undefined && durationMinutes === durationBase) {
    // Custom contractor rate applies at the base duration only (e.g., 30 min)
    contractorPay = effectiveOverrides.customContractorPay
    mcaCut = totalAmount - contractorPay
  } else if (schedulePay !== undefined) {
    // Use explicit pay schedule amount for this duration
    contractorPay = schedulePay
    mcaCut = totalAmount - contractorPay
  } else if (effectiveOverrides?.customContractorPay !== undefined) {
    // Custom rate exists but not at this duration — scale linearly from it
    contractorPay = effectiveOverrides.customContractorPay * durationMultiplier
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

  // Apply scholarship pricing AFTER contractor pay is calculated
  // Contractor gets their normal pay regardless of scholarship; MCA absorbs the discount
  let scholarshipDiscount = 0
  if (paymentMethod === 'scholarship') {
    if (serviceType.scholarship_rate != null) {
      // Flat scholarship rate per session (e.g., $60 regardless of duration)
      const normalTotal = totalAmount
      totalAmount = serviceType.scholarship_rate
      scholarshipDiscount = round(normalTotal - totalAmount)
      // Contractor pay stays the same; MCA absorbs the difference
      mcaCut = totalAmount - contractorPay
    } else if (serviceType.scholarship_discount_percentage) {
      // Legacy: percentage-based discount (backward compatibility)
      const normalTotal = totalAmount
      scholarshipDiscount = round((normalTotal * serviceType.scholarship_discount_percentage) / 100)
      totalAmount = normalTotal - scholarshipDiscount
      // Contractor pay stays the same; MCA absorbs the difference
      mcaCut = totalAmount - contractorPay
    }
  }

  // Per-person cost (for billing purposes, divided evenly)
  const perPersonCost = totalAmount / count

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
 * No-show sessions are charged a flat $60 fee regardless of service type or group size
 * Contractor gets their normal session pay (as if the session happened for 30 min)
 * MCA cut = no-show fee - contractor pay
 */
export function calculateNoShowPricing(
  serviceType: ServiceType,
  contractorOverrides?: ContractorPricingOverrides,
  noShowFee?: number
): PricingCalculation {
  const totalAmount = noShowFee ?? NO_SHOW_FEE

  // Calculate contractor pay as if a normal 30-min session happened
  const normalPricing = calculateSessionPricing(serviceType, 1, 30, contractorOverrides)
  const contractorPay = normalPricing.contractorPay

  // MCA gets whatever is left from the no-show fee after contractor pay
  const mcaCut = round(totalAmount - contractorPay)

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
    description += ` + $${serviceType.per_person_rate}/person`
  }

  // Only show formula details (MCA %, cap) if requested
  if (showFormula) {
    if (serviceType.mca_percentage > 0) {
      description += ` (${serviceType.mca_percentage}% MCA)`
    }

    if (serviceType.contractor_cap) {
      description += `, contractor max $${serviceType.contractor_cap}`
    }
  }

  return description
}
