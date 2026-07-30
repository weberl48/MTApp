# Help Section Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Help Center answer almost any question (Amara-first): full coverage content, phrasing-tolerant search, inline FAQ answers, gap detection, contextual help links.

**Architecture:** Extend the existing markdown-in-TS help system in place. `_data/` becomes a directory (types / per-category article files / faqs / search) behind the existing `help-articles.ts` barrel so both help pages keep working during the restructure. Gap detection adds one Supabase table (`help_events`) written fire-and-forget from the client.

**Tech Stack:** Next.js 16 App Router (client components), TypeScript, Vitest, Playwright, Supabase (RLS), shadcn/ui, react-markdown.

**Spec:** `docs/superpowers/specs/2026-07-29-help-section-design.md` (coverage matrix + FAQ seed list live there; the integrity test in Task 7 encodes the matrix).

## Global Constraints

- All internal links use trailing slashes (`/help/<slug>/`) — `trailingSlash: true`.
- `adminOnly` filtering must apply everywhere articles or FAQs render (list, search, FAQ accordion, related).
- Article/FAQ `content`/`answer` are markdown in template literals — escape any backticks as `` \` ``.
- Keywords are lowercase strings; every article ends with ≥3.
- `help_events` writes are fire-and-forget: wrap in try/catch, never await in a render path, never toast on failure.
- Migration is applied BY HAND to the dev Supabase ref `gzrukevymmguqxuoynqk` first (Management API `POST /v1/projects/<ref>/database/query`); prod application is called out, not performed.
- Commits: user is sole author — NO Co-Authored-By trailers.
- After every task: `npx tsc --noEmit` and `npm run lint` must pass before commit.
- New article content must describe real current behavior — verify claims against the cited sources (repo-root guides, CLAUDE.md, `src/lib/**`) before writing them.

---

### Task 1: Restructure `_data` into a directory (no behavior change)

**Files:**
- Create: `src/app/(dashboard)/help/_data/types.ts`
- Create: `src/app/(dashboard)/help/_data/articles/getting-started.ts`, `clients.ts`, `sessions.ts`, `invoices.ts`, `team.ts`, `analytics.ts`, `settings.ts`, `index.ts`
- Create: `src/app/(dashboard)/help/_data/faqs.ts` (empty list for now)
- Create: `src/app/(dashboard)/help/_data/search.ts`
- Modify: `src/app/(dashboard)/help/_data/help-articles.ts` → becomes a barrel
- Do NOT touch: `help/page.tsx`, `help/[slug]/page.tsx` (imports keep working)

**Interfaces:**
- Produces: `types.ts` exports `HelpCategory`, `HelpArticle` (today's shape **plus** `keywords?: string[]`), `HelpFaq`, `HELP_CATEGORIES`. `articles/index.ts` exports `HELP_ARTICLES` (concat in category display order), `getArticleBySlug(slug)`, `getArticlesByCategory(category)`. `faqs.ts` exports `HELP_FAQS: HelpFaq[]`. `search.ts` exports (for now, moved verbatim) `SearchResult`, `searchArticlesRanked`, `searchArticles`. Barrel re-exports ALL of the above.

`HelpFaq` type (in `types.ts`):

```ts
export type HelpFaq = {
  id: string            // stable kebab id, e.g. 'why-no-invoice'
  question: string      // user phrasing
  answer: string        // short markdown, 1–2 paragraphs
  articleSlug?: string  // deep link target
  category: HelpCategory
  adminOnly?: boolean
}
```

- [ ] **Step 1:** Move types + `HELP_CATEGORIES` (current `help-articles.ts:1-29`) into `types.ts`, adding `keywords?: string[]` to `HelpArticle` and the `HelpFaq` type above.
- [ ] **Step 2:** Split the 24 article objects into per-category files (line ranges in current file — getting-started: `getting-started` 33, `view-as-mode` 1027, `appearance-and-dark-mode` 1242; clients: `adding-a-client` 79, `client-portal` 938, `client-details` 1209; sessions: `logging-a-session` 135, `group-sessions` 186, `approving-sessions` 731; invoices: `generating-invoices` 237, `sending-invoices` 293, `scholarship-billing` 775; team: `inviting-team-members` 355, `managing-contractor-rates` 689; analytics: `analytics-and-reports` 843, `payroll-and-payments` 888, `my-earnings` 1068, `exporting-data` 1264; settings: `configuring-services` 399, `editing-service-types` 442, `automation-settings` 983, `profile-and-security` 1111, `practice-branding` 1157, `audit-log` 1302). Each file: `import type { HelpArticle } from '../types'` and `export const <CATEGORY>_ARTICLES: HelpArticle[] = [...]`. Content strings move byte-for-byte.
- [ ] **Step 3:** `articles/index.ts` concatenates in `HELP_CATEGORIES` display order and hosts `getArticleBySlug` / `getArticlesByCategory` (move from `help-articles.ts:1346-1352`).
- [ ] **Step 4:** Move `SearchResult`, `stripMarkdown`, `buildExcerpt`, `searchArticlesRanked`, `searchArticles` (current lines 1354–1465) verbatim into `search.ts`, importing `HELP_ARTICLES` from `./articles`.
- [ ] **Step 5:** `faqs.ts`: `import type { HelpFaq } from './types'` + `export const HELP_FAQS: HelpFaq[] = []`.
- [ ] **Step 6:** Rewrite `help-articles.ts` as a pure barrel: `export * from './types'`, `export { HELP_ARTICLES, getArticleBySlug, getArticlesByCategory } from './articles'`, `export { HELP_FAQS } from './faqs'`, `export * from './search'`.
- [ ] **Step 7:** Verify: `npx tsc --noEmit` and `npm run lint` pass; load `http://localhost:3000/help/` and one article page — identical behavior.
- [ ] **Step 8:** Commit: `refactor(help): split help data into per-category modules behind existing barrel`

---

### Task 2: Search upgrades (TDD)

**Files:**
- Modify: `src/app/(dashboard)/help/_data/search.ts`
- Test: `src/app/(dashboard)/help/_data/search.test.ts`

**Interfaces:**
- Produces: `SYNONYMS: Record<string, string[]>`; `QUESTION_STOPWORDS: Set<string>`; `expandTerms(query: string): string[][]` (per surviving term → `[term, ...synonyms]`); `searchArticlesRanked(query): SearchResult[]` (same signature, now keyword/synonym/stopword aware); `searchFaqs(query: string): FaqSearchResult[]` where `export type FaqSearchResult = { faq: HelpFaq; score: number }`.

- [ ] **Step 1: Write failing tests** in `search.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { searchArticlesRanked, searchFaqs, expandTerms } from './search'

describe('expandTerms', () => {
  it('drops question stopwords but keeps meaning terms', () => {
    const groups = expandTerms('how do i change the no-show fee')
    const flat = groups.flat()
    expect(flat).toContain('no-show')
    expect(flat).toContain('fee')
    expect(flat).not.toContain('how')
    expect(flat).not.toContain('i')
  })
  it('expands synonyms', () => {
    expect(expandTerms('bill').flat()).toEqual(expect.arrayContaining(['bill', 'invoice']))
  })
  it('falls back to raw terms when everything is a stopword', () => {
    expect(expandTerms('how do i')).toEqual([])
  })
})

describe('searchArticlesRanked', () => {
  it('finds invoice articles for "bill"', () => {
    const top = searchArticlesRanked('bill')[0]
    expect(top.article.category).toBe('invoices')
  })
  it('ranks by keywords: "pay stub" surfaces my-earnings', () => {
    const slugs = searchArticlesRanked('pay stub').map(r => r.article.slug)
    expect(slugs[0]).toBe('my-earnings')
  })
  it('handles question phrasing', () => {
    const slugs = searchArticlesRanked('how do i change the no-show fee').map(r => r.article.slug)
    expect(slugs[0]).toBe('no-shows-and-cancellations')
  })
  it('returns [] for empty and gibberish queries', () => {
    expect(searchArticlesRanked('')).toEqual([])
    expect(searchArticlesRanked('zzqqxx')).toEqual([])
  })
})

describe('searchFaqs', () => {
  it('matches FAQ question phrasing', () => {
    const results = searchFaqs('why didnt this client get an invoice')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].faq.id).toBe('why-no-invoice')
  })
})
```

- [ ] **Step 2:** `npm run test -- --run src/app/\(dashboard\)/help/_data/search.test.ts` → FAIL (`expandTerms`/`searchFaqs` not exported; ranking tests fail until Tasks 3–6 add the articles/FAQs — mark those three with `it.todo` NOW and un-todo them in the task that adds the data: `no-shows-and-cancellations` un-todos in Task 5, `my-earnings` keywords in Task 6, `why-no-invoice` in Task 3).
- [ ] **Step 3: Implement** in `search.ts` (replace the old term handling inside `searchArticlesRanked`; keep `stripMarkdown`/`buildExcerpt` as-is):

```ts
export const SYNONYMS: Record<string, string[]> = {
  bill: ['invoice'], billing: ['invoice'], bills: ['invoice'],
  pay: ['earnings', 'payroll'], paycheck: ['earnings'], paystub: ['earnings'], stub: ['earnings'],
  price: ['pricing', 'rate'], cost: ['pricing', 'rate'], charge: ['pricing', 'rate', 'fee'],
  '2fa': ['mfa'], 'two-factor': ['mfa'], authenticator: ['mfa'],
  cancel: ['cancellation', 'cancelled'], cancelling: ['cancellation'],
  therapist: ['contractor'], staff: ['contractor', 'team'],
  customer: ['client'], patient: ['client'], student: ['client'], kid: ['client'],
  money: ['earnings', 'payroll'], paid: ['payment', 'payroll'],
  reminder: ['reminders'], overdue: ['due'],
  login: ['sign in', 'password'], phone: ['mobile', 'install'],
}

export const QUESTION_STOPWORDS = new Set([
  'how', 'do', 'does', 'did', 'i', 'we', 'you', 'a', 'an', 'the', 'is', 'are',
  'was', 'were', 'my', 'to', 'can', 'cant', "can't", 'where', 'why', 'what',
  'when', 'who', 'which', 'if', 'of', 'for', 'in', 'on', 'at', 'it', 'this',
  'that', 'be', 'get', 'gets', 'didnt', "didn't", 'wont', "won't", 'not', 'me',
])

/** Tokenize, drop question stopwords (unless nothing survives), expand synonyms.
 *  Returns one group per surviving term: [term, ...synonyms]. */
export function expandTerms(query: string): string[][] {
  const raw = query.toLowerCase().split(/\s+/).filter(t => t.length > 0)
  if (raw.length === 0) return []
  let terms = raw.filter(t => !QUESTION_STOPWORDS.has(t))
  if (terms.length === 0) {
    // pure-stopword queries ("how do i") carry no searchable meaning
    return []
  }
  return terms.map(t => [t, ...(SYNONYMS[t] ?? [])])
}
```

Scoring inside `searchArticlesRanked` (per term group, a group "matches" if ANY variant hits; use the matching variant for `matchTerms`/excerpts). Add alongside the existing lowered fields: `const keywordsLower = (article.keywords ?? []).map(k => k.toLowerCase())`.

```ts
for (const group of groups) {
  let groupMatched = false
  for (const variant of group) {
    let variantMatched = false
    if (keywordsLower.some(k => k.includes(variant))) { score += 6; variantMatched = true }
    if (titleLower.includes(variant)) { score += titleLower === variant ? 10 : 5; variantMatched = true }
    if (descLower.includes(variant)) { score += 3; variantMatched = true }
    if (contentLower.includes(variant)) { score += 1; variantMatched = true }
    if (variantMatched) { matchedTerms.push(variant); groupMatched = true }
  }
  if (groupMatched) matchedGroups++
}
// all-groups bonus replaces the old all-terms bonus
if (matchedGroups === groups.length && groups.length > 1) score += 3
```

`searchFaqs`:

```ts
export type FaqSearchResult = { faq: HelpFaq; score: number }

export function searchFaqs(query: string): FaqSearchResult[] {
  const groups = expandTerms(query)
  if (groups.length === 0) return []
  const results: FaqSearchResult[] = []
  for (const faq of HELP_FAQS) {
    const q = faq.question.toLowerCase()
    const a = faq.answer.toLowerCase()
    let score = 0
    for (const group of groups) {
      for (const variant of group) {
        if (q.includes(variant)) score += 5
        else if (a.includes(variant)) score += 2
      }
    }
    if (score > 0) results.push({ faq, score })
  }
  return results.sort((a, b) => b.score - a.score)
}
```

- [ ] **Step 4:** Run the test file → all non-todo tests PASS.
- [ ] **Step 5:** Commit: `feat(help): synonym + keyword + question-aware search, FAQ search`

---

### Task 3: FAQ content (`faqs.ts`)

**Files:**
- Modify: `src/app/(dashboard)/help/_data/faqs.ts`
- Modify: `src/app/(dashboard)/help/_data/search.test.ts` (un-todo the `why-no-invoice` test)

**Interfaces:**
- Produces: `HELP_FAQS` populated (~26 entries). IDs below are FIXED — the integrity test and e2e reference them.

Write all of these, answer = 1–2 short markdown paragraphs, factually checked against the cited source. `articleSlug` targets that don't exist until Tasks 4–6 are fine (integrity test comes after).

| id | question | answer covers (source) | articleSlug | category | adminOnly |
|---|---|---|---|---|---|
| why-no-invoice | Why didn't this client get an invoice? | scholarship + monthly-billing clients batch monthly instead of per-session (`MCA-Billing-and-Pay-Rules.md` §1, CLAUDE.md billing controls) | scholarship-billing | invoices | yes |
| why-cant-delete-invoice | Why can't I delete this invoice? | only pending invoices are deletable; sent/paid are financial records (`src/lib/actions/session-invoice-cleanup.ts`) | invoice-lifecycle | invoices | yes |
| solo-group-price | Why is a group session billed less when only one person shows up? | solo exception waives per-person charge (`MCA-App-Guide.md` §2) | pricing-deep-dive | invoices | yes |
| contractor-pay-differs | Why does a contractor's pay differ between services? | rate priority: custom rate → pay schedule → formula (CLAUDE.md contractor pricing) | pricing-deep-dive | team | yes |
| what-approve-does | What happens when I approve a session? | status → approved, timestamps set, optional auto-send invoice (`src/lib/invoices/auto-send-policy.ts`) | session-workflow | sessions | yes |
| invoice-overdue-how | How does an invoice become overdue? | computed from due date + `due_days`, not a manual status (`src/lib/invoices/overdue.ts`) | invoice-lifecycle | invoices | yes |
| change-no-show-fee | How do I change the no-show fee? | Settings > Business Rules > Sessions tab, `pricing.no_show_fee` | no-shows-and-cancellations | settings | yes |
| no-show-pay | Does a contractor still get paid for a no-show? | yes — flat fee to client, normal session pay to contractor | no-shows-and-cancellations | sessions | no |
| tax-year-rule | Which year does a payment count in for taxes? | cash basis — the year the contractor was PAID (`src/lib/payroll/annual-summary.ts`) | tax-summaries | analytics | no |
| portal-link-expired | A client's portal link expired — how do I send a new one? | regenerate/resend from client page; expiry setting `portal.token_expiry_days` | client-portal | clients | yes |
| contractor-cant-see | Why can't a contractor see other people's sessions? | role permissions — contractors see own only | inviting-team-members | team | yes |
| turn-off-mfa | How do I turn off two-factor for someone? | org `require_mfa` setting; per-user factors under Profile & Security | profile-and-security | settings | yes |
| edit-approved-session | What happens if I edit an approved session? | resubmit flow — invoice is recreated to match | session-workflow | sessions | yes |
| square-marks-paid | How does an invoice get marked paid automatically? | Square webhook on payment; forward-only status (`src/lib/square/webhook-status.ts`) | square-integration | invoices | yes |
| square-fee-client | Can I pass the Square processing fee to just some clients? | per-client `square_fee_enabled` overrides org default | client-billing-controls | clients | yes |
| monthly-vs-per-session | What's the difference between monthly and per-session billing? | billing_frequency; monthly batches on Scholarship tab at normal pricing | client-billing-controls | clients | yes |
| scholarship-generate-all | When should I run "Generate All" for scholarships? | after month end, batches the previous month's sessions | scholarship-billing | invoices | yes |
| classroom-options | How do I change the classroom choices in the session form? | Settings custom lists; per-agency lists override global | custom-lists | settings | yes |
| add-payment-method | Can I rename or hide a payment method? | `custom_lists.payment_methods` labels/visibility | custom-lists | settings | yes |
| session-reminder-email | Why did/didn't a session reminder email go out? | `session.send_reminders` + `reminder_hours`; needs client email | notifications-and-reminders | settings | yes |
| invoice-reminder-days | When do invoice payment reminders send? | `invoice.reminder_days` before due date, daily cron | notifications-and-reminders | settings | yes |
| install-phone | Can I use the app on my phone? | PWA — Add to Home Screen; works offline | installing-the-app | getting-started | no |
| contractor-earnings-where | Where do I see what I've earned? | Earnings page; unpaid = submitted/approved/no_show | my-earnings | analytics | no |
| mark-contractors-paid | How do I record that I paid a contractor? | Payroll Hub mark-paid with date; snapshots amount | payroll-and-payments | analytics | yes |
| session-request-flow | What happens when a client requests a session from the portal? | staff review + approve/decline; approval creates a draft session | session-requests | sessions | yes |
| view-as-testing | How do I see the app the way a contractor sees it? | View As mode (developer/owner) | view-as-mode | getting-started | yes |

- [ ] **Step 1:** Write all FAQs into `HELP_FAQS`, checking each claim against its cited source file before writing it.
- [ ] **Step 2:** Un-todo the `searchFaqs` test; run `npm run test -- --run src/app/\(dashboard\)/help/_data/search.test.ts` → PASS.
- [ ] **Step 3:** Commit: `feat(help): seed FAQ list (26 real-phrasing questions)`

---

### Task 4: Content packet — invoices & money (3 new articles + keyword/accuracy pass)

**Files:**
- Modify: `src/app/(dashboard)/help/_data/articles/invoices.ts` (add `billing-and-pay-rules`, `invoice-lifecycle`, `square-integration`; keywords+accuracy for `generating-invoices`, `sending-invoices`, `scholarship-billing`)

**Interfaces:**
- Produces: slugs `billing-and-pay-rules`, `invoice-lifecycle`, `square-integration` (category `invoices`, all `adminOnly: true`).

Each new article: `description` one sentence; `content` 400–900 words of plain-language markdown in the voice of the existing articles (H2 sections, bold UI names, "Where to configure" callouts); `relatedArticles` cross-links within this packet + `pricing-deep-dive`; `keywords` ≥5.

- [ ] **Step 1:** `billing-and-pay-rules` — the money path (session → per-client invoices → contractor pay → MCA cut); the three numbers locked at session creation; payment methods and how each bills; scholarship/monthly exceptions. Source: `MCA-Billing-and-Pay-Rules.md` (port §Big Picture, §1, §2 nearly verbatim, adapted to second person). Keywords include: `money`, `billing rules`, `mca cut`, `who pays`, `payment method`.
- [ ] **Step 2:** `invoice-lifecycle` — pending → sent → paid; overdue computed from due date (`invoice.due_days`); reminder schedule (`reminder_days`, tracked so reminders never double-send); resubmitting a session recreates its pending invoice; sent/paid invoices can never be deleted (financial records) while pending ones can; leaving paid clears the paid date. Sources: `src/lib/invoices/overdue.ts`, `status.ts`, `session-invoice-cleanup.ts`, CLAUDE.md. Keywords: `overdue`, `delete invoice`, `resend`, `paid date`, `reminders`, `status`.
- [ ] **Step 3:** `square-integration` — what Send via Square does; processing fee (org setting: fixed/percentage; per-client override); payments marking invoices paid automatically via webhooks (and why a paid invoice never un-pays); sandbox vs production note. Sources: `src/lib/square/*.ts`, CLAUDE.md. Keywords: `square`, `credit card`, `processing fee`, `webhook`, `online payment`.
- [ ] **Step 4:** Keyword + accuracy pass on the 3 existing invoice articles (read each against the current UI/behavior; fix stale claims; add ≥3 keywords each, e.g. `generating-invoices`: `bill`, `per client`, `automatic`).
- [ ] **Step 5:** `npx tsc --noEmit` + `npm run lint` → pass. Commit: `docs(help): invoice & money articles — billing rules, lifecycle, square`

---

### Task 5: Content packet — sessions & clients (4 new articles + keyword pass)

**Files:**
- Modify: `src/app/(dashboard)/help/_data/articles/sessions.ts` (add `session-workflow`, `no-shows-and-cancellations`, `session-requests`; keywords for `logging-a-session`, `group-sessions`, `approving-sessions`)
- Modify: `src/app/(dashboard)/help/_data/articles/clients.ts` (add `client-billing-controls`; keywords for `adding-a-client`, `client-portal`, `client-details`)
- Modify: `src/app/(dashboard)/help/_data/search.test.ts` (un-todo the no-show-fee ranking test)

**Interfaces:**
- Produces: slugs `session-workflow` (sessions, adminOnly), `no-shows-and-cancellations` (sessions, adminOnly false — contractors mark no-shows), `session-requests` (sessions, adminOnly), `client-billing-controls` (clients, adminOnly).

- [ ] **Step 1:** `session-workflow` — draft → submitted → approved (+ cancelled, no_show); who can do what at each state (contractor edits drafts; admin approves/rejects); what submit triggers (invoices per attendee) and what approve triggers (timestamps, optional auto-send); editing an approved session = resubmit, invoice recreated. Sources: CLAUDE.md schema section, `src/lib/invoices/auto-send-policy.ts`. Keywords: `draft`, `submitted`, `approved`, `status`, `resubmit`, `reject`.
- [ ] **Step 2:** `no-shows-and-cancellations` — difference between cancel and no-show; flat no-show fee billed to client (default $60, configurable at Settings > Business Rules > Sessions), contractor still gets normal session pay; invoice consequences of each. Source: `src/lib/pricing/index.ts` (`calculateNoShowPricing`), `MCA-App-Guide.md`. Keywords: `no-show`, `no show fee`, `cancel`, `missed session`, `didn't show`.
- [ ] **Step 3:** `session-requests` — clients request sessions from the portal; where staff see pending requests; approve (creates a draft session) / decline; notes are private. Source: `src/app/actions/session-requests.ts`, portal routes in CLAUDE.md. Keywords: `request`, `portal request`, `approve request`, `decline`.
- [ ] **Step 4:** `client-billing-controls` — `billing_frequency` per-session vs monthly (monthly clients batch on the Scholarship tab at normal pricing); per-client Square fee opt-in (null = follow org setting), snapshotted per invoice. Source: CLAUDE.md July 2026 billing-controls section. Keywords: `monthly billing`, `billing frequency`, `square fee`, `batch`.
- [ ] **Step 5:** Keyword + accuracy pass on the 6 existing session/client articles (≥3 each; `logging-a-session` gets `log`, `new session`, `classroom`, `notes`).
- [ ] **Step 6:** Un-todo the `how do i change the no-show fee` ranking test → run search tests → PASS. Commit: `docs(help): session workflow, no-shows, requests, client billing controls`

---

### Task 6: Content packet — settings, analytics, getting-started, team (5 new articles + keyword pass)

**Files:**
- Modify: `articles/settings.ts` (add `pricing-deep-dive`, `custom-lists`, `notifications-and-reminders`; keywords for its 6 existing articles)
- Modify: `articles/analytics.ts` (add `tax-summaries`; keywords for its 4 existing articles — `my-earnings` MUST include `pay stub`, `paycheck`)
- Modify: `articles/getting-started.ts` (add `installing-the-app`; keywords for its 3 existing articles)
- Modify: `articles/team.ts` (keywords for its 2 existing articles)
- Modify: `search.test.ts` (un-todo the `pay stub` ranking test)

**Interfaces:**
- Produces: slugs `pricing-deep-dive` (settings, adminOnly), `custom-lists` (settings, adminOnly), `notifications-and-reminders` (settings, adminOnly), `tax-summaries` (analytics, adminOnly **false** — contractors use it), `installing-the-app` (getting-started, adminOnly false).

- [ ] **Step 1:** `pricing-deep-dive` — port `MCA-App-Guide.md` §2–4: base rate for 30 min scaled by duration (1× / 1.5× / 2× / 3× table); group per-person + solo exception; total caps; contractor pay priority (custom rate → pay schedule offset → formula); scholarship flat rates; where each knob lives (Settings > Services / contractor rates). Keywords: `price`, `rate`, `duration`, `multiplier`, `group price`, `contractor pay`, `formula`.
- [ ] **Step 2:** `custom-lists` — payment methods, billing methods (rename/hide), classrooms global list + per-agency `classrooms_by_client` overrides; where the lists appear. Source: CLAUDE.md `custom_lists`. Keywords: `payment methods`, `classroom`, `dropdown`, `rename`, `hide`.
- [ ] **Step 3:** `notifications-and-reminders` — session-submit + invoice-paid emails and `admin_email`; invoice payment reminders (`reminder_days` before due, daily); session reminders (`reminder_hours`, needs client email); where each toggle lives. Source: CLAUDE.md settings table + cron routes. Keywords: `email`, `reminder`, `notification`, `didn't get email`.
- [ ] **Step 4:** `tax-summaries` — cash-basis rule (counts in the year PAID); annual summary PDF (contractor: own; owner: any); tax CSV export with `?year=` and detail rows; zero-PHI note. Source: `src/lib/payroll/annual-summary.ts`, memory/tax-summaries. Keywords: `taxes`, `1099`, `tax year`, `annual summary`, `csv`.
- [ ] **Step 5:** `installing-the-app` — Add to Home Screen on iPhone (Safari share menu) and Android (Chrome install prompt); desktop install; offline behavior; it's the same app, no app store. Source: CLAUDE.md PWA section. Keywords: `install`, `phone`, `mobile`, `iphone`, `android`, `home screen`, `app store`.
- [ ] **Step 6:** Keyword pass on remaining existing articles (settings 6, analytics 4 — `my-earnings` gets `pay stub`/`paycheck`/`earnings`/`pay`, getting-started 3, team 2). Every article now has ≥3 keywords.
- [ ] **Step 7:** Un-todo the `pay stub` test → run search tests → ALL PASS. Commit: `docs(help): pricing deep-dive, custom lists, notifications, taxes, PWA install`

---

### Task 7: Integrity test (coverage matrix enforced)

**Files:**
- Test: `src/app/(dashboard)/help/_data/integrity.test.ts`

**Interfaces:**
- Consumes: `HELP_ARTICLES`, `HELP_FAQS`, `HELP_CATEGORIES` from `./help-articles`.

- [ ] **Step 1:** Write the test (this encodes the spec's coverage matrix — copy it exactly):

```ts
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { HELP_ARTICLES, HELP_FAQS, HELP_CATEGORIES, getArticleBySlug } from './help-articles'

// Spec: docs/superpowers/specs/2026-07-29-help-section-design.md §2
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
      for (const k of a.keywords ?? []) expect(k).toBe(k.toLowerCase())
    }
  })
  it('every category has at least one article', () => {
    for (const cat of HELP_CATEGORIES) {
      expect(HELP_ARTICLES.some(a => a.category === cat.id), cat.id).toBe(true)
    }
  })
  it('relatedArticles and FAQ links resolve', () => {
    for (const a of HELP_ARTICLES) {
      for (const rel of a.relatedArticles ?? []) {
        expect(getArticleBySlug(rel), `${a.slug} → ${rel}`).toBeDefined()
      }
    }
    for (const f of HELP_FAQS) {
      if (f.articleSlug) expect(getArticleBySlug(f.articleSlug), `faq ${f.id}`).toBeDefined()
    }
    const ids = HELP_FAQS.map(f => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('every <PageHelp article="..."> in the dashboard resolves', () => {
    const root = join(__dirname, '..', '..')
    const files = readdirSync(root, { recursive: true, withFileTypes: true })
      .filter(d => d.isFile() && d.name.endsWith('.tsx'))
      .map(d => join((d as unknown as { parentPath?: string; path: string }).parentPath ?? d.path, d.name)) // parentPath needs Node ≥20.12; path is the pre-deprecation alias
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/<PageHelp\s+article="([^"]+)"/g)) {
        expect(getArticleBySlug(m[1]), `${file} → ${m[1]}`).toBeDefined()
      }
    }
  })
})
```

- [ ] **Step 2:** `npm run test -- --run src/app/\(dashboard\)/help/_data/integrity.test.ts` → PASS (all content landed in Tasks 3–6; if anything fails, fix the DATA, not the test).
- [ ] **Step 3:** Commit: `test(help): coverage-matrix + referential integrity guard`

---

### Task 8: FAQ surface on the help landing page

**Files:**
- Modify: `src/app/(dashboard)/help/page.tsx`
- Create (via CLI): `src/components/ui/accordion.tsx` — run `npx shadcn@latest add accordion`

**Interfaces:**
- Consumes: `HELP_FAQS`, `searchFaqs`, `FaqSearchResult` from `./_data/help-articles`; existing `markdownComponents` pattern (copy the small subset needed: `p`, `strong`, `code`, `ul`, `li`).

- [ ] **Step 1:** `npx shadcn@latest add accordion`
- [ ] **Step 2:** In `page.tsx`: filter FAQs by role once: `const accessibleFaqs = useMemo(() => HELP_FAQS.filter(f => !f.adminOnly || isAdminOrAbove), [isAdminOrAbove])`. Add `const faqResults = useMemo(() => searchQuery.trim() ? searchFaqs(searchQuery).filter(r => accessibleFaqs.includes(r.faq)) : null, [searchQuery, accessibleFaqs])`.
- [ ] **Step 3:** Search results view: above the article list, when `faqResults?.length`, render up to 3 as bordered cards — question as `font-medium`, answer rendered with `ReactMarkdown` (import from `react-markdown`, reuse a trimmed `markdownComponents`), plus `articleSlug && <Link href={`/help/${faq.articleSlug}/`}>Read more</Link>`.
- [ ] **Step 4:** Replace the entire "Popular Articles" block with **Common Questions**: an `<Accordion type="single" collapsible>` of `accessibleFaqs.slice(0, 8)` (`AccordionTrigger` = question, `AccordionContent` = markdown answer + Read more link), then a "View all questions" ghost button toggling state `showAllFaqs` that swaps in ALL `accessibleFaqs` grouped by category (category name as a small heading above its accordion items).
- [ ] **Step 5:** Update the zero-results condition used by the empty state to require BOTH `filteredArticles.length === 0` and `(faqResults?.length ?? 0) === 0`.
- [ ] **Step 6:** Verify in browser: landing accordion renders + expands; searching `why didn't this client get an invoice` shows the inline FAQ answer; contractor view (View As) hides adminOnly FAQs. `npx tsc --noEmit` + lint.
- [ ] **Step 7:** Commit: `feat(help): common-questions accordion + inline FAQ answers in search`

---

### Task 9: `help_events` migration (dev DB)

**Files:**
- Create: `supabase/migrations/20260729_help_events.sql`

- [ ] **Step 1:** Write the migration:

```sql
-- Help Center gap detection: search misses + article feedback.
create table if not exists help_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  event_type text not null check (event_type in ('search_miss', 'article_feedback')),
  query text,
  article_slug text,
  helpful boolean,
  created_at timestamptz not null default now(),
  constraint help_events_shape check (
    (event_type = 'search_miss' and query is not null)
    or (event_type = 'article_feedback' and article_slug is not null and helpful is not null)
  )
);

create index if not exists help_events_org_created_idx
  on help_events (organization_id, created_at desc);

alter table help_events enable row level security;

create policy "Users insert help events for own org" on help_events
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and organization_id in (select organization_id from users where id = auth.uid())
  );

create policy "Admins read own-org help events" on help_events
  for select to authenticated
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.organization_id = help_events.organization_id
        and u.role in ('owner', 'admin', 'developer')
    )
  );
```

- [ ] **Step 2:** Apply to DEV ref `gzrukevymmguqxuoynqk` via Management API query endpoint (`SUPABASE_ACCESS_TOKEN` from `.env.local`). Verify: `select count(*) from help_events` → 0; `select policyname from pg_policies where tablename = 'help_events'` → 2 rows (INSERT policy expression appears in `with_check`, not `qual`).
- [ ] **Step 3:** Do NOT apply to prod — note it in the final report as a pending manual step for the next prod deploy.
- [ ] **Step 4:** Commit: `feat(db): help_events table for help-center gap detection (applied to dev; prod pending)`

---

### Task 10: Event logging lib + feedback widget + owner gaps card

**Files:**
- Create: `src/lib/help/events.ts`
- Test: `src/lib/help/events.test.ts`
- Create: `src/components/help/article-feedback.tsx`
- Create: `src/components/help/help-gaps-card.tsx`
- Modify: `src/app/(dashboard)/help/page.tsx` (search-miss effect + gaps card)
- Modify: `src/app/(dashboard)/help/[slug]/page.tsx` (feedback widget)

**Interfaces:**
- Produces: `normalizeQuery(q: string): string` (trim, lowercase, collapse whitespace); `createSearchMissGate(): (q: string) => boolean` (returns true first time per normalized query, false after — session dedupe); `logSearchMiss(orgId: string, userId: string, query: string): void`; `logArticleFeedback(orgId: string, userId: string, slug: string, helpful: boolean): void`. Loggers create the browser supabase client lazily, `.insert()` then `.then(() => {}, () => {})` — fire-and-forget, never throw.

- [ ] **Step 1: Failing tests** for the pure parts:

```ts
import { describe, it, expect } from 'vitest'
import { normalizeQuery, createSearchMissGate } from './events'

describe('normalizeQuery', () => {
  it('trims, lowercases, collapses whitespace', () => {
    expect(normalizeQuery('  Why   NO Invoice ')).toBe('why no invoice')
  })
})

describe('createSearchMissGate', () => {
  it('allows a query once per session', () => {
    const gate = createSearchMissGate()
    expect(gate('billing')).toBe(true)
    expect(gate(' Billing ')).toBe(false)
    expect(gate('other')).toBe(true)
  })
})
```

- [ ] **Step 2:** Run → FAIL. Implement `src/lib/help/events.ts`:

```ts
import { createClient } from '@/lib/supabase/client'

export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function createSearchMissGate(): (q: string) => boolean {
  const seen = new Set<string>()
  return (q: string) => {
    const key = normalizeQuery(q)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }
}

function fireAndForget(insert: PromiseLike<unknown>) {
  insert.then(() => {}, () => {}) // help logging must never surface errors
}

export function logSearchMiss(orgId: string, userId: string, query: string): void {
  try {
    fireAndForget(createClient().from('help_events').insert({
      organization_id: orgId, user_id: userId,
      event_type: 'search_miss', query: normalizeQuery(query).slice(0, 200),
    }))
  } catch { /* never break the page over telemetry */ }
}

export function logArticleFeedback(orgId: string, userId: string, slug: string, helpful: boolean): void {
  try {
    fireAndForget(createClient().from('help_events').insert({
      organization_id: orgId, user_id: userId,
      event_type: 'article_feedback', article_slug: slug, helpful,
    }))
  } catch { /* never break the page over telemetry */ }
}
```

Run tests → PASS.
- [ ] **Step 3:** `article-feedback.tsx` — client component `<ArticleFeedback slug={article.slug} />`: "Was this helpful?" + thumbs-up/down ghost buttons (lucide `ThumbsUp`/`ThumbsDown`); on click call `logArticleFeedback(organization.id, user.id, slug, helpful)` (from `useOrganization()`; render nothing if either is null), then swap to "Thanks for the feedback!" (local `voted` state — one vote per mount). Accessible names MUST be `aria-label="Yes, this helped"` and `aria-label="No, this didn't help"` — the e2e spec (Task 12) targets them. Mount at the bottom of the article card in `[slug]/page.tsx`.
- [ ] **Step 4:** Search-miss effect in `help/page.tsx` (module-level `const searchMissGate = createSearchMissGate()`):

```tsx
useEffect(() => {
  const q = searchQuery.trim()
  if (q.length < 3 || !organization || !user) return
  if ((searchResults?.length ?? 0) > 0 || (faqResults?.length ?? 0) > 0) return
  const t = setTimeout(() => {
    if (searchMissGate(q)) logSearchMiss(organization.id, user.id, q)
  }, 1500)
  return () => clearTimeout(t)
}, [searchQuery, searchResults, faqResults, organization, user])
```

- [ ] **Step 5:** `help-gaps-card.tsx` — client component, renders only when `can('settings:edit')`. On mount, one query: last 50 `help_events` for the org ordered `created_at desc` (RLS scopes it; still `.eq('organization_id', organization.id)`). Derive: distinct `search_miss` queries (first 10, newest first) and `article_feedback` rows with `helpful === false` (first 5, map slug → title via `getArticleBySlug`). Card titled "Help gaps" with the two lists (or "No unanswered searches yet" empty text). Mount at the very bottom of `help/page.tsx` (below FAQ section, all view states).
- [ ] **Step 6:** Browser check on dev (`:3000/help/`): gibberish search → wait → row in `help_events` (verify via Management API select); 👎 an article → second row; gaps card lists both; contractor View-As hides the card. Commit: `feat(help): gap detection — search-miss + article feedback + owner gaps card`

---

### Task 11: PageHelp contextual links

**Files:**
- Create: `src/components/help/page-help.tsx`
- Modify (placement next to each page's `<h1>` header): `src/app/(dashboard)/sessions/page.tsx` (`session-workflow`), `invoices/page.tsx` (`invoice-lifecycle`), `payments/page.tsx` (`payroll-and-payments`), `clients/page.tsx` (`adding-a-client`), `team/page.tsx` (`inviting-team-members`), `analytics/page.tsx` (`analytics-and-reports`), `earnings/page.tsx` (`my-earnings`), `settings/business/page.tsx` (`pricing-deep-dive`), `settings/customize/page.tsx` (`custom-lists`), `settings/practice/page.tsx` (`practice-branding`), `settings/audit/page.tsx` (`audit-log`)

**Interfaces:**
- Consumes: article slugs from Tasks 4–6. The integrity test (Task 7) validates every placement.

- [ ] **Step 1:** Component:

```tsx
import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** A small "?" next to a page title linking to that page's help article. */
export function PageHelp({ article }: { article: string }) {
  return (
    <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
      <Link href={`/help/${article}/`} aria-label="Help for this page">
        <HelpCircle className="h-4 w-4" />
      </Link>
    </Button>
  )
}
```

- [ ] **Step 2:** For each listed page: read its header, wrap the `<h1>` (or title element) and `<PageHelp article="…" />` in `<div className="flex items-center gap-1.5">` if not already a flex row. Slug per file as listed above. If a page renders its title through a shared header component, place `PageHelp` beside where that component is used — do not modify the shared component.
- [ ] **Step 3:** Run the integrity test (validates all placements resolve) + `npx tsc --noEmit` + lint. Spot-check two pages in the browser.
- [ ] **Step 4:** Commit: `feat(help): contextual ? links on key pages`

---

### Task 12: E2E spec

**Files:**
- Test: `tests/e2e/help.spec.ts`

**Interfaces:**
- Consumes: `login` from `tests/e2e/helpers.ts` (logs in as `dev-owner@maycreativearts.test`, now role `developer`).

- [ ] **Step 1:** Write the spec:

```ts
import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('help center', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/help/')
  })

  test('synonym search finds invoice help for "bill"', async ({ page }) => {
    await page.getByPlaceholder('Search help articles...').fill('bill')
    await expect(page.getByRole('link', { name: /invoice/i }).first()).toBeVisible()
  })

  test('FAQ answer renders inline for question phrasing', async ({ page }) => {
    await page.getByPlaceholder('Search help articles...').fill('why didnt this client get an invoice')
    await expect(page.getByText(/scholarship/i).first()).toBeVisible()
  })

  test('common questions accordion expands', async ({ page }) => {
    const first = page.getByRole('button', { name: /why didn't this client get an invoice/i })
    await first.click()
    await expect(page.getByText(/read more/i).first()).toBeVisible()
  })

  test('article feedback records without error', async ({ page }) => {
    await page.goto('/help/invoice-lifecycle/')
    await page.getByRole('button', { name: /yes, this helped/i }).click()
    await expect(page.getByText(/thanks for the feedback/i)).toBeVisible()
  })

  test('contextual help links from invoices page', async ({ page }) => {
    await page.goto('/invoices/')
    await page.getByRole('link', { name: 'Help for this page' }).click()
    await expect(page).toHaveURL(/\/help\/invoice-lifecycle\//)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/invoice/i)
  })
})
```

(Adjust the feedback button's accessible name to whatever Task 10 shipped — keep them in sync.)
- [ ] **Step 2:** Run `npx playwright test tests/e2e/help.spec.ts --workers=1` with `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` set (dev server on :3000) → PASS.
- [ ] **Step 3:** Commit: `test(e2e): help center search, FAQ, feedback, contextual links`

---

### Task 13: Docs + full verification

**Files:**
- Modify: `CLAUDE.md` (Help Articles section)

- [ ] **Step 1:** Update CLAUDE.md's "Help Articles" section: articles now live in `src/app/(dashboard)/help/_data/articles/<category>.ts` (barrel `help-articles.ts` unchanged as import path); every article needs ≥3 lowercase `keywords`; FAQs in `_data/faqs.ts` (`HelpFaq`, stable `id`); the coverage-matrix integrity test (`_data/integrity.test.ts`) must be updated when adding routes; `help_events` table exists for gap detection.
- [ ] **Step 2:** Full gate: `npm run lint`, `npx tsc --noEmit`, `npm run test -- --run`, `npx playwright test tests/e2e/help.spec.ts --workers=1`. All green.
- [ ] **Step 3:** Verify the running local app once more (`/help/` renders accordion + gaps card; a synonym search works).
- [ ] **Step 4:** Commit: `docs: help authoring guide — per-category modules, keywords, FAQ, integrity test`
