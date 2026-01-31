import { NextResponse } from 'next/server'
import { isSquareConfigured, isSquareSandbox, getSquareEnvironment } from '@/lib/square/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/square/status
 * Returns the current Square integration status (sandbox/production, configured)
 */
export async function GET() {
  return NextResponse.json({
    configured: isSquareConfigured(),
    sandbox: isSquareSandbox(),
    environment: getSquareEnvironment(),
  })
}
