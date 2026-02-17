import type { SupabaseClient } from '@supabase/supabase-js'
import { parseLocalDate } from '@/lib/dates'

export interface UnbilledScholarshipSession {
  sessionId: string
  clientId: string
  clientName: string
  date: string
  durationMinutes: number
  serviceTypeName: string
  contractorName: string
}

export interface UnbilledGroup {
  clientId: string
  clientName: string
  month: string
  sessions: UnbilledScholarshipSession[]
}

/**
 * Fetch all scholarship sessions that haven't been invoiced yet.
 * Includes sessions for clients with payment_method='scholarship' AND
 * sessions using service types flagged as is_scholarship=true.
 * Works with both client-side and server-side Supabase clients.
 */
export async function fetchUnbilledScholarshipSessions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<UnbilledScholarshipSession[]> {
  // Get session IDs already in invoice_items (shared by both paths)
  const { data: itemRows } = await supabase
    .from('invoice_items')
    .select('session_id')

  const itemizedSessionIds = new Set((itemRows || []).map((r: { session_id: string }) => r.session_id))

  const unbilled: UnbilledScholarshipSession[] = []
  const seenSessionClient = new Set<string>() // avoid duplicates

  // --- Path 1: Client-based scholarship (payment_method = 'scholarship') ---
  const { data: scholarshipClients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('payment_method', 'scholarship')

  if (scholarshipClients && scholarshipClients.length > 0) {
    const clientIds = scholarshipClients.map((c: { id: string }) => c.id)
    const clientMap = new Map(scholarshipClients.map((c: { id: string; name: string }) => [c.id, c.name]))

    const { data: attendeeRows } = await supabase
      .from('session_attendees')
      .select(`
        client_id,
        session:sessions!inner(
          id, date, duration_minutes, status,
          contractor:users!sessions_contractor_id_fkey(name),
          service_type:service_types(name)
        )
      `)
      .in('client_id', clientIds)

    const { data: invoicedRows } = await supabase
      .from('invoices')
      .select('session_id')
      .in('client_id', clientIds)
      .not('session_id', 'is', null)

    const invoicedSessionIds = new Set((invoicedRows || []).map((r: { session_id: string }) => r.session_id))

    for (const row of attendeeRows || []) {
      const session = row.session as unknown as {
        id: string; date: string; duration_minutes: number; status: string
        contractor: { name: string } | null
        service_type: { name: string } | null
      }
      if (!session) continue
      if (session.status !== 'submitted' && session.status !== 'approved') continue
      if (invoicedSessionIds.has(session.id)) continue
      if (itemizedSessionIds.has(session.id)) continue

      const key = `${session.id}::${row.client_id}`
      if (seenSessionClient.has(key)) continue
      seenSessionClient.add(key)

      unbilled.push({
        sessionId: session.id,
        clientId: row.client_id,
        clientName: clientMap.get(row.client_id) || 'Unknown',
        date: session.date,
        durationMinutes: session.duration_minutes,
        serviceTypeName: session.service_type?.name || 'Unknown',
        contractorName: session.contractor?.name || 'Unknown',
      })
    }
  }

  // --- Path 2: Service-type-based scholarship (is_scholarship = true) ---
  const { data: scholarshipAttendeeRows } = await supabase
    .from('session_attendees')
    .select(`
      client_id,
      client:clients(id, name),
      session:sessions!inner(
        id, date, duration_minutes, status,
        contractor:users!sessions_contractor_id_fkey(name),
        service_type:service_types!inner(name, is_scholarship)
      )
    `)

  for (const row of scholarshipAttendeeRows || []) {
    const session = row.session as unknown as {
      id: string; date: string; duration_minutes: number; status: string
      contractor: { name: string } | null
      service_type: { name: string; is_scholarship: boolean } | null
    }
    if (!session) continue
    if (!session.service_type?.is_scholarship) continue
    if (session.status !== 'submitted' && session.status !== 'approved') continue
    if (itemizedSessionIds.has(session.id)) continue

    const client = row.client as unknown as { id: string; name: string } | null
    if (!client) continue

    const key = `${session.id}::${client.id}`
    if (seenSessionClient.has(key)) continue
    seenSessionClient.add(key)

    // Check for per-session invoices for this specific client+session
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('session_id', session.id)
      .eq('client_id', client.id)
      .maybeSingle()

    if (existingInvoice) continue

    unbilled.push({
      sessionId: session.id,
      clientId: client.id,
      clientName: client.name,
      date: session.date,
      durationMinutes: session.duration_minutes,
      serviceTypeName: session.service_type?.name || 'Unknown',
      contractorName: session.contractor?.name || 'Unknown',
    })
  }

  return unbilled
}

/**
 * Group unbilled scholarship sessions by client + month.
 * Sorted by most recent month first, then alphabetically by client name.
 */
export function groupUnbilledByClientMonth(sessions: UnbilledScholarshipSession[]): UnbilledGroup[] {
  const groups = new Map<string, UnbilledGroup>()

  for (const s of sessions) {
    const date = parseLocalDate(s.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const key = `${s.clientId}::${monthKey}`
    const existing = groups.get(key)
    if (existing) {
      existing.sessions.push(s)
    } else {
      groups.set(key, { clientId: s.clientId, clientName: s.clientName, month: monthKey, sessions: [s] })
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    const monthCmp = b.month.localeCompare(a.month)
    if (monthCmp !== 0) return monthCmp
    return a.clientName.localeCompare(b.clientName)
  })
}
