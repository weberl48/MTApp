import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPilotModeActive, getPilotRecipients } from '@/lib/email/pilot'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/pilot-status
 * Returns whether pilot-mode email redirect is active, and the (staff-only)
 * recipient list it's redirecting to. Auth-gated — the recipient list is
 * internal tester email addresses, not something to expose publicly.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isPilotModeActive()) {
    return NextResponse.json({ active: false, recipients: [] })
  }

  // Pilot mode is on. Even if the recipient list fails to parse, report
  // active:true with an empty list — a broken config is exactly when the
  // banner needs to show, so this route must never 500 here.
  try {
    return NextResponse.json({ active: true, recipients: getPilotRecipients() })
  } catch (error) {
    logger.error('[MCA] Failed to read pilot recipients', error)
    return NextResponse.json({ active: true, recipients: [] })
  }
}
