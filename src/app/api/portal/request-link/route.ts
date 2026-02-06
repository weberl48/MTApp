import { NextRequest, NextResponse } from 'next/server'
import { findClientByEmail, getOrCreateClientToken } from '@/lib/portal/token'
import { createServiceClient } from '@/lib/supabase/service'
import { sendMagicLinkEmail } from '@/lib/email'
import { portalRequestLinkSchema } from '@/lib/validation/schemas'
import { isFeatureEnabled } from '@/lib/features'

/**
 * POST /api/portal/request-link
 *
 * Request a magic link to access the client portal.
 * Client enters their email, and if they have an active portal access,
 * we send them a link to access it.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = portalRequestLinkSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = parsed.data.email

    // Find client by email
    const clientInfo = await findClientByEmail(normalizedEmail)

    if (!clientInfo) {
      // Don't reveal whether the email exists for security
      // Just return success message either way
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a portal link will be sent.',
      })
    }

    // Check if portal feature is enabled for this organization
    const supabaseCheck = createServiceClient()
    const { data: orgCheck } = await supabaseCheck
      .from('organizations')
      .select('settings')
      .eq('id', clientInfo.organizationId)
      .single()

    if (!isFeatureEnabled(orgCheck?.settings as Record<string, unknown>, 'client_portal')) {
      // Don't reveal that portal is disabled — same generic message
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a portal link will be sent.',
      })
    }

    // Get or create a token for this client
    const tokenInfo = await getOrCreateClientToken(
      clientInfo.clientId,
      clientInfo.organizationId
    )

    // Get client and organization details for the email
    const supabase = createServiceClient()

    const [clientResult, orgResult] = await Promise.all([
      supabase
        .from('clients')
        .select('name')
        .eq('id', clientInfo.clientId)
        .single(),
      supabase
        .from('organizations')
        .select('name, email')
        .eq('id', clientInfo.organizationId)
        .single(),
    ])

    const clientName = clientResult.data?.name || 'Client'
    const orgName = orgResult.data?.name || 'Your Practice'

    // Send the magic link email
    try {
      await sendMagicLinkEmail({
        to: normalizedEmail,
        clientName,
        organizationName: orgName,
        portalUrl: tokenInfo.portalUrl,
      })
      // Sanitize email before logging to prevent log injection
      const safeEmail = normalizedEmail.replace(/[\r\n]/g, '')
      console.log(`[Portal Magic Link] Email sent to ${safeEmail}`)
    } catch (emailError) {
      console.error('[MCA] Failed to send magic link email')
      // In development, still return the URL for testing
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Email failed but here is the link (dev mode)',
          portalUrl: tokenInfo.portalUrl,
          expiresAt: tokenInfo.expiresAt,
        })
      }
      // In production, we still don't reveal if email exists
    }

    // In development, also return the URL for easy testing
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        message: 'Portal link sent! (dev mode - URL included)',
        portalUrl: tokenInfo.portalUrl,
        expiresAt: tokenInfo.expiresAt,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a portal link will be sent.',
    })
  } catch (error) {
    console.error('[MCA] Error requesting portal link')
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
