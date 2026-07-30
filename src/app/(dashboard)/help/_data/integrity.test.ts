import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HELP_ARTICLES, HELP_FAQS, HELP_CATEGORIES, getArticleBySlug } from './help-articles'

const HERE = dirname(fileURLToPath(import.meta.url))

// Spec: docs/superpowers/specs/2026-07-29-help-section-design.md §2
// Every app surface must map to at least one real article. When you add a
// route or settings tab, add its row here — this test is the coverage guard.
const COVERAGE_MATRIX: Record<string, string[]> = {
  '/dashboard': ['getting-started'],
  '/sessions': ['logging-a-session', 'session-workflow', 'approving-sessions'],
  '/sessions/new': ['logging-a-session', 'group-sessions'],
  '/clients': ['adding-a-client', 'client-details', 'client-billing-controls'],
  '/invoices': ['generating-invoices', 'invoice-lifecycle', 'sending-invoices', 'billing-and-pay-rules'],
  '/invoices/scholarship': ['scholarship-billing'],
  '/invoices/[id]': ['invoice-lifecycle', 'square-integration'],
  '/payments': ['payroll-and-payments', 'tax-summaries'],
  '/analytics': ['analytics-and-reports', 'exporting-data'],
  '/earnings': ['my-earnings', 'tax-summaries'],
  '/team': ['inviting-team-members', 'managing-contractor-rates'],
  '/settings': ['profile-and-security'],
  '/settings/business/services': ['configuring-services', 'editing-service-types', 'pricing-deep-dive'],
  '/settings/business/invoices': ['generating-invoices', 'notifications-and-reminders'],
  '/settings/business/sessions': ['logging-a-session', 'no-shows-and-cancellations'],
  '/settings/business/notifications': ['notifications-and-reminders'],
  '/settings/business/features': ['client-portal', 'automation-settings'],
  '/settings/customize': ['custom-lists'],
  '/settings/practice': ['practice-branding'],
  '/settings/profile': ['profile-and-security', 'appearance-and-dark-mode'],
  '/settings/audit': ['audit-log'],
  'portal-admin': ['client-portal', 'session-requests'],
  'pwa': ['installing-the-app'],
  'ai-chat': ['ai-helper'],
}

describe('help content integrity', () => {
  it('coverage matrix: every surface maps to real articles', () => {
    for (const [surface, slugs] of Object.entries(COVERAGE_MATRIX)) {
      for (const slug of slugs) {
        expect(getArticleBySlug(slug), `${surface} → missing article ${slug}`).toBeDefined()
      }
    }
  })

  it('slugs are unique', () => {
    const slugs = HELP_ARTICLES.map(a => a.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every article has ≥3 lowercase keywords', () => {
    for (const a of HELP_ARTICLES) {
      expect(a.keywords?.length ?? 0, `${a.slug} needs ≥3 keywords`).toBeGreaterThanOrEqual(3)
      for (const k of a.keywords ?? []) {
        expect(k, `${a.slug} keyword "${k}" must be lowercase`).toBe(k.toLowerCase())
      }
    }
  })

  it('every category has at least one article', () => {
    for (const cat of HELP_CATEGORIES) {
      expect(HELP_ARTICLES.some(a => a.category === cat.id), cat.id).toBe(true)
    }
  })

  it('article walkthrough refs resolve and adminOnly stays in sync both ways', async () => {
    const { ALL_WALKTHROUGHS, getWalkthroughById } = await import('@/components/walkthroughs/walkthroughs')
    for (const a of HELP_ARTICLES) {
      if (!a.walkthrough) continue
      const w = getWalkthroughById(a.walkthrough)
      expect(w, `${a.slug} → missing walkthrough ${a.walkthrough}`).toBeDefined()
      // A contractor-visible article must not launch an admin tour (and vice
      // versa) — the Guided Tours card and next-tour chaining rely on the flag.
      expect(!!w!.adminOnly, `${a.slug} adminOnly (${!!a.adminOnly}) != walkthrough ${w!.id} adminOnly (${!!w!.adminOnly})`).toBe(!!a.adminOnly)
    }
    for (const w of ALL_WALKTHROUGHS) {
      expect(
        HELP_ARTICLES.some(a => a.walkthrough === w.id),
        `walkthrough ${w.id} has no launching article`
      ).toBe(true)
    }
  })

  it('RECOMMENDED_WALKTHROUGH_ORDER covers exactly the registered walkthroughs', async () => {
    // A tour missing from the order silently vanishes from the Guided Tours
    // card and next-tour chaining; a stale id in the order is dead weight.
    const { ALL_WALKTHROUGHS } = await import('@/components/walkthroughs/walkthroughs')
    const { RECOMMENDED_WALKTHROUGH_ORDER } = await import('@/lib/walkthroughs/completion')
    const registered = ALL_WALKTHROUGHS.map(w => w.id).sort()
    const ordered = [...RECOMMENDED_WALKTHROUGH_ORDER].sort()
    expect(ordered).toEqual(registered)
  })

  it('relatedArticles and FAQ links resolve; FAQ ids unique', () => {
    for (const a of HELP_ARTICLES) {
      for (const rel of a.relatedArticles ?? []) {
        expect(getArticleBySlug(rel), `${a.slug} → ${rel}`).toBeDefined()
      }
    }
    for (const f of HELP_FAQS) {
      if (f.articleSlug) {
        expect(getArticleBySlug(f.articleSlug), `faq ${f.id} → ${f.articleSlug}`).toBeDefined()
      }
    }
    const ids = HELP_FAQS.map(f => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every <PageHelp article="..."> in the dashboard resolves', () => {
    const root = join(HERE, '..', '..')
    const files = readdirSync(root, { recursive: true, withFileTypes: true })
      .filter(d => d.isFile() && d.name.endsWith('.tsx'))
      // parentPath needs Node ≥20.12; path is the pre-deprecation alias
      .map(d => join((d as unknown as { parentPath?: string; path: string }).parentPath ?? (d as unknown as { path: string }).path, d.name))
    let placements = 0
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/<PageHelp\s+article="([^"]+)"/g)) {
        placements++
        expect(getArticleBySlug(m[1]), `${file} → ${m[1]}`).toBeDefined()
      }
    }
    expect(placements, 'expected contextual help placements to exist').toBeGreaterThan(0)
  })
})
