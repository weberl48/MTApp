import { NextResponse } from 'next/server'
import { isHealthDetailAuthorized } from '@/lib/health/detail-auth'
import { logger } from '@/lib/logger'

/**
 * POST /api/health/restore
 *
 * Attempts to restore a paused Supabase project via the Management API.
 * Requires SUPABASE_ACCESS_TOKEN env var (personal access token from Supabase dashboard).
 *
 * SECURITY: this spends a privileged, org-wide credential, so it is gated behind the
 * same CRON_SECRET bearer check as /api/health's detail payload. It used to be
 * completely unauthenticated, which let any anonymous caller invoke the Management
 * API as us (confused deputy) and read back the raw API response body.
 */
export async function POST(request: Request) {
  if (
    !isHealthDetailAuthorized(
      request.headers.get('authorization'),
      process.env.CRON_SECRET,
      process.env.NODE_ENV === 'production'
    )
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json(
      { error: 'SUPABASE_ACCESS_TOKEN not configured' },
      { status: 501 }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return NextResponse.json(
      { error: 'Supabase URL not configured' },
      { status: 501 }
    )
  }

  // Extract project ref from URL (e.g. "https://abcdef.supabase.co" -> "abcdef")
  const ref = new URL(supabaseUrl).hostname.split('.')[0]

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/restore`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (res.ok) {
      return NextResponse.json({ status: 'restoring', ref })
    }

    // Log the upstream detail server-side; never echo the Management API body to
    // the caller — it carries project/infrastructure detail.
    logger.error(`Supabase restore failed with status ${res.status}`)
    return NextResponse.json({ error: 'Restore request failed' }, { status: res.status })
  } catch {
    return NextResponse.json(
      { error: 'Failed to reach Supabase Management API' },
      { status: 502 }
    )
  }
}
