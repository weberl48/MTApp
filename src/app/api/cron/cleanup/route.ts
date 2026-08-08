import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyBearerSecret } from '@/lib/auth/bearer'
import { logger } from '@/lib/logger'

// Fail closed, in every environment. The previous form fell through to
// `NODE_ENV !== 'production'` when CRON_SECRET was unset, so on any non-Vercel
// runtime ANY Authorization header authorized this route — which deletes from
// login_attempts, session_reminders and audit_logs.
function verifyCronSecret(request: NextRequest): boolean {
  return verifyBearerSecret(request.headers.get('authorization'), process.env.CRON_SECRET)
}

// Retention periods
const LOGIN_ATTEMPTS_DAYS = 90
const SESSION_REMINDERS_DAYS = 90
const AUDIT_LOGS_YEARS = 7
const BUG_SCREENSHOT_DAYS = 90

/**
 * GET /api/cron/cleanup
 *
 * Data retention cleanup. Deletes:
 * - login_attempts older than 90 days
 * - sent/failed session_reminders older than 90 days
 * - audit_logs older than 7 years (HIPAA requires 6-year minimum)
 * - bug report screenshots older than 90 days, and reports older than 1 year
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createServiceClient()
    const results: Record<string, number> = {}

    // 1. Clean login_attempts older than 90 days
    const loginCutoff = new Date(
      Date.now() - LOGIN_ATTEMPTS_DAYS * 24 * 60 * 60 * 1000
    ).toISOString()
    const { count: loginCount } = await db
      .from('login_attempts')
      .delete({ count: 'exact' })
      .lt('attempted_at', loginCutoff)
    results.login_attempts_deleted = loginCount ?? 0

    // 2. Clean sent/failed session_reminders older than 90 days
    const reminderCutoff = new Date(
      Date.now() - SESSION_REMINDERS_DAYS * 24 * 60 * 60 * 1000
    ).toISOString()
    const { count: reminderCount } = await db
      .from('session_reminders')
      .delete({ count: 'exact' })
      .in('status', ['sent', 'failed'])
      .lt('created_at', reminderCutoff)
    results.session_reminders_deleted = reminderCount ?? 0

    // 3. Clean audit_logs older than 7 years
    const auditCutoff = new Date()
    auditCutoff.setFullYear(auditCutoff.getFullYear() - AUDIT_LOGS_YEARS)
    const { count: auditCount } = await db
      .from('audit_logs')
      .delete({ count: 'exact' })
      .lt('created_at', auditCutoff.toISOString())
    results.audit_logs_deleted = auditCount ?? 0

    // 4. Bug report retention.
    //
    // Screenshots are the PHI-densest thing this app stores outside the
    // database, so they expire well before the report does.
    //
    // THE ORDER AND THE ERROR CHECK ARE BOTH LOAD-BEARING. A screenshot is only
    // reachable through its `screenshot_path`, so nulling that pointer for a
    // file that did NOT actually delete strands client PHI in the bucket
    // permanently, with nothing left pointing at it. So: delete first, then null
    // ONLY what storage confirms it removed, and report the failures rather than
    // the attempts. An earlier version ignored the delete result and reported
    // `paths.length` as the deleted count — a retention job that reports success
    // while silently keeping PHI is worse than one that fails loudly.
    const screenshotCutoff = new Date(
      Date.now() - BUG_SCREENSHOT_DAYS * 24 * 60 * 60 * 1000
    ).toISOString()
    const { data: expiring } = await db
      .from('bug_reports')
      .select('screenshot_path')
      .not('screenshot_path', 'is', null)
      .lt('created_at', screenshotCutoff)

    const paths = (expiring ?? [])
      .map((r: { screenshot_path: string | null }) => r.screenshot_path)
      .filter((p: string | null): p is string => Boolean(p))

    let removedPaths: string[] = []
    if (paths.length > 0) {
      const { data: removed, error: removeError } = await db.storage
        .from('bug-screenshots')
        .remove(paths)

      removedPaths = (removed ?? [])
        .map((o: { name?: string }) => o.name)
        .filter((n: string | undefined): n is string => Boolean(n))

      if (removeError) {
        logger.error('Bug screenshot deletion failed during cleanup', removeError)
      }

      // Only the confirmed-deleted lose their pointer. A path that failed keeps
      // it, so the next run retries instead of orphaning the file.
      if (removedPaths.length > 0) {
        await db
          .from('bug_reports')
          .update({ screenshot_path: null })
          .in('screenshot_path', removedPaths)
      }
    }

    results.bug_screenshots_deleted = removedPaths.length
    results.bug_screenshots_failed = paths.length - removedPaths.length

    // Drops reports past a year. Deliberately refuses any row that still has a
    // screenshot_path — deleting it would strand the file (see above).
    await db.rpc('prune_bug_reports')

    return NextResponse.json({
      message: 'Cleanup completed',
      ...results,
    })
  } catch {
    console.error('[MCA] Cleanup cron error')
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
