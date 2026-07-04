import type { SupabaseClient } from '@supabase/supabase-js'
import type { PricingCalculation } from '@/lib/pricing'
import { distributeAmount } from '@/lib/invoices/split'
import { addDays, format } from 'date-fns'
import { parseLocalDate } from '@/lib/dates'

interface CreateSessionParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
  date: string
  time: string
  durationMinutes: number
  serviceTypeId: string
  contractorId: string
  organizationId: string
  clientIds: string[]
  encryptedNotes: string | null
  encryptedClientNotes: string | null
  status: 'draft' | 'submitted' | 'approved'
  groupHeadcount: number | null
  groupMemberNames: string | null
  classroom: string | null
  pricing: PricingCalculation
  isScholarshipService?: boolean
  dueDays?: number
}

interface CreateSessionResult {
  sessionId: string
  invoiceError?: boolean
}

/**
 * Create a new session with attendees and invoices.
 * Shared between the full session form and the quick-log drawer.
 */
export async function createNewSession(params: CreateSessionParams): Promise<CreateSessionResult> {
  const {
    supabase, date, time, durationMinutes, serviceTypeId,
    contractorId, organizationId, clientIds,
    encryptedNotes, encryptedClientNotes, status,
    groupHeadcount, groupMemberNames, classroom, pricing, isScholarshipService, dueDays,
  } = params

  // Create the session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      date,
      time: time + ':00',
      duration_minutes: durationMinutes,
      service_type_id: serviceTypeId,
      contractor_id: contractorId,
      status,
      notes: encryptedNotes,
      client_notes: encryptedClientNotes,
      group_headcount: groupHeadcount,
      group_member_names: groupMemberNames,
      classroom: classroom ?? null,
      total_amount: pricing.totalAmount,
      contractor_pay: pricing.contractorPay,
      mca_cut: pricing.mcaCut,
      organization_id: organizationId,
    })
    .select()
    .single()

  if (sessionError) throw sessionError

  let invoiceError = false

  // Add attendees and create invoices
  if (clientIds.length > 0) {
    const isGroup = groupHeadcount != null && groupHeadcount > 0

    const attendees = clientIds.map((clientId) => ({
      session_id: session.id,
      client_id: clientId,
      individual_cost: isGroup ? pricing.totalAmount : pricing.perPersonCost,
    }))

    const { error: attendeesError } = await supabase
      .from('session_attendees')
      .insert(attendees)

    if (attendeesError) {
      // Compensate: delete the just-created session so a failed attendee insert doesn't leave
      // an orphaned session (no attendees, invisible to client views but counted in payroll).
      await supabase.from('sessions').delete().eq('id', session.id)
      throw attendeesError
    }

    // If submitted, create invoices for each per-session-billed client.
    // Skipped entirely for scholarship service types, and per-client for
    // scholarship payment or monthly billing frequency — those sessions are
    // held for the monthly batch flow instead.
    if (!isScholarshipService && (status === 'submitted' || status === 'approved')) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, payment_method, billing_frequency, square_fee_enabled')
        .in('id', clientIds)

      const dueDate = dueDays != null
        ? format(addDays(parseLocalDate(date), dueDays), 'yyyy-MM-dd')
        : undefined

      const nonScholarshipClients = (clientData || [])
        .filter((client) => client.payment_method !== 'scholarship' && client.billing_frequency !== 'monthly')
      const invoiceCount = nonScholarshipClients.length

      // Remainder-aware split so the per-client mca_cut / contractor_pay / rent shares sum
      // back to the session total (independent rounding would drift by a cent per split).
      const mcaShares = distributeAmount(pricing.mcaCut, invoiceCount)
      const contractorShares = distributeAmount(pricing.contractorPay, invoiceCount)
      const rentShares = distributeAmount(pricing.rentAmount, invoiceCount)

      const invoices = nonScholarshipClients
        .map((client, i) => ({
          session_id: session.id,
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

      if (invoices.length > 0) {
        const { error } = await supabase.from('invoices').insert(invoices)
        if (error) invoiceError = true
      }
    }
  }

  return { sessionId: session.id, invoiceError }
}
