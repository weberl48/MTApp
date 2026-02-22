'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateInvoicePaths, requirePermission } from '@/lib/actions/helpers'
import { calculateSessionPricing, ContractorPricingOverrides } from '@/lib/pricing'
import { fetchUnbilledScholarshipSessions, groupUnbilledByClientMonth } from '@/lib/queries/scholarship'
import type { ServiceType, OrganizationSettings } from '@/types/database'
import { addDays, format } from 'date-fns'

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

  // 4. Fetch contractor rates for accurate contractor pay
  const contractorIds = [...new Set(
    uninvoicedSessions
      .map((row) => (row.session as unknown as { contractor: { id: string } | null }).contractor?.id)
      .filter((id): id is string => !!id)
  )]

  const rateMap = new Map<string, ContractorPricingOverrides>()
  if (contractorIds.length > 0) {
    const { data: rates } = await supabase
      .from('contractor_rates')
      .select('user_id, service_type_id, contractor_pay, duration_increment')
      .in('user_id', contractorIds)

    for (const rate of rates || []) {
      rateMap.set(`${rate.user_id}:${rate.service_type_id}`, {
        customContractorPay: rate.contractor_pay,
        durationIncrement: rate.duration_increment,
      })
    }
  }

  // 5. Calculate totals and build line items
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
    const overrides = session.contractor
      ? rateMap.get(`${session.contractor.id}:${serviceType.id}`)
      : undefined
    const pricing = calculateSessionPricing(
      serviceType, attendeeCount, session.duration_minutes, overrides,
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

  // 6. Fetch org settings for due_days
  const { data: orgData } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single()

  const orgSettings = orgData?.settings as OrganizationSettings | undefined
  const dueDays = orgSettings?.invoice?.due_days
  const dueDate = dueDays != null
    ? format(addDays(new Date(), dueDays), 'yyyy-MM-dd')
    : undefined

  // 7. Create the batch invoice
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
      ...(dueDate && { due_date: dueDate }),
    })
    .select()
    .single()

  if (invoiceError) {
    return { success: false as const, error: invoiceError.message }
  }

  // 8. Insert line items
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

  revalidateInvoicePaths()

  return { success: true as const, invoiceId: invoice.id }
}

export async function generateAllUnbilledScholarshipInvoices(organizationId: string) {
  const permErr = await requirePermission('invoice:bulk-action')
  if (permErr) return permErr

  const supabase = await createClient()

  const unbilled = await fetchUnbilledScholarshipSessions(supabase)
  const groups = groupUnbilledByClientMonth(unbilled)

  if (groups.length === 0) {
    return { success: true as const, generated: 0, failed: [] as string[] }
  }

  const results: { generated: number; failed: string[] } = { generated: 0, failed: [] }

  for (const group of groups) {
    const result = await generateScholarshipBatchInvoice({
      clientId: group.clientId,
      billingPeriod: group.month,
      organizationId,
    })

    if (result.success) {
      results.generated++
    } else {
      results.failed.push(`${group.clientName} (${group.month}): ${result.error}`)
    }
  }

  return { success: true as const, ...results }
}
