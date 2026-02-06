import { NextRequest, NextResponse } from 'next/server'
import { validateAccessToken } from '@/lib/portal/token'

/**
 * POST /api/portal/validate
 *
 * Validate a portal access token and return client/organization info.
 * Used by the portal frontend to verify access and load initial data.
 */
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or body
    const authHeader = request.headers.get('Authorization')
    let token = authHeader?.replace('Bearer ', '')

    if (!token) {
      const body = await request.json().catch(() => ({}))
      token = body.token
    }

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 401 }
      )
    }

    const result = await validateAccessToken(token)

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      client: result.client,
      organization: result.organization,
    })
  } catch (error) {
    console.error('[MCA] Error validating token')
    return NextResponse.json(
      { valid: false, error: 'Failed to validate token' },
      { status: 500 }
    )
  }
}
