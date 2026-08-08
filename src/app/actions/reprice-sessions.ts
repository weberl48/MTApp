'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requirePermission, revalidateSessionPaths } from '@/lib/actions/helpers'
import { distributeAmount } from '@/lib/invoices/split'
import { repriceEligibility, type RepriceSkipReason } from '@/lib/pricing/reprice-eligibility'
import {
  sessionPricingInputs,
  priceFromInputs,
  pricingDiff,
  type PricingDiff,
} from '@/lib/pricing/price-session'
import type { ServiceType, OrganizationSettings } from '@/types/database'
import { logger } from '@/lib/logger'

/** Ceiling on one call. Large enough for a full re-price, small enough to bound a mistake. */
const MAX_SESSIONS_PER_CALL = 200

export type RepriceOutcome = 'repriced' | 'unchanged' | 'skipped' | 'error'

export interface RepriceResult {
  sessionId: string
  serviceName: string
  date: string
  outcome: RepriceOutcome
  reason?: RepriceSkipReason
  diff?: PricingDiff
  error?: string
}

export interface RepriceResponse {
  success: true
  applied: boolean
  results: RepriceResult[]
}

/**
 * Re-price stored sessions against the CURRENT service types, contractor rates and org settings.
 *
 * The problem it solves: session pricing is a snapshot written once at save time. When an owner
 * corrects a rate or a bad formula, everything already in the approvals queue keeps the old
 * numbers and gets approved at them, silently.
 *
 * Two-phase by design. `apply: false` computes the full diff and writes nothing — the UI shows
 * it and the owner confirms. Only `apply: true` touches a row. Money never changes without
 * somebody having seen the before and after.
 *
 * Owner/developer only via `settings:edit`, which is deliberately absent from
 * ADMIN_GRANTABLE_PERMISSIONS — an admin cannot be granted the ability to rewrite contractor pay.
 *
 * Sessions with a sent, paid, Square-linked or batch invoice are refused with a named reason
 * rather than silently omitted; see `reprice-eligibility.ts`.
 */
export async function repriceSessions(
  sessionIds: string[],
  apply: boolean
): Promise<RepriceResponse | { success: false; error: string }> {
  const denied = await requirePermission('settings:edit')
  if (denied) return denied

  if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
    return { success: false, error: 'No sessions selected' }
  }
  if (sessionIds.length > MAX_SESSIONS_PER_CALL) {
    return {
      success: false,
      error: `Too many sessions at once (${sessionIds.length}). Limit is ${MAX_SESSIONS_PER_CALL}.`,
    }
  }

  const supabase = await createClient()

  // RLS scopes these reads to the caller's organization, so an id from another tenant simply
  // does not come back and is reported as an error rather than acted on.
  const { data: sessionRows, error: sessionsError } = await supabase
    .from('sessions')
    .select(`
      id, date, status, duration_minutes, group_headcount, organization_id,
      service_type_id, contractor_id,
      total_amount, mca_cut, contractor_pay,
      service_type:service_types(*),
      attendees:session_attendees(client_id)
    `)
    .in('id', sessionIds)

  if (sessionsError) {
    logger.error('[MCA] Reprice: failed to load sessions', sessionsError)
    return { success: false, error: 'Failed to load sessions' }
  }

  const sessions = (sessionRows ?? []) as unknown as Array<{
    id: string
    date: string
    status: string
    duration_minutes: number
    group_headcount: number | null
    organization_id: string
    service_type_id: string | null
    contractor_id: string | null
    total_amount: number | null
    mca_cut: number | null
    contractor_pay: number | null
    service_type: ServiceType | ServiceType[] | null
    attendees: Array<{ client_id: string }> | null
  }>

  const found = new Set(sessions.map((s) => s.id))
  const results: RepriceResult[] = sessionIds
    .filter((id) => !found.has(id))
    .map((id) => ({
      sessionId: id,
      serviceName: 'Unknown',
      date: '',
      outcome: 'error' as const,
      error: 'Session not found',
    }))

  if (sessions.length === 0) return { success: true, applied: false, results }

  // --- Bulk-load everything the pricing inputs need, one query per table. ---

  const { data: invoiceRows } = await supabase
    .from('invoices')
    .select('id, session_id, status, square_invoice_id, created_at')
    .in('session_id', Array.from(found))
    .order('created_at', { ascending: true })

  const { data: itemRows } = await supabase
    .from('invoice_items')
    .select('id, session_id')
    .in('session_id', Array.from(found))

  const clientIds = Array.from(
    new Set(sessions.flatMap((s) => (s.attendees ?? []).map((a) => a.client_id)))
  )
  const { data: clientRows } = clientIds.length
    ? await supabase.from('clients').select('id, payment_method').in('id', clientIds)
    : { data: [] as Array<{ id: string; payment_method: string | null }> }

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', sessions[0].organization_id)
    .single()
  const settings = org?.settings as OrganizationSettings | undefined

  // Service client on purpose: `contractor_rates` is owner-only under RLS. Reading it with the
  // user client would return nothing and silently re-price every contractor to the service-type
  // formula instead of their negotiated rate — the exact bug this feature exists to fix.
  const ratePairs = sessions.filter((s) => s.contractor_id && s.service_type_id)
  const { data: rateRows } = ratePairs.length
    ? await createServiceClient()
        .from('contractor_rates')
        .select('contractor_id, service_type_id, contractor_pay, duration_increment')
        .in('contractor_id', Array.from(new Set(ratePairs.map((s) => s.contractor_id!))))
        .in('service_type_id', Array.from(new Set(ratePairs.map((s) => s.service_type_id!))))
    : { data: [] as Array<{ contractor_id: string; service_type_id: string; contractor_pay: number; duration_increment: number | null }> }

  const invoicesBySession = new Map<string, Array<{ id: string; status: string; square_invoice_id: string | null }>>()
  for (const invoice of invoiceRows ?? []) {
    const list = invoicesBySession.get(invoice.session_id) ?? []
    list.push(invoice)
    invoicesBySession.set(invoice.session_id, list)
  }

  const batchItemCounts = new Map<string, number>()
  for (const item of itemRows ?? []) {
    batchItemCounts.set(item.session_id, (batchItemCounts.get(item.session_id) ?? 0) + 1)
  }

  const clients = (clientRows ?? []) as Array<{ id: string; payment_method: string | null }>
  const rateKey = (contractorId: string, serviceTypeId: string) => `${contractorId}:${serviceTypeId}`
  const rates = new Map(
    (rateRows ?? []).map((r) => [
      rateKey(r.contractor_id, r.service_type_id),
      { customContractorPay: r.contractor_pay, durationIncrement: r.duration_increment },
    ])
  )

  // --- Evaluate each session. ---

  for (const session of sessions) {
    const serviceType = (Array.isArray(session.service_type)
      ? session.service_type[0]
      : session.service_type) as ServiceType | null

    const base = {
      sessionId: session.id,
      serviceName: serviceType?.name ?? 'Unknown',
      date: session.date,
    }

    const invoices = invoicesBySession.get(session.id) ?? []
    const eligibility = repriceEligibility(
      { status: session.status, service_type_id: session.service_type_id },
      invoices,
      batchItemCounts.get(session.id) ?? 0
    )

    if (!eligibility.eligible) {
      results.push({ ...base, outcome: 'skipped', reason: eligibility.reason })
      continue
    }

    if (!serviceType) {
      results.push({ ...base, outcome: 'skipped', reason: 'no-service-type' })
      continue
    }

    const attendeeClientIds = (session.attendees ?? []).map((a) => a.client_id)
    const inputs = sessionPricingInputs(
      {
        duration_minutes: session.duration_minutes,
        group_headcount: session.group_headcount,
        attendeeClientIds,
      },
      serviceType,
      clients,
      settings,
      session.contractor_id && session.service_type_id
        ? rates.get(rateKey(session.contractor_id, session.service_type_id))
        : undefined
    )

    if (!inputs) {
      results.push({
        ...base,
        outcome: 'error',
        error: 'Cannot price this session (no attendees or missing group headcount)',
      })
      continue
    }

    const next = priceFromInputs(inputs)
    const diff = pricingDiff(session, next)

    if (!diff.changed) {
      results.push({ ...base, outcome: 'unchanged', diff })
      continue
    }

    if (!apply) {
      results.push({ ...base, outcome: 'repriced', diff })
      continue
    }

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        total_amount: next.totalAmount,
        mca_cut: next.mcaCut,
        contractor_pay: next.contractorPay,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    if (updateError) {
      logger.error('[MCA] Reprice: failed to update session', updateError)
      results.push({ ...base, outcome: 'error', error: 'Failed to update session' })
      continue
    }

    // Re-price the pending invoices, SPLIT across them rather than written in full to each —
    // the same rule markSessionNoShow follows, and for the same reason: a two-client session
    // given the full amount on both invoices double-bills. Eligibility has already guaranteed
    // every invoice here is pending and un-Squared.
    const pending = invoices.filter((invoice) => invoice.status === 'pending')
    if (pending.length > 0) {
      const amounts = distributeAmount(next.totalAmount, pending.length)
      const mcaShares = distributeAmount(next.mcaCut, pending.length)
      const payShares = distributeAmount(next.contractorPay, pending.length)

      for (let i = 0; i < pending.length; i++) {
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update({
            amount: amounts[i],
            mca_cut: mcaShares[i],
            contractor_pay: payShares[i],
            updated_at: new Date().toISOString(),
          })
          .eq('id', pending[i].id)

        if (invoiceError) {
          logger.error('[MCA] Reprice: failed to update invoice', invoiceError)
          results.push({
            ...base,
            outcome: 'error',
            diff,
            error: 'Session re-priced but its invoice failed to update',
          })
          break
        }
      }
    }

    if (!results.some((r) => r.sessionId === session.id)) {
      results.push({ ...base, outcome: 'repriced', diff })
    }
  }

  if (apply) revalidateSessionPaths()

  return { success: true, applied: apply, results }
}
