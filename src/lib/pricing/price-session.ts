import type { ServiceType, OrganizationSettings } from '@/types/database'
import {
  calculateSessionPricing,
  type ContractorPricingOverrides,
  type PricingCalculation,
  type PricingOptions,
} from '@/lib/pricing'

/**
 * Re-price a stored session from the CURRENT service type, contractor rate and org settings.
 *
 * Why this module exists: session pricing is assembled in the browser (`session-form.tsx`,
 * `quick-log-drawer.tsx`) and `createNewSession` merely stores whatever the form computed.
 * There was no server-side way to answer "what would this session cost if it were saved
 * today", which is exactly what a bulk re-price needs.
 *
 * THE CONTRACT: `sessionPricingInputs` must reproduce `session-form.tsx` exactly. If it does
 * not, re-pricing a session nobody has touched silently rewrites correct money. The colocated
 * test pins each branch against the form's logic — when the form's derivation changes, this
 * changes with it, or the bulk re-price starts lying.
 *
 * Mirrored from session-form.tsx (line refs as of 2026-08-07):
 *   - isGroupService   :170  serviceType.per_person_rate > 0
 *   - requiresClient   :189  serviceType.requires_client !== false
 *   - attendeeCount    :195  group → headcount; no-client service → 1; else attendee count
 *   - paymentMethod    :214  scholarship service → 'scholarship'; group → billing agency's
 *                            method; exactly one client → that client's; otherwise undefined
 */

/** A client as far as pricing is concerned. */
export interface PricingClient {
  id: string
  payment_method: string | null
}

/** The stored session fields pricing depends on. */
export interface SessionForPricing {
  duration_minutes: number
  group_headcount: number | null
  /** Attendee client ids, in the order they were attached. */
  attendeeClientIds: string[]
  /**
   * For a group session, the client billed for it. `createNewSession` records the billing
   * agency as the sole attendee of a group session, so this defaults to the first attendee.
   */
  groupBillingClientId?: string | null
}

export interface SessionPricingInputs {
  serviceType: ServiceType
  attendeeCount: number
  durationMinutes: number
  contractorOverrides: ContractorPricingOverrides | undefined
  options: PricingOptions
}

/**
 * Rebuild the arguments `session-form.tsx` would pass to `calculateSessionPricing` for this
 * session. Pure — every input is supplied by the caller so the branch logic can be tested
 * without a database.
 *
 * Returns null when the session cannot be priced (a group session with no headcount would
 * otherwise price as zero attendees and silently produce a smaller total).
 */
export function sessionPricingInputs(
  session: SessionForPricing,
  serviceType: ServiceType,
  clients: PricingClient[],
  settings: OrganizationSettings | undefined,
  contractorRate: ContractorPricingOverrides | undefined
): SessionPricingInputs | null {
  const isGroupService = serviceType.per_person_rate > 0
  const requiresClient = serviceType.requires_client !== false

  const attendeeCount = isGroupService
    ? session.group_headcount ?? 0
    : !requiresClient
      ? 1
      : session.attendeeClientIds.length

  if (attendeeCount <= 0) return null

  const byId = new Map(clients.map((client) => [client.id, client]))

  // Mirrors the form's `selectedPaymentMethod`. Note the ordering: a scholarship SERVICE wins
  // over any client's payment method, and a group falls back to the billing agency rather than
  // the individual attendees (who are not billed).
  let paymentMethod: string | null | undefined
  if (serviceType.is_scholarship) {
    paymentMethod = 'scholarship'
  } else if (isGroupService) {
    const billingId = session.groupBillingClientId ?? session.attendeeClientIds[0]
    paymentMethod = billingId ? byId.get(billingId)?.payment_method : undefined
  } else if (session.attendeeClientIds.length === 1) {
    paymentMethod = byId.get(session.attendeeClientIds[0])?.payment_method
  } else {
    paymentMethod = undefined
  }

  return {
    serviceType,
    attendeeCount,
    durationMinutes: session.duration_minutes,
    contractorOverrides: contractorRate,
    options: {
      paymentMethod: (paymentMethod ?? undefined) as PricingOptions['paymentMethod'],
      durationBaseMinutes: settings?.pricing?.duration_base_minutes,
    },
  }
}

/** Apply `calculateSessionPricing` to assembled inputs. Separate so callers can inspect inputs. */
export function priceFromInputs(inputs: SessionPricingInputs): PricingCalculation {
  return calculateSessionPricing(
    inputs.serviceType,
    inputs.attendeeCount,
    inputs.durationMinutes,
    inputs.contractorOverrides,
    inputs.options
  )
}

export interface PricingDiff {
  totalAmount: { from: number; to: number }
  mcaCut: { from: number; to: number }
  contractorPay: { from: number; to: number }
  changed: boolean
}

/** Money is stored to the cent; compare at that resolution so float noise is not a "change". */
function cents(value: number): number {
  return Math.round(value * 100)
}

/**
 * Compare a session's stored snapshot against freshly computed pricing.
 *
 * A null stored column is treated as 0 for comparison but still reported, so a pre-migration
 * row reads as a real change rather than silently matching.
 */
export function pricingDiff(
  stored: { total_amount: number | null; mca_cut: number | null; contractor_pay: number | null },
  next: PricingCalculation
): PricingDiff {
  const from = {
    totalAmount: Number(stored.total_amount ?? 0),
    mcaCut: Number(stored.mca_cut ?? 0),
    contractorPay: Number(stored.contractor_pay ?? 0),
  }

  return {
    totalAmount: { from: from.totalAmount, to: next.totalAmount },
    mcaCut: { from: from.mcaCut, to: next.mcaCut },
    contractorPay: { from: from.contractorPay, to: next.contractorPay },
    changed:
      cents(from.totalAmount) !== cents(next.totalAmount) ||
      cents(from.mcaCut) !== cents(next.mcaCut) ||
      cents(from.contractorPay) !== cents(next.contractorPay),
  }
}
