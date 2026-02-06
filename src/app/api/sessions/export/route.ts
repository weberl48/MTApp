import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptField, isEncrypted } from '@/lib/crypto'
import { format } from 'date-fns'
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'

// Types for Supabase join results
interface NameJoinResult {
  name: string
}

interface ClientJoinResult {
  id: string
  name: string
}

interface AttendeeJoinResult {
  client: ClientJoinResult | ClientJoinResult[] | null
}

interface SessionWithJoins {
  id: string
  date: string
  time: string | null
  duration_minutes: number
  status: string
  notes: string | null
  client_notes: string | null
  group_headcount: number | null
  group_member_names: string | null
  contractor: NameJoinResult | NameJoinResult[] | null
  service_type: NameJoinResult | NameJoinResult[] | null
  attendees: AttendeeJoinResult[] | null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isAdmin = can(userProfile.role as UserRole, 'session:view-all')
    const isContractor = userProfile.role === 'contractor'

    if (!isAdmin && !isContractor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const formatType = searchParams.get('format') || 'csv' // csv or json

    // Build query
    let query = supabase
      .from('sessions')
      .select(`
        id,
        date,
        time,
        duration_minutes,
        status,
        notes,
        client_notes,
        group_headcount,
        group_member_names,
        contractor:users(name),
        service_type:service_types(name),
        attendees:session_attendees(
          client:clients(id, name)
        )
      `)
      .eq('organization_id', userProfile.organization_id)
      .order('date', { ascending: false })

    // Contractors can only export their own sessions
    if (isContractor) {
      query = query.eq('contractor_id', user.id)
    }

    // Apply filters
    if (clientId) {
      // Get sessions where this client is an attendee
      const { data: attendeeSessions } = await supabase
        .from('session_attendees')
        .select('session_id')
        .eq('client_id', clientId)

      const sessionIds = attendeeSessions?.map(a => a.session_id) || []
      if (sessionIds.length === 0) {
        // No sessions for this client
        return NextResponse.json({ sessions: [] })
      }
      query = query.in('id', sessionIds)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('[MCA] Error fetching sessions')
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Decrypt notes and format data
    const typedSessions = sessions as SessionWithJoins[] | null
    const exportData = await Promise.all(
      (typedSessions || []).map(async (session) => {
        // Decrypt notes if encrypted
        let decryptedNotes = session.notes
        let decryptedClientNotes = session.client_notes

        if (session.notes && isEncrypted(session.notes)) {
          decryptedNotes = await decryptField(session.notes)
        }
        if (session.client_notes && isEncrypted(session.client_notes)) {
          decryptedClientNotes = await decryptField(session.client_notes)
        }

        // Extract nested data (handle Supabase join types)
        const contractor = session.contractor
        const contractorName = Array.isArray(contractor) ? contractor[0]?.name : contractor?.name

        const serviceType = session.service_type
        const serviceTypeName = Array.isArray(serviceType) ? serviceType[0]?.name : serviceType?.name

        const attendees = session.attendees
        const clientNames = attendees
          ?.map(a => {
            const client = Array.isArray(a.client) ? a.client[0] : a.client
            return client?.name
          })
          .filter(Boolean)
          .join(', ')

        return {
          date: session.date,
          time: session.time,
          duration: session.duration_minutes,
          status: session.status,
          serviceType: serviceTypeName || '',
          contractor: contractorName || '',
          clients: clientNames || '',
          groupHeadcount: session.group_headcount,
          groupMembers: session.group_member_names || '',
          notes: decryptedNotes || '',
          clientNotes: decryptedClientNotes || '',
        }
      })
    )

    if (formatType === 'json') {
      return NextResponse.json({ sessions: exportData })
    }

    // Generate CSV
    const headers = [
      'Date',
      'Time',
      'Duration (min)',
      'Status',
      'Service Type',
      'Contractor',
      'Clients',
      'Group Headcount',
      'Group Members',
      'Internal Notes',
      'Client Notes',
    ]

    const csvRows = [
      headers.join(','),
      ...exportData.map(row => [
        row.date,
        row.time || '',
        row.duration,
        row.status,
        `"${(row.serviceType || '').replace(/"/g, '""')}"`,
        `"${(row.contractor || '').replace(/"/g, '""')}"`,
        `"${(row.clients || '').replace(/"/g, '""')}"`,
        row.groupHeadcount || '',
        `"${(row.groupMembers || '').replace(/"/g, '""')}"`,
        `"${(row.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(row.clientNotes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      ].join(','))
    ]

    const csv = csvRows.join('\n')
    const filename = `sessions-export-${format(new Date(), 'yyyy-MM-dd')}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[MCA] Export error')
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
