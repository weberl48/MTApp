import { NextRequest, NextResponse } from 'next/server'
import { validateAccessToken } from '@/lib/portal/token'
import { createServiceClient } from '@/lib/supabase/service'
import { portalTokenSchema, sessionRequestSchema } from '@/lib/validation/schemas'

/**
 * GET /api/portal/session-requests
 *
 * Get all session requests for the authenticated client.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!portalTokenSchema.safeParse(token).success) {
      return NextResponse.json({ error: 'Token is required' }, { status: 401 })
    }

    const validation = await validateAccessToken(token!)
    if (!validation.valid || !validation.clientId) {
      return NextResponse.json(
        { error: validation.error || 'Invalid token' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    const { data: requests, error } = await supabase
      .from('session_requests')
      .select(`
        id,
        preferred_date,
        preferred_time,
        alternative_date,
        alternative_time,
        duration_minutes,
        notes,
        status,
        response_notes,
        responded_at,
        created_at,
        service_type:service_types(id, name),
        responded_by:users!session_requests_responded_by_fkey(id, name)
      `)
      .eq('client_id', validation.clientId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Transform data
    const transformedRequests = (requests || []).map((req) => ({
      ...req,
      service_type: Array.isArray(req.service_type) ? req.service_type[0] : req.service_type,
      responded_by: Array.isArray(req.responded_by) ? req.responded_by[0] : req.responded_by,
    }))

    return NextResponse.json({ requests: transformedRequests })
  } catch (error) {
    console.error('[MCA] Error fetching session requests')
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/portal/session-requests
 *
 * Create a new session request.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!portalTokenSchema.safeParse(token).success) {
      return NextResponse.json({ error: 'Token is required' }, { status: 401 })
    }

    const validation = await validateAccessToken(token!)
    if (!validation.valid || !validation.clientId || !validation.organizationId) {
      return NextResponse.json(
        { error: validation.error || 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = sessionRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    const {
      preferred_date,
      preferred_time,
      alternative_date,
      alternative_time,
      duration_minutes,
      service_type_id,
      notes,
    } = parsed.data

    const supabase = createServiceClient()

    // Check for existing pending requests (limit to 3)
    const { count } = await supabase
      .from('session_requests')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', validation.clientId)
      .eq('status', 'pending')

    if (count && count >= 3) {
      return NextResponse.json(
        { error: 'You have reached the maximum of 3 pending requests. Please wait for a response before submitting more.' },
        { status: 400 }
      )
    }

    // Create the request
    const { data: newRequest, error } = await supabase
      .from('session_requests')
      .insert({
        client_id: validation.clientId,
        organization_id: validation.organizationId,
        preferred_date,
        preferred_time: preferred_time || null,
        alternative_date: alternative_date || null,
        alternative_time: alternative_time || null,
        duration_minutes: duration_minutes || 30,
        service_type_id: service_type_id || null,
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // TODO: Send notification email to staff
    // await sendSessionRequestNotification(newRequest)

    return NextResponse.json({
      success: true,
      request: newRequest,
    })
  } catch (error) {
    console.error('[MCA] Error creating session request')
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}
