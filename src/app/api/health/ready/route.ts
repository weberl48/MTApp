import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Readiness probe - checks if the app is ready to serve traffic
 * Returns 503 if database is not accessible
 */
export async function GET() {
  try {
    const supabase = createServiceClient()
    const start = Date.now()
    const { error } = await supabase.from('organizations').select('id').limit(1)
    const latency = Date.now() - start

    if (error) {
      return NextResponse.json(
        { status: 'not_ready', reason: 'database_error', message: error.message },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      db_latency_ms: latency,
    })
  } catch (err) {
    return NextResponse.json(
      {
        status: 'not_ready',
        reason: 'connection_failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
