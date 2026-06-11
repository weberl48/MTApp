import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isHealthDetailAuthorized } from '@/lib/health/detail-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database: CheckResult
    auth: CheckResult
    encryption: CheckResult
    square: CheckResult
    email: CheckResult
  }
}

interface CheckResult {
  status: 'pass' | 'fail' | 'warn'
  message: string
  latency?: number
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('organizations').select('id').limit(1)
    const latency = Date.now() - start

    if (error) {
      return { status: 'fail', message: `Database error: ${error.message}`, latency }
    }
    return { status: 'pass', message: 'Connected', latency }
  } catch (err) {
    return { status: 'fail', message: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

async function checkAuth(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = createServiceClient()
    // Try to access auth admin API to verify service role works
    const { error } = await supabase.auth.admin.listUsers({ perPage: 1 })
    const latency = Date.now() - start

    if (error) {
      return { status: 'fail', message: `Auth error: ${error.message}`, latency }
    }
    return { status: 'pass', message: 'Auth service available', latency }
  } catch (err) {
    return { status: 'fail', message: `Auth check failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

function checkEncryption(): CheckResult {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    return { status: 'warn', message: 'ENCRYPTION_KEY not set - PHI stored unencrypted' }
  }
  if (key.length !== 64) {
    return { status: 'fail', message: 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)' }
  }
  if (!/^[0-9a-fA-F]+$/.test(key)) {
    return { status: 'fail', message: 'ENCRYPTION_KEY must be valid hex' }
  }
  return { status: 'pass', message: 'Encryption configured' }
}

function checkSquare(): CheckResult {
  const token = process.env.SQUARE_ACCESS_TOKEN
  const env = process.env.SQUARE_ENVIRONMENT

  if (!token) {
    return { status: 'warn', message: 'SQUARE_ACCESS_TOKEN not set - payments disabled' }
  }
  if (!env) {
    return { status: 'warn', message: 'SQUARE_ENVIRONMENT not set - defaulting to sandbox' }
  }
  return { status: 'pass', message: `Square configured (${env})` }
}

function checkEmail(): CheckResult {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    return { status: 'warn', message: 'RESEND_API_KEY not set - emails disabled' }
  }
  return { status: 'pass', message: 'Email configured' }
}

function determineOverallStatus(checks: HealthCheck['checks']): HealthCheck['status'] {
  const results = Object.values(checks)

  // If database or auth fails, system is unhealthy
  if (checks.database.status === 'fail' || checks.auth.status === 'fail') {
    return 'unhealthy'
  }

  // If any check fails, system is degraded
  if (results.some(r => r.status === 'fail')) {
    return 'degraded'
  }

  // If any warnings, system is degraded
  if (results.some(r => r.status === 'warn')) {
    return 'degraded'
  }

  return 'healthy'
}

export async function GET(request: Request) {
  const [database, auth] = await Promise.all([
    checkDatabase(),
    checkAuth(),
  ])

  const checks = {
    database,
    auth,
    encryption: checkEncryption(),
    square: checkSquare(),
    email: checkEmail(),
  }

  const status = determineOverallStatus(checks)
  const statusCode = status === 'unhealthy' ? 503 : 200

  // Only expose per-check detail (version, integration config, error messages) to authorized
  // callers — otherwise it's an info-disclosure vector. Anonymous callers still get the overall
  // status + HTTP code, which is all a monitor needs.
  const authorized = isHealthDetailAuthorized(
    request.headers.get('authorization'),
    process.env.CRON_SECRET,
    process.env.NODE_ENV === 'production'
  )

  if (!authorized) {
    return NextResponse.json({ status, timestamp: new Date().toISOString() }, { status: statusCode })
  }

  const health: HealthCheck = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    checks,
  }

  return NextResponse.json(health, { status: statusCode })
}
