import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSessionRequestStatusEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { uuidSchema } from '@/lib/validation/schemas'
import { createNewSession } from '@/lib/session-form/create-session'
import { calculateSessionPricing, type ContractorPricingOverrides } from '@/lib/pricing'
import type { ServiceType, OrganizationSettings, PaymentMethod } from '@/types/database'

/**
 * POST /api/session-requests/[id]/approve
 *
 * Approve a session request and optionally create the session.
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

    // Only staff can approve
    const allowedRoles = ['developer', 'owner', 'admin', 'contractor']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the request with client and organization info
    const { data: sessionRequest, error: fetchError } = await supabase
      .from('session_requests')
      .select('*, client:clients(id, name, contact_email, payment_method), organization:organizations(id, name)')
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
    const {
      response_notes,
      create_session,
      session_date,
      session_time,
      service_type_id,
      contractor_id,
    } = body

    let createdSessionId = null

    // Optionally create the session
    if (create_session) {
      if (!session_date || !service_type_id || !contractor_id) {
        return NextResponse.json(
          { error: 'Session date, service type, and contractor are required to create a session' },
          { status: 400 }
        )
      }

      // Fetch the full service type so we can price the session properly
      const { data: serviceType } = await supabase
        .from('service_types')
        .select('*')
        .eq('id', service_type_id)
        .single()

      if (!serviceType) {
        return NextResponse.json({ error: 'Service type not found' }, { status: 400 })
      }

      const client = Array.isArray(sessionRequest.client) ? sessionRequest.client[0] : sessionRequest.client

      // Contractor's custom rate (if any), so their pay matches their negotiated rate
      let overrides: ContractorPricingOverrides | undefined
      const { data: rate } = await supabase
        .from('contractor_rates')
        .select('contractor_pay, duration_increment')
        .eq('contractor_id', contractor_id)
        .eq('service_type_id', service_type_id)
        .maybeSingle()
      if (rate) {
        overrides = { customContractorPay: rate.contractor_pay, durationIncrement: rate.duration_increment }
      }

      const durationMinutes = sessionRequest.duration_minutes || 30
      const pricing = calculateSessionPricing(
        serviceType as ServiceType,
        1,
        durationMinutes,
        overrides,
        { paymentMethod: client?.payment_method as PaymentMethod | undefined }
      )

      // Org invoice due-days for the generated invoice
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', sessionRequest.organization_id)
        .single()
      const dueDays = (org?.settings as OrganizationSettings | undefined)?.invoice?.due_days

      // Reuse the shared creation path: prices the session, inserts attendees (rolling back the
      // session if that fails), and generates the invoice — the old inline insert did none of these.
      const result = await createNewSession({
        supabase,
        date: session_date,
        time: session_time ? String(session_time).slice(0, 5) : '09:00',
        durationMinutes,
        serviceTypeId: service_type_id,
        contractorId: contractor_id,
        organizationId: sessionRequest.organization_id,
        clientIds: [sessionRequest.client_id],
        encryptedNotes: null,
        encryptedClientNotes: null,
        status: 'approved',
        groupHeadcount: null,
        groupMemberNames: null,
        classroom: null,
        pricing,
        isScholarshipService: serviceType.is_scholarship ?? false,
        dueDays,
      })

      createdSessionId = result.sessionId
    }

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('session_requests')
      .update({
        status: 'approved',
        response_notes: response_notes || null,
        responded_by: user.id,
        responded_at: new Date().toISOString(),
        created_session_id: createdSessionId,
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
          status: 'approved',
          preferredDate: sessionRequest.preferred_date,
          preferredTime: sessionRequest.preferred_time,
          responseNotes: response_notes,
          portalUrl,
        })
        logger.info('Session request approval email sent')
      } catch {
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      created_session_id: createdSessionId,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to approve request' },
      { status: 500 }
    )
  }
}
