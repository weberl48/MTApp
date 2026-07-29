import { NextResponse } from 'next/server'

/**
 * Dev-only relay: the browser can't reach the dev portal's port directly
 * (CSP connect-src), so DevErrorReporter posts here and we forward
 * server-side. Hard 404 in production — this surface does not exist there.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 })
  }

  let body: string
  try {
    body = await request.text()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (body.length > 64 * 1024) {
    return NextResponse.json({ ok: false }, { status: 413 })
  }

  // Only forward real reports — keeps endpoint-sweep probes and other junk
  // out of the portal's error feed.
  try {
    const parsed = JSON.parse(body) as { message?: unknown }
    if (typeof parsed.message !== 'string' || parsed.message.length === 0) {
      return NextResponse.json({ ok: false, error: 'message required' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON' }, { status: 400 })
  }

  const portalUrl = process.env.DEV_PORTAL_URL || 'http://localhost:4321'
  await fetch(`${portalUrl}/api/errors`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    signal: AbortSignal.timeout(2000),
  }).catch(() => {
    // Portal not running — drop the report.
  })

  return NextResponse.json({ ok: true })
}
