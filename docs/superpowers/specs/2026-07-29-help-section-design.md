# Help Section Overhaul — Design Spec

**Date:** 2026-07-29
**Goal:** Almost any question a user (primarily Amara, the owner) has about the app gets answered by the Help Center — findable in her own phrasing, without asking a human.
**Scope:** Phase 1 — content, search, FAQ, gap detection, contextual help. A future AI answer box is explicitly out of scope; this phase produces the structured content it will consume.

## Background

The Help Center today: 24 markdown-in-TypeScript articles in `src/app/(dashboard)/help/_data/help-articles.ts` (~1,400 lines), 7 categories, client-side ranked fuzzy search with excerpts, `adminOnly` role-gating, related-article links, 8 interactive walkthroughs. Gaps: no coverage of pricing mechanics, invoice lifecycle rules, Square, taxes, automation details, or client billing controls; search misses owner phrasing ("bill", "pay stub"); a "Popular Articles" section that is really "first 5 articles"; no signal about what users search for and don't find.

Three repo-root guide docs written for Amara (`MCA-App-Guide.md`, `MCA-Billing-and-Pay-Rules.md`, `MCA-Billing-and-Pay-System.md`) contain plain-language pricing/billing/pay explanations that belong in the in-app help.

## 1. Content model & file structure

`_data/` becomes a directory; the existing import path stays valid as a barrel so `help/page.tsx` and `help/[slug]/page.tsx` keep their imports:

```
src/app/(dashboard)/help/_data/
  types.ts          HelpCategory, HelpArticle (+ keywords?: string[]), HelpFaq
  articles/
    getting-started.ts, clients.ts, sessions.ts, invoices.ts,
    team.ts, analytics.ts, settings.ts     (one exported array per category)
  faqs.ts           HELP_FAQS: HelpFaq[]
  search.ts         searchArticlesRanked, searchFaqs, SYNONYMS, question stripping
  help-articles.ts  barrel: re-exports today's full API (HELP_ARTICLES, HELP_CATEGORIES,
                    getArticleBySlug, getArticlesByCategory, searchArticlesRanked,
                    searchArticles, types) plus HELP_FAQS and searchFaqs
```

```ts
type HelpFaq = {
  id: string                 // stable slug-like id, e.g. 'why-no-invoice'
  question: string           // Amara's phrasing: "Why didn't this client get an invoice?"
  answer: string             // short markdown, 1–2 paragraphs max
  articleSlug?: string       // "Read more" deep link
  category: HelpCategory
  adminOnly?: boolean
}
```

`HELP_ARTICLES` is the concatenation of the per-category arrays in category display order. No new categories — troubleshooting content lives in the FAQ.

## 2. Content plan — coverage matrix

Rule: **every dashboard route and every settings tab maps to at least one article.** A referential-integrity unit test enforces the matrix below (route → slug list) so coverage can't silently rot.

| Surface | Article(s) |
|---|---|
| /dashboard | getting-started |
| /sessions, /sessions/[id] | logging-a-session, session-workflow (new), approving-sessions |
| /sessions/new, [id]/edit | logging-a-session, group-sessions |
| /clients, /clients/[id] | adding-a-client, client-details, client-billing-controls (new) |
| /invoices | generating-invoices, invoice-lifecycle (new), sending-invoices, billing-and-pay-rules (new) |
| /invoices Scholarship tab | scholarship-billing |
| /invoices/[id] | invoice-lifecycle (new), square-integration (new) |
| /payments | payroll-and-payments, tax-summaries (new) |
| /analytics | analytics-and-reports, exporting-data |
| /earnings | my-earnings, tax-summaries (new) |
| /team, /team/[id] | inviting-team-members, managing-contractor-rates |
| /settings (hub) | profile-and-security |
| /settings/business (services tab) | configuring-services, editing-service-types, pricing-deep-dive (new) |
| /settings/business (invoices tab) | generating-invoices, notifications-and-reminders (new) |
| /settings/business (sessions tab) | logging-a-session, no-shows-and-cancellations (new) |
| /settings/business (notifications tab) | notifications-and-reminders (new) |
| /settings/business (features tab) | client-portal, automation-settings |
| /settings/customize | custom-lists (new) |
| /settings/practice | practice-branding |
| /settings/profile | profile-and-security, appearance-and-dark-mode |
| /settings/audit | audit-log |
| Client portal (admin side) | client-portal, session-requests (new) |
| PWA / mobile | installing-the-app (new) |

**New articles (12):**

1. **pricing-deep-dive** — duration scaling from the 30-min base, group per-person rates, solo exception, total caps, contractor pay priority (custom rate → pay schedule → formula), where each knob lives. Source: `MCA-App-Guide.md`.
2. **billing-and-pay-rules** — the money path: session → per-client invoices → contractor pay → MCA cut; payment methods and how each bills. Source: `MCA-Billing-and-Pay-Rules.md` / `-System.md`.
3. **invoice-lifecycle** — pending/sent/paid; overdue is computed from due date, not a status; reminders (`reminder_days`); resubmitting a session recreates its invoice; why sent/paid invoices can never be deleted (financial records) while pending ones can.
4. **square-integration** — connecting, what "Send via Square" does, processing-fee settings (org default + per-client override), how Square webhooks mark invoices paid, sandbox vs production.
5. **tax-summaries** — cash-basis rule (the year the contractor was *paid*), annual summary PDF, tax CSV export, owner vs contractor views.
6. **client-billing-controls** — monthly vs per-session billing frequency (monthly clients skip per-session invoices and batch at month end), per-client Square-fee opt-in.
7. **session-workflow** — draft → submitted → approved, plus cancelled and no_show; what each role can do at each state; what approval triggers (invoices, auto-send).
8. **no-shows-and-cancellations** — the flat no-show fee, contractor still gets normal pay, configuring the fee, cancel vs no-show and their invoice consequences.
9. **custom-lists** — payment methods, billing methods, classrooms, per-agency classroom lists; hiding/renaming options.
10. **notifications-and-reminders** — session-submit and invoice-paid emails, admin email, invoice payment reminders, session reminders.
11. **session-requests** — how portal clients request sessions and how staff approve/decline.
12. **installing-the-app** — PWA install on iPhone/Android/desktop, offline behavior.

**Existing 24 articles:** accuracy pass against current app behavior + `keywords` added to all.

**FAQs (~25–30)**, one-paragraph answers in real phrasing, each linking to its deep article. Seed set includes: why didn't this client get an invoice (scholarship/monthly); why can't I delete this invoice; why is the total not just rate × people (solo exception); why does a contractor's pay differ per service; what happens when I approve a session; why is an invoice overdue when I never sent a reminder; how do I change the no-show fee; what does the tax CSV include and which year does a payment count in; how do I give a client portal access again after the link expired; why can't a contractor see other sessions; how do I turn off MFA for someone; what happens if I edit an approved session.

## 3. Smarter search (`search.ts`)

All client-side, extending the existing ranked search:

- **Keywords:** `article.keywords` matches score above title matches ("pay stub" → my-earnings).
- **Synonyms:** one exported `SYNONYMS: Record<string, string[]>` table applied at query time (each query term expands to itself + synonyms). Seed: bill/billing→invoice; pay/paycheck/paystub→earnings, payroll; price/cost/charge/fee→pricing, rate; 2fa/two-factor→mfa; cancel→cancellation; therapist→contractor; customer/patient/student→client; money→earnings, payroll.
- **Question stripping:** leading interrogative scaffolding ("how do i", "where is/are", "why", "what is", "can i", "do i") is removed before term matching so question phrasing ranks like keywords.
- **FAQ search:** `searchFaqs(query)` scores question text + answer + the linked article's keywords. The help page renders matching FAQs **inline with their answers, above article results** — an instant answer with no click.

## 4. FAQ surface (help landing page)

- The "Popular Articles" section (really "first 5") is replaced by **Common Questions** — an accordion of the top FAQs (curated order, first 8), expanding in place to the markdown answer + "Read more" link; a "View all questions" toggle reveals the full list grouped by category.
- FAQs respect `adminOnly` with the same filter as articles.
- Search results page: matching FAQs render as expanded inline answers above the article list.

## 5. Gap detection

**Migration `20260729_help_events.sql`** (applied by hand: dev ref first, verify, then prod — per house rules):

```sql
create table help_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  event_type text not null check (event_type in ('search_miss', 'article_feedback')),
  query text,             -- search_miss
  article_slug text,      -- article_feedback
  helpful boolean,        -- article_feedback
  created_at timestamptz not null default now()
);
-- RLS: authenticated users INSERT rows for their own org;
-- owner/admin/developer SELECT within org; no UPDATE/DELETE from clients.
```

No PHI concerns: search queries are user-typed and stored as-is, but the table is org-scoped, staff-only-readable, and queries are not clinical data; nothing is decrypted into it.

**Client behavior:**

- **Search miss:** if a query ≥3 chars still has zero article AND zero FAQ results 1.5s after typing stops, insert a `search_miss`. Deduped per session (in-memory set of normalized queries). Fire-and-forget — failures are swallowed, never surfaced.
- **Article feedback:** "Was this helpful?" 👍/👎 at the bottom of every article page; one vote per article per session (local state); writes `article_feedback`.
- **Owner card:** on the help landing page, visible only with `settings:edit` permission — "Help gaps" card listing the 10 most recent distinct unanswered searches and the articles most recently voted not-helpful. Read via the normal client with RLS; no new API route.

## 6. Contextual help

`src/components/help/page-help.tsx` — `<PageHelp article="invoice-lifecycle" />`: a ghost "?" icon button (aria-label "Help for this page") linking to `/help/<slug>/`. Placement is explicit at call sites (no route-map indirection), added to page headers of: sessions, invoices (+ scholarship tab), payments, clients, team, analytics, earnings, and each settings page/tab per the coverage matrix. The referential-integrity test validates every `article` prop resolves to a real slug.

## 7. Error handling

- All `help_events` writes are fire-and-forget with caught/ignored errors — help must never degrade the page.
- FAQ/article markdown renders through the existing `markdownComponents`; a missing `articleSlug` target in dev fails the integrity test rather than 404ing users.
- Search with an empty synonym expansion falls back to the raw term; ranking changes never throw (pure functions, unit-tested).

## 8. Testing

- **Unit (colocated in `_data/`):** `search.test.ts` — keyword boost, synonym expansion, question stripping, FAQ scoring, empty/short queries. `integrity.test.ts` — every `relatedArticles` slug, FAQ `articleSlug`, coverage-matrix slug, and `PageHelp` usage (matrix-driven) resolves; slugs unique; every article has ≥3 keywords; every category non-empty.
- **E2E `tests/e2e/help.spec.ts`:** synonym search ("bill" finds invoice articles), FAQ inline answer renders on search, article feedback buttons record without error, contextual "?" navigates from invoices page to help.
- **Manual:** content accuracy pass on all 36 articles against the running app; `help_events` inserts verified against MCA-Dev.

## Out of scope

- AI answer box (future phase; consumes this content)
- Editing help content in-app (content stays in code, single author)
- Localization, article versioning, view analytics beyond `help_events`

## Acceptance

1. Coverage matrix fully satisfied and enforced by a passing integrity test.
2. "bill", "pay stub", "how do I change the no-show fee" each surface the right result first.
3. FAQ answers render inline in search and on the landing page accordion.
4. `help_events` rows appear in MCA-Dev for a missed search and a 👎 vote; owner card lists them.
5. Lint, `tsc --noEmit`, unit tests, and the help e2e spec all green; app runs locally with the new help section.
