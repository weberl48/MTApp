import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSessionRequestStatusEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { uuidSchema } from '@/lib/validation/schemas'

/**
 * POST /api/session-requests/[id]/decline
 *
 * Decline a session request.
 * Staff only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params

    if (!uuidSchema.safeParse(requestId).success) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only staff can decline
    const allowedRoles = ['developer', 'owner', 'admin', 'contractor']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the request with client and organization info
    const { data: sessionRequest, error: fetchError } = await supabase
      .from('session_requests')
      .select('*, client:clients(id, name, contact_email), organization:organizations(id, name)')
      .eq('id', requestId)
      .single()

    if (fetchError || !sessionRequest) {
      logger.error('Session request not found')
      return NextResponse.json(
        { error: 'Request not found', details: fetchError?.message },
        { status: 404 }
      )
    }

    // Verify same organization
    if (sessionRequest.organization_id !== profile.organization_id && profile.role !== 'developer' && profile.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check status
    if (sessionRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { response_notes } = body

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('session_requests')
      .update({
        status: 'declined',
        response_notes: response_notes || null,
        responded_by: user.id,
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Send notification email to client
    const client = Array.isArray(sessionRequest.client) ? sessionRequest.client[0] : sessionRequest.client
    const organization = Array.isArray(sessionRequest.organization) ? sessionRequest.organization[0] : sessionRequest.organization

    if (client?.contact_email) {
      // Get client's portal token for the link
      const { data: tokenData } = await supabase
        .from('client_access_tokens')
        .select('token')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const envUrl = process.env.NEXT_PUBLIC_APP_URL
      if (!envUrl && process.env.NODE_ENV === 'production') {
        throw new Error('NEXT_PUBLIC_APP_URL is required in production')
      }
      const appUrl = envUrl || 'http://localhost:3000'
      const portalUrl = tokenData?.token
        ? `${appUrl}/portal/${tokenData.token}/sessions`
        : `${appUrl}/portal`

      try {
        await sendSessionRequestStatusEmail({
          to: client.contact_email,
          clientName: client.name || 'Client',
          organizationName: organization?.name || 'Your Practice',
          status: 'declined',
          preferredDate: sessionRequest.preferred_date,
          preferredTime: sessionRequest.preferred_time,
          responseNotes: response_notes,
          portalUrl,
        })
        logger.info('Session request decline email sent')
      } catch {
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to decline request' },
      { status: 500 }
    )
  }
}
