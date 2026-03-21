import { NextResponse } from 'next/server'

/**
 * POST /api/health/restore
 *
 * Attempts to restore a paused Supabase project via the Management API.
 * Requires SUPABASE_ACCESS_TOKEN env var (personal access token from Supabase dashboard).
 */
export async function POST() {
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

    const body = await res.text()
    return NextResponse.json(
      { error: 'Restore request failed', detail: body },
      { status: res.status }
    )
  } catch {
    return NextResponse.json(
      { error: 'Failed to reach Supabase Management API' },
      { status: 502 }
    )
  }
}
