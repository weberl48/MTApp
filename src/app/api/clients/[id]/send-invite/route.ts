import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAccessToken } from '@/lib/portal/token'
import { sendMagicLinkEmail } from '@/lib/email'
import { isFeatureEnabled } from '@/lib/features'
import { uuidSchema } from '@/lib/validation/schemas'

/**
 * POST /api/clients/[id]/send-invite
 *
 * Generate a portal access token (if needed) and email it to the client.
 * Staff only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params

    if (!uuidSchema.safeParse(clientId).success) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user is authenticated and has permission
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // All staff can send invites
    const allowedRoles = ['developer', 'owner', 'admin', 'contractor']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if portal feature is enabled
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', profile.organization_id)
      .single()

    if (!isFeatureEnabled(org?.settings as Record<string, unknown>, 'client_portal')) {
      return NextResponse.json({ error: 'Client portal is not enabled' }, { status: 404 })
    }

    // Get client details
    const { data: client } = await supabase
      .from('clients')
      .select('id, organization_id, name, contact_email')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (client.organization_id !== profile.organization_id && profile.role !== 'developer' && profile.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if client has an email
    if (!client.contact_email) {
      return NextResponse.json(
        { error: 'Client does not have an email address on file' },
        { status: 400 }
      )
    }

    // Get organization details for email branding
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', client.organization_id)
      .single()

    const organizationName = organization?.name || 'Your Therapy Practice'

    // Always mint a fresh token for the invite.
    //
    // The "reuse the existing one" branch is gone because it cannot work any
    // more: tokens are stored hashed, so the raw value exists only at the moment
    // of creation. That is the point — a database read must not yield working
    // portal credentials. Re-sending an invite therefore issues a new link;
    // previously-issued links stay valid until they expire or are revoked.
    const tokenInfo = await generateAccessToken(
      clientId,
      user.id,
      client.organization_id,
      90 // 90 days expiry
    )
    const portalUrl = tokenInfo.portalUrl

    // Send the email
    await sendMagicLinkEmail({
      to: client.contact_email,
      clientName: client.name,
      organizationName,
      portalUrl,
    })

    return NextResponse.json({
      success: true,
      message: `Portal invite sent to ${client.contact_email}`,
    })
  } catch (error) {
    console.error('[MCA] Error sending portal invite')
    return NextResponse.json(
      { error: 'Failed to send portal invite' },
      { status: 500 }
    )
  }
}
