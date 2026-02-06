import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialize to avoid build-time errors
let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }
    supabaseAdmin = createClient(url, key)
  }
  return supabaseAdmin
}

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }

  return process.env.NODE_ENV !== 'production'
}

// Retention periods
const LOGIN_ATTEMPTS_DAYS = 90
const SESSION_REMINDERS_DAYS = 90
const AUDIT_LOGS_YEARS = 7

/**
 * GET /api/cron/cleanup
 *
 * Data retention cleanup. Deletes:
 * - login_attempts older than 90 days
 * - sent/failed session_reminders older than 90 days
 * - audit_logs older than 7 years (HIPAA requires 6-year minimum)
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getSupabaseAdmin()
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

    return NextResponse.json({
      message: 'Cleanup completed',
      ...results,
    })
  } catch {
    console.error('[MCA] Cleanup cron error')
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
