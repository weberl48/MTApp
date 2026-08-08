import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * POST /api/errors/ — production sink for browser errors.
 *
 * The `app_errors` migration is explicit that a browser must never be able to
 * stuff rows into that table, which is why this route exists rather than an RLS
 * insert policy: it authenticates first, then writes with the service client.
 *
 * Requires a signed-in staff session. That is a deliberate limit — errors on the
 * unauthenticated client portal and the login page are NOT captured here,
 * because an anonymous ingest endpoint on a public URL is a spam sink and this
 * feed is only useful while it stays readable. The proxy's apiRateLimit covers
 * the authenticated case, and the client-side gate in ErrorReporter caps each
 * tab at 20 reports/minute before anything reaches the network.
 *
 * Only the PHI-safe { kind, message } shape is stored, matching what
 * logger.error writes. Stack traces are deliberately dropped: they carry
 * interpolated values from the frame that threw.
 */

const payloadSchema = z.object({
  kind: z.string().min(1).max(60),
  message: z.string().min(1).max(4000),
  url: z.string().max(2000).optional(),
})

export async function POST(request: Request) {
  let raw: unknown
  try {
    const text = await request.text()
    if (text.length > 64 * 1024) {
      return NextResponse.json({ ok: false }, { status: 413 })
    }
    raw = JSON.parse(text)
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON' }, { status: 400 })
  }

  const parsed = payloadSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  // Path only, never the query string — portal tokens and search terms live
  // there. The full URL is kept for bug reports, which are consented; this feed
  // is ambient and stays minimal.
  let path: string | null = null
  if (parsed.data.url) {
    try {
      path = new URL(parsed.data.url).pathname
    } catch {
      path = null
    }
  }

  try {
    const service = createServiceClient()
    await service.from('app_errors').insert({
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
      source: 'frontend',
      kind: parsed.data.kind.slice(0, 60),
      message: parsed.data.message.slice(0, 4000),
      path,
    })
  } catch {
    // Never surface a telemetry failure to the page, and never call
    // logger.error here — that would recurse straight back into this route.
  }

  return NextResponse.json({ ok: true })
}
