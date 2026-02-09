'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateSessionPricing } from '@/lib/pricing'
import type { ServiceType } from '@/types/database'

interface GenerateBatchInvoiceParams {
  clientId: string
  billingPeriod: string // e.g., '2026-02'
  organizationId: string
}

export async function generateScholarshipBatchInvoice({
  clientId,
  billingPeriod,
  organizationId,
}: GenerateBatchInvoiceParams) {
  const supabase = await createClient()

  // 1. Check for existing batch invoice for this client+month
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('client_id', clientId)
    .eq('billing_period', billingPeriod)
    .eq('invoice_type', 'batch')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (existing) {
    return { success: false as const, error: 'A batch invoice already exists for this client and month' }
  }

  // 2. Find sessions for this client in the given month
  const [year, month] = billingPeriod.split('-')
  const startDate = `${year}-${month}-01`
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
  const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

  // Get all session_attendees for this client in the date range
  const { data: attendeeRows, error: attendeeError } = await supabase
    .from('session_attendees')
    .select(`
      session_id,
      session:sessions!inner(
        id, date, duration_minutes, status, group_headcount,
        contractor:users!sessions_contractor_id_fkey(id, name),
        service_type:service_types!inner(*)
      )
    `)
    .eq('client_id', clientId)

  if (attendeeError) {
    return { success: false as const, error: attendeeError.message }
  }

  // Filter to sessions in the month that are submitted/approved
  const eligibleSessions = (attendeeRows || []).filter((row) => {
    const session = row.session as unknown as {
      id: string; date: string; duration_minutes: number; status: string; group_headcount: number | null
      contractor: { id: string; name: string } | null
      service_type: ServiceType
    }
    if (!session) return false
    if (session.date < startDate || session.date > endDate) return false
    if (session.status !== 'submitted' && session.status !== 'approved') return false
    return true
  })

  if (eligibleSessions.length === 0) {
    return { success: false as const, error: 'No eligible sessions found for this period' }
  }

  // 3. Check which sessions already have invoices for this client (legacy per-session invoices)
  const sessionIds = eligibleSessions.map((row) => row.session_id)
  const { data: existingInvoices } = await supabase
    .from('invoices')
    .select('session_id')
    .eq('client_id', clientId)
    .in('session_id', sessionIds)

  const invoicedSessionIds = new Set((existingInvoices || []).map((i) => i.session_id))

  // Also check which sessions are already in invoice_items
  const { data: existingItems } = await supabase
    .from('invoice_items')
    .select('session_id')
    .in('session_id', sessionIds)

  const itemizedSessionIds = new Set((existingItems || []).map((i) => i.session_id))

  const uninvoicedSessions = eligibleSessions.filter(
    (row) => !invoicedSessionIds.has(row.session_id) && !itemizedSessionIds.has(row.session_id)
  )

  if (uninvoicedSessions.length === 0) {
    return { success: false as const, error: 'All sessions in this period are already invoiced' }
  }

  // 4. Calculate totals and build line items
  let totalAmount = 0
  let totalMcaCut = 0
  let totalContractorPay = 0
  let totalRent = 0

  interface ItemData {
    session_id: string
    description: string
    session_date: string
    duration_minutes: number
    amount: number
    mca_cut: number
    contractor_pay: number
    rent_amount: number
    service_type_name: string | null
    contractor_name: string | null
  }

  const items: ItemData[] = []

  for (const row of uninvoicedSessions) {
    const session = row.session as unknown as {
      id: string; date: string; duration_minutes: number; group_headcount: number | null
      contractor: { id: string; name: string } | null
      service_type: ServiceType
    }

    const serviceType = session.service_type
    const attendeeCount = session.group_headcount || 1
    const pricing = calculateSessionPricing(
      serviceType, attendeeCount, session.duration_minutes, undefined,
      { paymentMethod: 'scholarship' }
    )

    totalAmount += pricing.totalAmount
    totalMcaCut += pricing.mcaCut
    totalContractorPay += pricing.contractorPay
    totalRent += pricing.rentAmount

    items.push({
      session_id: session.id,
      description: `${serviceType.name} - ${session.duration_minutes} min`,
      session_date: session.date,
      duration_minutes: session.duration_minutes,
      amount: pricing.totalAmount,
      mca_cut: pricing.mcaCut,
      contractor_pay: pricing.contractorPay,
      rent_amount: pricing.rentAmount,
      service_type_name: serviceType.name,
      contractor_name: session.contractor?.name || null,
    })
  }

  // 5. Create the batch invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      session_id: null,
      client_id: clientId,
      amount: Math.round(totalAmount * 100) / 100,
      mca_cut: Math.round(totalMcaCut * 100) / 100,
      contractor_pay: Math.round(totalContractorPay * 100) / 100,
      rent_amount: Math.round(totalRent * 100) / 100,
      payment_method: 'scholarship' as const,
      status: 'pending' as const,
      invoice_type: 'batch',
      billing_period: billingPeriod,
      organization_id: organizationId,
    })
    .select()
    .single()

  if (invoiceError) {
    return { success: false as const, error: invoiceError.message }
  }

  // 6. Insert line items
  const itemsToInsert = items.map((item) => ({
    ...item,
    invoice_id: invoice.id,
  }))

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsToInsert)

  if (itemsError) {
    // Clean up the parent invoice if items failed
    await supabase.from('invoices').delete().eq('id', invoice.id)
    return { success: false as const, error: itemsError.message }
  }

  revalidatePath('/invoices')
  revalidatePath('/dashboard')

  return { success: true as const, invoiceId: invoice.id }
}
