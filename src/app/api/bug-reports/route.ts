import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyBearerSecret } from '@/lib/auth/bearer'
import { decryptField, isEncrypted } from '@/lib/crypto'
import { logger } from '@/lib/logger'

/**
 * GET /api/bug-reports/ — the dev portal's read path.
 *
 * WHY THIS EXISTS RATHER THAN A MANAGEMENT API QUERY
 * The portal reads `app_errors` straight from Supabase over the Management API,
 * which works because those rows are plaintext. Bug reports are not:
 * `description` is encrypted, and the screenshot needs a signed URL. Doing that
 * in the portal would mean a second copy of the crypto and a second place
 * holding ENCRYPTION_KEY — two things to keep in sync and one more place to leak
 * a key from. The app already has both, so the portal asks the app.
 *
 * Auth is the CRON_SECRET bearer, exactly as /api/health gates its detail
 * payload, using the same constant-time comparison. Fails closed: no secret
 * configured means nobody is authorized.
 */

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const SIGNED_URL_TTL_SECONDS = 600

export async function GET(request: Request) {
  if (!verifyBearerSecret(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const requested = Number(url.searchParams.get('limit'))
  const limit = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, MAX_LIMIT)
    : DEFAULT_LIMIT

  try {
    const service = createServiceClient()
    const { data, error } = await service
      .from('bug_reports')
      .select(
        'id, created_at, user_role, environment, description, route_pattern, url, user_agent, viewport, app_commit, recent_errors, screenshot_path, github_issue_number, github_issue_url, users(name, email)'
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    const reports = await Promise.all(
      (data ?? []).map(async (row) => {
        // Tolerate legacy/plaintext rows the way the portal decrypt paths do —
        // a row that fails to decrypt should still be readable as a report.
        let description = row.description as string
        try {
          if (isEncrypted(description)) description = await decryptField(description)
        } catch {
          description = '[could not decrypt — check ENCRYPTION_KEY]'
        }

        let screenshotUrl: string | null = null
        if (row.screenshot_path) {
          const { data: signed } = await service.storage
            .from('bug-screenshots')
            .createSignedUrl(row.screenshot_path as string, SIGNED_URL_TTL_SECONDS)
          screenshotUrl = signed?.signedUrl ?? null
        }

        const reporter = row.users as { name?: string; email?: string } | null

        return {
          id: row.id,
          createdAt: row.created_at,
          reporter: reporter?.name || reporter?.email || null,
          role: row.user_role,
          environment: row.environment,
          description,
          routePattern: row.route_pattern,
          url: row.url,
          userAgent: row.user_agent,
          viewport: row.viewport,
          appCommit: row.app_commit,
          recentErrors: row.recent_errors ?? [],
          screenshotUrl,
          issueNumber: row.github_issue_number,
          issueUrl: row.github_issue_url,
        }
      })
    )

    return NextResponse.json({ reports })
  } catch (error) {
    logger.error('Failed to list bug reports', error)
    return NextResponse.json({ error: 'Failed to load bug reports' }, { status: 500 })
  }
}
