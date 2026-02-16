import type { ServiceType } from '@/types/database'

/** @deprecated Use organization.settings.pricing.no_show_fee instead (default: 60) */
const DEFAULT_NO_SHOW_FEE = 60

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
 * Fetched from contractor_rates table (30-min rate + optional increment per service type)
 */
export interface ContractorPricingOverrides {
  /** Custom contractor pay for this service type (30-min base rate) */
  customContractorPay?: number
  /** Custom $/15min increment for durations beyond 30 min. null = use service type default */
  durationIncrement?: number | null
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
 * Calculate pricing for a session based on service type, number of attendees, and duration.
 * All rates come from the database (service_types + contractor_rates tables).
 *
 * Contractor pay priority:
 * 1. Custom rate + explicit durationIncrement → formula: base + (increment * steps)
 * 2. Custom rate + schedule offset → customRate + (schedule[dur] - schedule[30])
 * 3. Pay schedule amount for the duration
 * 4. Formula: total - MCA% (with optional contractor cap)
 *
 * @param serviceType - Service type configuration (from DB)
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
  // Priority: 1) custom rate + increment, 2) custom rate + schedule offset, 3) pay schedule, 4) formula
  let contractorPay: number

  const schedule = serviceType.contractor_pay_schedule
  const scheduleKey = String(durationMinutes)
  const schedulePay = schedule?.[scheduleKey]
  const scheduleBase = schedule?.[String(durationBase)]

  if (effectiveOverrides?.customContractorPay !== undefined) {
    if (durationMinutes === durationBase) {
      // At base duration: use custom rate directly
      contractorPay = effectiveOverrides.customContractorPay
    } else if (effectiveOverrides.durationIncrement !== undefined) {
      // Explicit increment provided (number or null)
      const increment = effectiveOverrides.durationIncrement
        ?? getDefaultIncrement(schedule, durationBase)
      if (increment != null) {
        const steps = (durationMinutes - durationBase) / 15
        contractorPay = effectiveOverrides.customContractorPay + (increment * steps)
      } else {
        // No increment and no schedule: scale proportionally
        contractorPay = effectiveOverrides.customContractorPay * durationMultiplier
      }
    } else if (schedulePay !== undefined && scheduleBase !== undefined) {
      // Fallback: custom rate + schedule offset from base
      contractorPay = effectiveOverrides.customContractorPay + (schedulePay - scheduleBase)
    } else {
      // No schedule, no increment: scale linearly from custom rate
      contractorPay = effectiveOverrides.customContractorPay * durationMultiplier
    }
    mcaCut = totalAmount - contractorPay
  } else if (schedulePay !== undefined) {
    // No custom rate: use pay schedule amount for this duration
    contractorPay = schedulePay
    mcaCut = totalAmount - contractorPay
  } else {
    // Default: total - MCA cut
    contractorPay = totalAmount - mcaCut

    // Apply contractor cap if specified
    if (serviceType.contractor_cap !== null && contractorPay > serviceType.contractor_cap) {
      const excess = contractorPay - serviceType.contractor_cap
      contractorPay = serviceType.contractor_cap
      mcaCut += excess
    }
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
 * Derive the default per-15-min increment from a service type's pay schedule.
 * Returns null if the schedule doesn't have enough data.
 */
export function getDefaultIncrement(
  schedule: Record<string, number> | null,
  durationBase: number = 30
): number | null {
  if (!schedule) return null
  const basePay = schedule[String(durationBase)]
  const nextPay = schedule[String(durationBase + 15)]
  if (basePay === undefined || nextPay === undefined) return null
  return round(nextPay - basePay)
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
 * No-show fee comes from organization settings (default: 60)
 * Contractor gets their normal session pay (as if the session happened for 30 min)
 * MCA cut = no-show fee - contractor pay
 */
export function calculateNoShowPricing(
  serviceType: ServiceType,
  contractorOverrides?: ContractorPricingOverrides,
  noShowFee?: number
): PricingCalculation {
  const totalAmount = noShowFee ?? DEFAULT_NO_SHOW_FEE

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
