import { NextRequest, NextResponse } from 'next/server'
import { findClientByEmail, getOrCreateClientToken } from '@/lib/portal/token'
import { createServiceClient } from '@/lib/supabase/service'
import { sendMagicLinkEmail } from '@/lib/email'

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
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

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
      console.error('Failed to send magic link email:', emailError)
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
    console.error('Error requesting portal link:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
