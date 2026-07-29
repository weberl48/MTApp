import type { SupabaseClient } from '@supabase/supabase-js'
import type { PricingCalculation } from '@/lib/pricing'
import { ensureSessionInvoices } from '@/lib/invoices/ensure-session-invoices'

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

    // If submitted, create invoices for each per-session-billed client. Scholarship
    // services and scholarship/monthly clients are skipped inside ensureSessionInvoices —
    // those sessions are held for the monthly batch flow instead.
    if (status === 'submitted' || status === 'approved') {
      const result = await ensureSessionInvoices({
        supabase,
        sessionId: session.id,
        organizationId,
        date,
        clientIds,
        isGroup,
        pricing,
        isScholarshipService: isScholarshipService ?? false,
        dueDays,
      })
      invoiceError = result.invoiceError
    }
  }

  return { sessionId: session.id, invoiceError }
}
