import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendTeamInviteEmail } from '@/lib/email'
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function calculateExpiryDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const organizationId = body?.organizationId
    const role = body?.role
    const invitedEmail = typeof body?.email === 'string' ? body.email.trim() : ''
    const expiresInDaysRaw = body?.expiresInDays
    const sendEmail = body?.sendEmail === true

    const expiresInDays =
      typeof expiresInDaysRaw === 'number' && Number.isFinite(expiresInDaysRaw)
        ? Math.min(Math.max(expiresInDaysRaw, 1), 90)
        : 14

    if (!organizationId || typeof organizationId !== 'string') {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    if (role !== 'owner' && role !== 'admin' && role !== 'contractor') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check permissions: developers/owners can create any invite, admins can only create contractor invites
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canManageTeam = can(profile.role as UserRole, 'team:manage')
    const canInvite = can(profile.role as UserRole, 'team:invite')

    // Team managers can create any invite, others with invite permission can only create contractor invites
    if (!canManageTeam && !(canInvite && role === 'contractor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Ensure org exists and get its name
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get inviter's name for the email
    const { data: inviterProfile } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single()
    const inviterName = inviterProfile?.name || 'Your administrator'

    const token = generateSecureToken()
    const expiresAt = calculateExpiryDate(expiresInDays)

    const service = createServiceClient()

    const { error: insertError } = await service
      .from('user_invites')
      .insert({
        token,
        organization_id: organizationId,
        role,
        invited_email: invitedEmail ? invitedEmail.toLowerCase() : null,
        expires_at: expiresAt,
        created_by: user.id,
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const inviteUrl = `${baseUrl}/signup?invite=${token}`

    // Send email if requested and email is provided
    let emailSent = false
    if (sendEmail && invitedEmail) {
      try {
        await sendTeamInviteEmail({
          to: invitedEmail,
          organizationName: org.name,
          role,
          inviteUrl,
          expiresAt,
          invitedBy: inviterName,
        })
        emailSent = true
      } catch (emailError) {
        console.error('[MCA] Failed to send invite email')
        // Don't fail the request if email fails - invite is still valid
      }
    }

    return NextResponse.json({
      inviteUrl,
      expiresAt,
      emailSent,
    })
  } catch (error) {
    console.error('[MCA] Error creating user invite')
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}

