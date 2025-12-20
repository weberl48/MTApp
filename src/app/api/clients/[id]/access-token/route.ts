import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateAccessToken,
  getClientTokens,
  revokeAccessToken,
  revokeAllClientTokens,
} from '@/lib/portal/token'

/**
 * GET /api/clients/[id]/access-token
 *
 * Get all active access tokens for a client.
 * Staff only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const supabase = await createClient()

    // Verify user is authenticated and has permission
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // All staff can view tokens
    const allowedRoles = ['developer', 'owner', 'admin', 'contractor']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify client belongs to the same organization
    const { data: client } = await supabase
      .from('clients')
      .select('id, organization_id')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (client.organization_id !== profile.organization_id && profile.role !== 'developer' && profile.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get active tokens
    const tokens = await getClientTokens(clientId)

    return NextResponse.json({ tokens })
  } catch (error) {
    console.error('Error fetching client tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/clients/[id]/access-token
 *
 * Generate a new access token for a client.
 * Staff only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
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

    // All staff can create tokens
    const allowedRoles = ['developer', 'owner', 'admin', 'contractor']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify client belongs to the same organization
    const { data: client } = await supabase
      .from('clients')
      .select('id, organization_id, name')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (client.organization_id !== profile.organization_id && profile.role !== 'developer' && profile.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get optional expiry days from body
    const body = await request.json().catch(() => ({}))
    const expiryDays = body.expiryDays || 90

    // Generate new token
    const tokenInfo = await generateAccessToken(
      clientId,
      user.id,
      client.organization_id,
      expiryDays
    )

    return NextResponse.json({
      success: true,
      token: tokenInfo.token,
      portalUrl: tokenInfo.portalUrl,
      expiresAt: tokenInfo.expiresAt,
      clientName: client.name,
    })
  } catch (error) {
    console.error('Error generating client token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/clients/[id]/access-token
 *
 * Revoke access tokens for a client.
 * Staff only.
 *
 * Body: { tokenId: string } to revoke specific token
 *       { all: true } to revoke all tokens
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
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

    // Only admins+ can revoke tokens
    const allowedRoles = ['developer', 'owner', 'admin']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify client belongs to the same organization
    const { data: client } = await supabase
      .from('clients')
      .select('id, organization_id')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (client.organization_id !== profile.organization_id && profile.role !== 'developer' && profile.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))

    if (body.all === true) {
      // Revoke all tokens
      await revokeAllClientTokens(clientId)
      return NextResponse.json({
        success: true,
        message: 'All tokens revoked',
      })
    } else if (body.tokenId) {
      // Revoke specific token
      await revokeAccessToken(body.tokenId)
      return NextResponse.json({
        success: true,
        message: 'Token revoked',
      })
    } else {
      return NextResponse.json(
        { error: 'Must specify tokenId or all: true' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error revoking client token:', error)
    return NextResponse.json(
      { error: 'Failed to revoke token' },
      { status: 500 }
    )
  }
}
