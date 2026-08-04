import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateAccessToken,
  getClientTokens,
  revokeAccessToken,
  revokeAllClientTokens,
} from '@/lib/portal/token'
import { isFeatureEnabled } from '@/lib/features'
import { uuidSchema } from '@/lib/validation/schemas'
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'

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

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Managing portal access (view/create/revoke) is admin+ (`client:manage`).
    // A contractor could otherwise mint a 90-day portal token for ANY client in
    // the org (every member can read all client rows) and then read that client's
    // portal PHI — including client_notes for sessions run by other contractors,
    // via the service-client portal endpoints that bypass the sessions RLS.
    if (!can(profile.role as UserRole, 'client:manage')) {
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
    console.error('[MCA] Error fetching client tokens')
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

    // Admin+ only (`client:manage`) — minting a portal token is a privileged
    // action; see the GET handler for the contractor-escalation rationale.
    if (!can(profile.role as UserRole, 'client:manage')) {
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

    // Get optional expiry days from body — clamp to a sane range (same rule as
    // /api/invites/user): junk input previously threw an opaque 500, and a huge
    // number minted an effectively-permanent token.
    const body = await request.json().catch(() => ({}))
    const parsedExpiry = Number(body.expiryDays)
    const expiryDays = Number.isFinite(parsedExpiry)
      ? Math.min(365, Math.max(1, Math.trunc(parsedExpiry)))
      : 90

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
    console.error('[MCA] Error generating client token')
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

    // Admin+ only (`client:manage`) — same gate as view/create above.
    if (!can(profile.role as UserRole, 'client:manage')) {
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
      // Revoke specific token — scoped to the path client so a token id from
      // another client/org can't be revoked through this authorization check.
      await revokeAccessToken(body.tokenId, clientId)
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
    console.error('[MCA] Error revoking client token')
    return NextResponse.json(
      { error: 'Failed to revoke token' },
      { status: 500 }
    )
  }
}
