import type { OrganizationSettings, ServiceType } from '@/types/database'
import {
  calculateSessionPricing,
  calculateNoShowPricing,
  type ContractorPaySource,
  type ContractorPricingOverrides,
  type PricingCalculation,
} from '@/lib/pricing'

/**
 * Pure input assembly for the pricing hub's live simulator card. Mirrors the same
 * `calculateSessionPricing` / `calculateNoShowPricing` priority rules the rest of the app
 * uses — this module only decides WHICH arguments to pass, not how pricing is computed.
 */
export interface SimulatorState {
  serviceType: ServiceType
  /** Clamped to >= 1 inside `simulate()`; only meaningful for group services. */
  headcount: number
  durationMinutes: number
  contractorOverrides?: ContractorPricingOverrides
  /** Forced true when `serviceType.is_scholarship`, regardless of this flag. */
  scholarship: boolean
  noShow: boolean
}

export interface SimulationResult extends PricingCalculation {
  appliedNoShowFee?: number
}

/** A group service charges per attendee (per_person_rate > 0). */
export function isGroupService(st: ServiceType): boolean {
  return st.per_person_rate > 0
}

/** Scholarship services always price via the scholarship rule — the toggle can't turn it off. */
export function scholarshipLocked(st: ServiceType): boolean {
  return st.is_scholarship
}

export function simulate(
  state: SimulatorState,
  settings: OrganizationSettings | null | undefined
): SimulationResult {
  const scholarship = state.scholarship || scholarshipLocked(state.serviceType)

  if (state.noShow) {
    const fee = settings?.pricing?.no_show_fee ?? 60
    return {
      ...calculateNoShowPricing(state.serviceType, state.contractorOverrides, fee),
      appliedNoShowFee: fee,
    }
  }

  const attendeeCount = isGroupService(state.serviceType) ? Math.max(1, state.headcount) : 1

  return calculateSessionPricing(state.serviceType, attendeeCount, state.durationMinutes, undefined, {
    contractorOverrides: state.contractorOverrides,
    paymentMethod: scholarship ? 'scholarship' : undefined,
    durationBaseMinutes: settings?.pricing?.duration_base_minutes,
  })
}

export const PAY_SOURCE_LABELS: Record<ContractorPaySource, string> = {
  group_matrix: 'Group pay matrix',
  custom_rate_increment: 'Custom contractor rate',
  custom_rate_schedule_offset: 'Custom rate + schedule offset',
  custom_rate_scaled: 'Custom rate (scaled by duration)',
  pay_schedule: 'Service pay schedule',
  formula: 'Formula: total − MCA %',
}
