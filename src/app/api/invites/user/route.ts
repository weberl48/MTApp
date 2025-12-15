import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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

    // Developer-only
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Ensure org exists
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

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

    return NextResponse.json({
      inviteUrl,
      expiresAt,
    })
  } catch (error) {
    console.error('Error creating user invite:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}


