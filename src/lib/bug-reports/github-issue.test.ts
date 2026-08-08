import { describe, it, expect } from 'vitest'
import { buildIssueBody, buildIssueTitle, type IssueFacts } from './github-issue'

const facts: IssueFacts = {
  id: 42,
  routePattern: '/invoices/[id]/',
  userRole: 'contractor',
  environment: 'production',
  appCommit: 'abc1234def5678',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1',
  viewport: '390x844',
  createdAt: '2026-08-07T12:00:00.000Z',
  hasScreenshot: true,
  recentErrors: [{ kind: 'TypeError', count: 3 }],
}

describe('buildIssueTitle', () => {
  it('names the report, route and role', () => {
    expect(buildIssueTitle(facts)).toBe('Bug report #42 — /invoices/[id]/ (contractor)')
  })

  it('degrades without a route or role', () => {
    expect(buildIssueTitle({ ...facts, routePattern: null, userRole: null })).toBe(
      'Bug report #42 — unknown route'
    )
  })
})

describe('buildIssueBody', () => {
  it('links back to the portal instead of reproducing content', () => {
    const body = buildIssueBody(facts)
    expect(body).toContain('#bug-42')
    expect(body).toContain('not reproduced here')
  })

  it('includes the safe context fields', () => {
    const body = buildIssueBody(facts)
    expect(body).toContain('/invoices/[id]/')
    expect(body).toContain('contractor')
    expect(body).toContain('390x844')
    expect(body).toContain('abc1234d') // commit truncated to 8
  })

  it('lists buffered JS error kinds with counts', () => {
    const body = buildIssueBody(facts)
    expect(body).toContain('`TypeError` × 3')
  })

  it('never prints an error message — only the kind', () => {
    // The kind is machine-generated; the message can be
    // `console.error('Failed to save ' + clientName)`.
    const contaminated = [
      { kind: 'TypeError', count: 1, message: 'Failed to save Jane Doe' },
    ] as unknown as IssueFacts['recentErrors']
    const body = buildIssueBody({ ...facts, recentErrors: contaminated })
    expect(body).not.toContain('Jane Doe')
    expect(body).toContain('Messages omitted on purpose')
  })

  it('caps the error list so one bad session cannot write an essay', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ kind: `Kind${i}`, count: 1 }))
    const body = buildIssueBody({ ...facts, recentErrors: many })
    expect(body).toContain('`Kind9`')
    expect(body).not.toContain('`Kind10`')
  })

  it('escapes pipes so a user agent cannot break the table', () => {
    const body = buildIssueBody({ ...facts, userAgent: 'Weird|Browser|1.0' })
    expect(body).toContain('Weird\\|Browser\\|1.0')
  })

  it('says so when there is no screenshot', () => {
    expect(buildIssueBody({ ...facts, hasScreenshot: false })).toContain('| Screenshot | none |')
  })

  // The guarantee the whole design rests on. IssueFacts structurally cannot
  // carry the description or raw URL, so this test documents intent and would
  // fail loudly if someone widened the type.
  it('cannot leak the description or the raw URL', () => {
    const contaminated = {
      ...facts,
      description: 'The invoice for Jane Doe will not send',
      url: 'https://app.example.com/clients/3f8a1c2e-9b4d-4e7a-8c1f-2d5e6a7b8c9d/',
    } as unknown as IssueFacts

    const body = buildIssueBody(contaminated)
    expect(body).not.toContain('Jane Doe')
    expect(body).not.toContain('3f8a1c2e')
    expect(body).not.toContain('will not send')
  })
})
