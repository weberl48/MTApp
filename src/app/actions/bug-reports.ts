'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { encryptField } from '@/lib/crypto'
import { toRoutePattern } from '@/lib/bug-reports/route-pattern'
import { fileBugIssue } from '@/lib/bug-reports/github-issue'
import { logger } from '@/lib/logger'

/**
 * Accept a user-filed bug report.
 *
 * This is a server action rather than an API route for one reason: the
 * description is PHI (users name clients when they describe a bug) and
 * ENCRYPTION_KEY is server-only, so the browser can never write this row
 * itself — the same rule the client add/edit dialog follows.
 *
 * Ordering matters. The row is written FIRST and the GitHub issue filed
 * afterwards, so a GitHub outage costs you an issue, never the user's words.
 */

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024

const inputSchema = z.object({
  description: z.string().trim().min(10, 'Please describe what went wrong.').max(8000),
  url: z.string().max(2000).optional(),
  viewport: z.string().max(20).optional(),
  recentErrors: z
    .array(z.object({ kind: z.string().max(60), message: z.string().max(500), at: z.string().max(40) }))
    .max(20)
    .optional(),
})

export interface SubmitBugReportResult {
  success: boolean
  error?: string
  reportId?: number
  issueUrl?: string | null
}

export async function submitBugReport(formData: FormData): Promise<SubmitBugReportResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) return { success: false, error: 'User profile not found' }

  let parsedErrors: { kind: string; message: string; at: string }[] = []
  const rawErrors = formData.get('recentErrors')
  if (typeof rawErrors === 'string' && rawErrors) {
    try {
      parsedErrors = JSON.parse(rawErrors)
    } catch {
      parsedErrors = []
    }
  }

  const parsed = inputSchema.safeParse({
    description: formData.get('description'),
    url: formData.get('url') || undefined,
    viewport: formData.get('viewport') || undefined,
    recentErrors: parsedErrors,
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid report' }
  }

  const service = createServiceClient()

  // --- Screenshot (optional) ------------------------------------------------
  // Uploaded before the row so a rejected file fails the whole submit loudly
  // rather than leaving a report that claims a screenshot it does not have.
  let screenshotPath: string | null = null
  const file = formData.get('screenshot')
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return { success: false, error: 'Screenshot must be a PNG, JPEG or WebP image.' }
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      return { success: false, error: 'Screenshot must be smaller than 5MB.' }
    }

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${profile.organization_id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await service.storage
      .from('bug-screenshots')
      .upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      logger.error('Bug report screenshot upload failed', uploadError)
      return { success: false, error: 'Could not upload the screenshot. Try again without it.' }
    }
    screenshotPath = path
  }

  // --- The row --------------------------------------------------------------
  const { data: row, error: insertError } = await service
    .from('bug_reports')
    .insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      user_role: profile.role,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
      description: await encryptField(parsed.data.description),
      route_pattern: toRoutePattern(parsed.data.url ?? null),
      url: parsed.data.url ?? null,
      user_agent: (formData.get('userAgent') as string | null)?.slice(0, 500) ?? null,
      viewport: parsed.data.viewport ?? null,
      app_commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      recent_errors: parsed.data.recentErrors ?? [],
      screenshot_path: screenshotPath,
    })
    .select('id, created_at, user_role, environment, route_pattern, app_commit, user_agent, viewport')
    .single()

  if (insertError || !row) {
    // Don't leave an orphaned screenshot behind.
    if (screenshotPath) await service.storage.from('bug-screenshots').remove([screenshotPath])
    logger.error('Bug report insert failed', insertError)
    return { success: false, error: 'Could not save your report. Please try again.' }
  }

  // --- GitHub issue (best effort) -------------------------------------------
  // Kinds and counts only. Messages stay in Supabase — see github-issue.ts.
  const kindCounts = new Map<string, number>()
  for (const e of parsed.data.recentErrors ?? []) {
    kindCounts.set(e.kind, (kindCounts.get(e.kind) ?? 0) + 1)
  }

  const issue = await fileBugIssue({
    id: row.id,
    routePattern: row.route_pattern,
    userRole: row.user_role,
    environment: row.environment,
    appCommit: row.app_commit,
    userAgent: row.user_agent,
    viewport: row.viewport,
    createdAt: row.created_at,
    hasScreenshot: Boolean(screenshotPath),
    recentErrors: [...kindCounts].map(([kind, count]) => ({ kind, count })),
  })

  if (issue) {
    await service
      .from('bug_reports')
      .update({ github_issue_number: issue.number, github_issue_url: issue.url })
      .eq('id', row.id)
  }

  return { success: true, reportId: row.id, issueUrl: issue?.url ?? null }
}
