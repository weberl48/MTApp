import { NextRequest, NextResponse } from 'next/server'
import { validateAccessToken } from '@/lib/portal/token'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * GET /api/portal/sessions
 *
 * Get all sessions for the authenticated client.
 * Returns session details with client_notes (not internal notes).
 */
export async function GET(request: NextRequest) {
  try {
    // Validate token
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 401 }
      )
    }

    const validation = await validateAccessToken(token)
    if (!validation.valid || !validation.clientId) {
      return NextResponse.json(
        { error: validation.error || 'Invalid token' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // Get all sessions where this client was an attendee
    // Only return approved sessions with client-facing notes
    const { data: attendances, error: attendanceError } = await supabase
      .from('session_attendees')
      .select('session_id')
      .eq('client_id', validation.clientId)

    if (attendanceError) {
      throw attendanceError
    }

    if (!attendances || attendances.length === 0) {
      return NextResponse.json({ sessions: [] })
    }

    const sessionIds = attendances.map((a) => a.session_id)

    // Fetch full session details
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        date,
        time,
        duration_minutes,
        client_notes,
        status,
        service_type:service_types(id, name, category),
        contractor:users(id, name)
      `)
      .in('id', sessionIds)
      .in('status', ['approved', 'submitted']) // Only show approved/submitted sessions
      .order('date', { ascending: false })

    if (sessionsError) {
      throw sessionsError
    }

    // Transform data - don't expose internal notes
    const transformedSessions = (sessions || []).map((session) => ({
      id: session.id,
      date: session.date,
      time: session.time,
      duration_minutes: session.duration_minutes,
      client_notes: session.client_notes,
      status: session.status,
      service_type: Array.isArray(session.service_type)
        ? session.service_type[0]
        : session.service_type,
      contractor: Array.isArray(session.contractor)
        ? session.contractor[0]
        : session.contractor,
    }))

    return NextResponse.json({ sessions: transformedSessions })
  } catch (error) {
    console.error('Error fetching portal sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
