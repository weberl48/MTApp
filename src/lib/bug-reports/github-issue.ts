/**
 * Auto-filed GitHub issues for bug reports.
 *
 * THE ISSUE IS A POINTER, NOT A COPY.
 * A user describing a bug will name a client — "the invoice for <name> won't
 * send" is how people actually write these — and a screenshot of the sessions
 * list is a client roster. GitHub is not a BAA'd subprocessor here, so neither
 * may leave Supabase. The issue therefore carries only generated fields and a
 * link back to the dev portal, where the real content is read.
 *
 * That guarantee is structural rather than a redaction pass: `IssueFacts` has no
 * field capable of holding user free text, so there is nothing to strip and no
 * regex to get wrong. If you are tempted to add `description` here, the answer
 * is no — put it behind the portal link.
 */

/** Everything the issue is allowed to know. Note what is absent: the
 *  description, the raw URL, the client id, the screenshot itself. */
export interface IssueFacts {
  id: number
  routePattern: string | null
  userRole: string | null
  environment: string
  appCommit: string | null
  userAgent: string | null
  viewport: string | null
  createdAt: string
  hasScreenshot: boolean
  /**
   * Error KINDS and counts only — never messages.
   *
   * A kind is `error.name` ('TypeError') or the capture channel
   * ('console.error'), both machine-generated and incapable of holding app
   * data. Messages are a different matter: `console.error('Failed to save ' +
   * clientName)` is ordinary code, and that string would be a client name in a
   * GitHub issue. Counts still give you the dedupe signal ("4 TypeErrors this
   * session"); the messages themselves are one click away in the portal.
   */
  recentErrors: { kind: string; count: number }[]
}

const PORTAL_URL = process.env.DEV_PORTAL_PUBLIC_URL || 'http://192.168.1.160:4321'

export function buildIssueTitle(facts: IssueFacts): string {
  const where = facts.routePattern || 'unknown route'
  const who = facts.userRole ? ` (${facts.userRole})` : ''
  return `Bug report #${facts.id} — ${where}${who}`
}

/** Escape pipes so a UA string can't break the markdown table. */
function cell(value: string | null | undefined): string {
  if (!value) return '—'
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').slice(0, 300)
}

export function buildIssueBody(facts: IssueFacts): string {
  const lines: string[] = [
    'Filed from the app by a user.',
    '',
    '> **The description and any screenshot are deliberately not reproduced here.**',
    '> They can contain client information, which must not leave Supabase.',
    `> Read them in the dev portal: ${PORTAL_URL}/#bug-${facts.id}`,
    '',
    '| | |',
    '|---|---|',
    `| Report | #${facts.id} |`,
    `| Route | \`${cell(facts.routePattern)}\` |`,
    `| Role | ${cell(facts.userRole)} |`,
    `| Environment | ${cell(facts.environment)} |`,
    `| Commit | ${cell(facts.appCommit ? facts.appCommit.slice(0, 8) : null)} |`,
    `| Browser | ${cell(facts.userAgent)} |`,
    `| Viewport | ${cell(facts.viewport)} |`,
    `| Filed | ${cell(facts.createdAt)} |`,
    `| Screenshot | ${facts.hasScreenshot ? 'yes — in portal' : 'none'} |`,
  ]

  if (facts.recentErrors.length > 0) {
    lines.push('', '### JavaScript errors in the same session', '')
    for (const err of facts.recentErrors.slice(0, 10)) {
      lines.push(`- \`${cell(err.kind)}\` × ${err.count}`)
    }
    lines.push('', '_Messages omitted on purpose — they can contain client data. See the portal._')
  }

  return lines.join('\n')
}

export interface FiledIssue {
  number: number
  url: string
}

/**
 * Create the issue. Never throws and never retries: a GitHub outage must not
 * lose the report, which is already safely stored by the time we get here.
 * Returns null when unconfigured or on any failure.
 */
export async function fileBugIssue(facts: IssueFacts): Promise<FiledIssue | null> {
  const repo = process.env.GITHUB_BUG_REPO
  const token = process.env.GITHUB_BUG_TOKEN
  if (!repo || !token) return null

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: buildIssueTitle(facts),
        body: buildIssueBody(facts),
        labels: ['bug-report', `env:${facts.environment}`],
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return null
    const data = (await res.json()) as { number?: number; html_url?: string }
    if (typeof data.number !== 'number' || !data.html_url) return null
    return { number: data.number, url: data.html_url }
  } catch {
    // Deliberately swallowed — see the doc comment. The row is already written.
    return null
  }
}
