import { NextRequest, NextResponse } from 'next/server'
import { validateAccessToken } from '@/lib/portal/token'
import { createServiceClient } from '@/lib/supabase/service'
import { portalTokenSchema } from '@/lib/validation/schemas'

/**
 * GET /api/portal/goals
 *
 * Get all treatment goals for the authenticated client.
 */
export async function GET(request: NextRequest) {
  try {
    // Validate token
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!portalTokenSchema.safeParse(token).success) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 401 }
      )
    }

    const validation = await validateAccessToken(token!)
    if (!validation.valid || !validation.clientId) {
      return NextResponse.json(
        { error: validation.error || 'Invalid token' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // Get optional status filter
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active', 'met', 'not_met', or null for all

    let query = supabase
      .from('client_goals')
      .select('id, description, status, created_at, completed_at')
      .eq('client_id', validation.clientId)
      .order('created_at', { ascending: false })

    if (status && ['active', 'met', 'not_met'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: goals, error } = await query

    if (error) {
      throw error
    }

    // Calculate summary stats
    const allGoals = goals || []
    const summary = {
      total: allGoals.length,
      active: allGoals.filter((g) => g.status === 'active').length,
      met: allGoals.filter((g) => g.status === 'met').length,
      not_met: allGoals.filter((g) => g.status === 'not_met').length,
    }

    return NextResponse.json({
      goals: allGoals,
      summary,
    })
  } catch (error) {
    console.error('[MCA] Error fetching portal goals')
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}
