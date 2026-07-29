import type { SupabaseClient } from '@supabase/supabase-js'
import type { PricingCalculation } from '@/lib/pricing'
import type { OrganizationSettings } from '@/types/database'
import { distributeAmount } from '@/lib/invoices/split'
import { addDays, format } from 'date-fns'
import { parseLocalDate } from '@/lib/dates'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>

export interface EnsureSessionInvoicesParams {
  supabase: AnySupabase
  sessionId: string
  organizationId: string
  /** Session date (yyyy-MM-dd), combined with dueDays for the invoice due date. */
  date: string
  clientIds: string[]
  isGroup: boolean
  pricing: PricingCalculation
  isScholarshipService: boolean
  dueDays?: number
}

export interface EnsureSessionInvoicesResult {
  created: number
  alreadyInvoiced: boolean
  invoiceError: boolean
}

/**
 * Create the per-session invoices for a session if — and only if — none exist yet.
 *
 * The single shared home for per-session invoice creation (bug: sessions submitted from
 * draft were never invoiced — docs/bugs/2026-07-29-missing-invoice-on-resubmit.md).
 * Idempotent: an existing invoice of ANY status (a paid invoice must never be doubled)
 * or a batch line item means the session is already billed. Fails safe: when the
 * existence check itself errors, nothing is created.
 *
 * Scholarship service types create nothing; scholarship-payment and monthly-billed
 * clients are skipped per-client — those sessions are held for the monthly batch flow.
 */
export async function ensureSessionInvoices(
  params: EnsureSessionInvoicesParams
): Promise<EnsureSessionInvoicesResult> {
  const { supabase, sessionId, organizationId, date, clientIds, isGroup, pricing, isScholarshipService, dueDays } = params
  const none: EnsureSessionInvoicesResult = { created: 0, alreadyInvoiced: false, invoiceError: false }

  if (isScholarshipService || clientIds.length === 0) return none

  const { data: existingInvoices, error: invoicesCheckError } = await supabase
    .from('invoices')
    .select('id')
    .eq('session_id', sessionId)
    .limit(1)
  if (invoicesCheckError) return { ...none, invoiceError: true }
  if ((existingInvoices ?? []).length > 0) return { ...none, alreadyInvoiced: true }

  const { data: existingItems, error: itemsCheckError } = await supabase
    .from('invoice_items')
    .select('id')
    .eq('session_id', sessionId)
    .limit(1)
  if (itemsCheckError) return { ...none, invoiceError: true }
  if ((existingItems ?? []).length > 0) return { ...none, alreadyInvoiced: true }

  const { data: clientData, error: clientsError } = await supabase
    .from('clients')
    .select('id, payment_method, billing_frequency, square_fee_enabled')
    .in('id', clientIds)
  if (clientsError) return { ...none, invoiceError: true }

  const eligibleClients = (clientData || []).filter(
    (client) => client.payment_method !== 'scholarship' && client.billing_frequency !== 'monthly'
  )
  const invoiceCount = eligibleClients.length
  if (invoiceCount === 0) return none

  const dueDate = dueDays != null
    ? format(addDays(parseLocalDate(date), dueDays), 'yyyy-MM-dd')
    : undefined

  // Remainder-aware split so the per-client mca_cut / contractor_pay / rent shares sum
  // back to the session total (independent rounding would drift by a cent per split).
  const mcaShares = distributeAmount(pricing.mcaCut, invoiceCount)
  const contractorShares = distributeAmount(pricing.contractorPay, invoiceCount)
  const rentShares = distributeAmount(pricing.rentAmount, invoiceCount)

  const invoices = eligibleClients.map((client, i) => ({
    session_id: sessionId,
    client_id: client.id,
    // Group sessions: invoice the full amount to the billing agency
    amount: isGroup ? pricing.totalAmount : pricing.perPersonCost,
    mca_cut: mcaShares[i],
    contractor_pay: contractorShares[i],
    rent_amount: rentShares[i],
    payment_method: client.payment_method,
    status: 'pending' as const,
    // Snapshot the client's Square-fee opt-in; null = follow org setting.
    apply_square_fee: client.square_fee_enabled ? true : null,
    organization_id: organizationId,
    ...(dueDate && { due_date: dueDate }),
  }))

  const { error: insertError } = await supabase.from('invoices').insert(invoices)
  if (insertError) return { ...none, invoiceError: true }

  return { created: invoices.length, alreadyInvoiced: false, invoiceError: false }
}

interface SessionRowForInvoicing {
  id: string
  date: string
  status: string
  organization_id: string
  total_amount: number | null
  mca_cut: number | null
  contractor_pay: number | null
  group_headcount: number | null
  service_type: { is_scholarship: boolean | null } | Array<{ is_scholarship: boolean | null }> | null
  attendees: Array<{ client_id: string; individual_cost: number | null }> | null
}

/**
 * Server-side entry point: load a session by id and ensure its invoices exist,
 * building the pricing from the session's STORED amounts (the billing truth —
 * re-pricing from the service type could drift from what was approved).
 * Rent is retired (always 0 in current pricing) and was never stored on sessions.
 *
 * Used by the "Create Invoice" recovery action and as a backstop on approval.
 */
export async function ensureInvoicesForSessionId(
  supabase: AnySupabase,
  sessionId: string
): Promise<EnsureSessionInvoicesResult & { error?: string }> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id, date, status, organization_id, total_amount, mca_cut, contractor_pay, group_headcount,
      service_type:service_types(is_scholarship),
      attendees:session_attendees(client_id, individual_cost)
    `)
    .eq('id', sessionId)
    .single()

  if (error || !data) {
    return { created: 0, alreadyInvoiced: false, invoiceError: false, error: 'Session not found' }
  }
  const session = data as unknown as SessionRowForInvoicing

  if (session.status !== 'submitted' && session.status !== 'approved') {
    return { created: 0, alreadyInvoiced: false, invoiceError: false, error: 'Only submitted or approved sessions can be invoiced' }
  }

  const attendees = session.attendees ?? []
  if (attendees.length === 0) {
    return { created: 0, alreadyInvoiced: false, invoiceError: false }
  }

  const serviceType = Array.isArray(session.service_type) ? session.service_type[0] : session.service_type

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', session.organization_id)
    .single()
  const dueDays = (org?.settings as OrganizationSettings | undefined)?.invoice?.due_days

  const isGroup = session.group_headcount != null && session.group_headcount > 0
  const totalAmount = Number(session.total_amount ?? 0)
  const perPersonCost = attendees[0]?.individual_cost != null
    ? Number(attendees[0].individual_cost)
    : totalAmount / attendees.length

  return ensureSessionInvoices({
    supabase,
    sessionId: session.id,
    organizationId: session.organization_id,
    date: session.date,
    clientIds: attendees.map((a) => a.client_id),
    isGroup,
    pricing: {
      totalAmount,
      perPersonCost,
      mcaCut: Number(session.mca_cut ?? 0),
      contractorPay: Number(session.contractor_pay ?? 0),
      rentAmount: 0,
    },
    isScholarshipService: serviceType?.is_scholarship ?? false,
    dueDays,
  })
}
