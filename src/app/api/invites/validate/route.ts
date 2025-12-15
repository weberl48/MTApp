import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('user_invites')
      .select('organization_id, role, invited_email, expires_at, used_at')
      .eq('token', token)
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false }, { status: 404 })
    }

    const expired = new Date(data.expires_at) < new Date()
    const used = Boolean(data.used_at)

    if (expired || used) {
      return NextResponse.json({ valid: false }, { status: 410 })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', data.organization_id)
      .single()

    return NextResponse.json({
      valid: true,
      organizationId: data.organization_id,
      organizationName: org?.name ?? 'Your Practice',
      role: data.role,
      invitedEmail: data.invited_email,
      expiresAt: data.expires_at,
    })
  } catch (error) {
    console.error('Error validating invite:', error)
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}


