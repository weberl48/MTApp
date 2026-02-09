import type { SupabaseClient } from '@supabase/supabase-js'
import type { PricingCalculation } from '@/lib/pricing'

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
  pricing: PricingCalculation
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
    groupHeadcount, pricing,
  } = params

  // Get client payment methods for invoicing
  const { data: clientData } = await supabase
    .from('clients')
    .select('id, payment_method')
    .in('id', clientIds)

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
      group_member_names: null,
      organization_id: organizationId,
    })
    .select()
    .single()

  if (sessionError) throw sessionError

  // Add attendees
  const attendees = clientIds.map((clientId) => ({
    session_id: session.id,
    client_id: clientId,
    individual_cost: pricing.totalAmount,
  }))

  const { error: attendeesError } = await supabase
    .from('session_attendees')
    .insert(attendees)

  if (attendeesError) throw attendeesError

  // If submitted, create invoices for each non-scholarship client
  let invoiceError = false
  if (status === 'submitted' || status === 'approved') {
    const invoices = (clientData || [])
      .filter((client) => client.payment_method !== 'scholarship')
      .map((client) => ({
        session_id: session.id,
        client_id: client.id,
        amount: pricing.totalAmount,
        mca_cut: pricing.mcaCut,
        contractor_pay: pricing.contractorPay,
        rent_amount: pricing.rentAmount,
        payment_method: client.payment_method,
        status: 'pending' as const,
        organization_id: organizationId,
      }))

    if (invoices.length > 0) {
      const { error } = await supabase.from('invoices').insert(invoices)
      if (error) invoiceError = true
    }
  }

  return { sessionId: session.id, invoiceError }
}
