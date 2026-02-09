import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { OrganizationSettings } from '@/types/database'

let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }
    supabaseAdmin = createClient(url, key)
  }
  return supabaseAdmin
}

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }
  return process.env.NODE_ENV !== 'production'
}

/**
 * Fetch unbilled scholarship sessions for a specific organization.
 */
async function fetchOrgUnbilledScholarship(supabase: SupabaseClient, orgId: string) {
  // Get scholarship clients for this org
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('payment_method', 'scholarship')
    .eq('organization_id', orgId)

  if (!clients || clients.length === 0) return []

  const clientIds = clients.map((c) => c.id)
  const clientMap = new Map(clients.map((c) => [c.id, c.name]))

  // Get attendees with approved sessions for these clients
  const { data: attendeeRows } = await supabase
    .from('session_attendees')
    .select(`
      client_id,
      session:sessions!inner(
        id, date, duration_minutes, status,
        service_type:service_types(name, scholarship_rate, base_rate, mca_percentage, contractor_cap, rent_percentage, per_person_rate)
      )
    `)
    .in('client_id', clientIds)

  // Get already-invoiced session IDs
  const { data: invoicedRows } = await supabase
    .from('invoices')
    .select('session_id')
    .in('client_id', clientIds)
    .not('session_id', 'is', null)

  const invoicedIds = new Set((invoicedRows || []).map((r) => r.session_id))

  const { data: itemRows } = await supabase
    .from('invoice_items')
    .select('session_id')

  const itemizedIds = new Set((itemRows || []).map((r) => r.session_id))

  type SessionData = {
    id: string
    date: string
    duration_minutes: number
    status: string
    service_type: {
      name: string
      scholarship_rate: number | null
      base_rate: number
      mca_percentage: number
      contractor_cap: number | null
      rent_percentage: number
      per_person_rate: number
    } | null
  }

  const unbilled: {
    sessionId: string
    clientId: string
    clientName: string
    date: string
    scholarshipRate: number
  }[] = []

  for (const row of attendeeRows || []) {
    const session = row.session as unknown as SessionData
    if (!session || (session.status !== 'submitted' && session.status !== 'approved')) continue
    if (invoicedIds.has(session.id) || itemizedIds.has(session.id)) continue

    unbilled.push({
      sessionId: session.id,
      clientId: row.client_id,
      clientName: clientMap.get(row.client_id) || 'Unknown',
      date: session.date,
      scholarshipRate: session.service_type?.scholarship_rate ?? 60,
    })
  }

  return unbilled
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const today = new Date()
    const dayOfMonth = today.getDate()

    // Get all organizations
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, name, settings')

    if (!organizations || organizations.length === 0) {
      return NextResponse.json({ message: 'No organizations found', processed: 0 })
    }

    let totalGenerated = 0
    const orgResults: { org: string; generated: number }[] = []

    for (const org of organizations) {
      const settings = org.settings as OrganizationSettings | undefined

      if (!settings?.automation?.auto_generate_scholarship_invoices) continue
      const scheduledDay = settings.automation.scholarship_invoice_day ?? 1
      if (dayOfMonth !== scheduledDay) continue

      const unbilled = await fetchOrgUnbilledScholarship(supabase, org.id)
      if (unbilled.length === 0) continue

      // Group by client + month
      const groups = new Map<string, typeof unbilled>()
      for (const s of unbilled) {
        const monthKey = s.date.slice(0, 7)
        const key = `${s.clientId}::${monthKey}`
        const existing = groups.get(key) || []
        existing.push(s)
        groups.set(key, existing)
      }

      let generated = 0

      for (const [key, sessions] of groups) {
        const [clientId, month] = key.split('::')

        // Check if already exists
        const { data: existing } = await supabase
          .from('invoices')
          .select('id')
          .eq('client_id', clientId)
          .eq('billing_period', month)
          .eq('invoice_type', 'batch')
          .eq('organization_id', org.id)
          .maybeSingle()

        if (existing) continue

        const totalAmount = sessions.reduce((sum, s) => sum + s.scholarshipRate, 0)

        const { data: invoice } = await supabase
          .from('invoices')
          .insert({
            client_id: clientId,
            amount: totalAmount,
            mca_cut: 0,
            contractor_pay: 0,
            rent_amount: 0,
            payment_method: 'scholarship',
            status: 'pending',
            invoice_type: 'batch',
            billing_period: month,
            organization_id: org.id,
          })
          .select('id')
          .single()

        if (invoice) {
          const items = sessions.map((s) => ({
            invoice_id: invoice.id,
            session_id: s.sessionId,
            amount: s.scholarshipRate,
            mca_cut: 0,
            contractor_pay: 0,
            rent_amount: 0,
          }))
          await supabase.from('invoice_items').insert(items)
          generated++
        }
      }

      totalGenerated += generated
      orgResults.push({ org: org.name, generated })
    }

    return NextResponse.json({
      message: 'Scholarship batch cron complete',
      day: dayOfMonth,
      totalGenerated,
      organizations: orgResults,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
