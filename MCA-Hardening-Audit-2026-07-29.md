# MCA App — Hardening & Bug-Hunt Findings (2026-07-29)

Session goal: harden the site, find bugs, test the app, merge Dependabot updates, identify help gaps.
This file records **what was fixed**, **what was found but deliberately not fixed yet**, and the recommended order for the remainder. Verified findings only — every item below was traced to code by a reviewer and re-verified before listing.

## Shipped this session

**Dependencies (PR #117 + 5 workflow PRs, merged):** next 16.2.12 (9 advisories), sharp 0.35.3 override (4 libvips CVEs), undici/axios/js-yaml/form-data/esbuild security bumps, radix + supabase + dev-deps minors, codeql-action 4.37, actions/checkout v7. `npm audit`: clean except brace-expansion (below). Held: eslint 10 (PR #91, major) and @supabase/ssr 0.12 (0.x on the auth path — review separately).

**Hardening batch (branch `harden/2026-07-goal`):** format-string-safe logger (CodeQL), CSV formula-injection neutralization in both CSV exports, `revokeAccessToken` scoped to client (cross-tenant IDOR), `removeTeamMember` gated on `team:manage` + developer-target block, org-scoped scholarship queries (developer-role "Generate All" stamped other tenants' batches with the caller's org), portal API moved off the 5/60s auth rate bucket, session-reminder emails decrypt notes (they emailed `enc:<ciphertext>`) + HTML-escape all user strings, invoice-reminder cron query bounded (backlog starved newer invoices).

**Correctness batch (same branch):** Payroll Hub displays `sessions.contractor_pay` (exactly what `mark_sessions_paid` snapshots — Hub, Mark-Paid dialog, Tax Summaries, Earnings now always agree), analytics org-scoped (developer saw all tenants summed), earnings View-As race guard, lockout success-resets-failure-window (+2 regression tests), portal/overdue/reconciliation local-date fixes, access-token expiryDays clamped 1–365.

**Docs:** six help articles corrected to match actual behavior (goals, portal invites, session requests, member removal, admin financial visibility, revision naming, MFA scope, export dialog).

## Open findings — prioritized

### P0 — money/PHI correctness, needs a real design decision

1. **Draft → submit never creates an invoice.** **Fully documented with production proof in `docs/bugs/2026-07-29-missing-invoice-on-resubmit.md`** — read that, not this summary. Confirmed impact: **1 session, $90, unbilled since 2026-03-18**; the revision flow has been used 11 times, 10 of those sessions were later deleted, and the 1 that was resubmitted hit the bug (100% of exercised cases). Audit-log trail proves the sequence end-to-end. Note: an earlier "$450 / 7 sessions" reading was **wrong** — 6 of those are scholarship clients skipped by design (they surface a separate problem: their batch invoices have not been generated since February). Fix: extract invoice creation from `createNewSession` into an idempotent `ensureSessionInvoices()` called on the edit path's draft→submitted transition, plus a manual "Create invoice" action for recovery.
2. **Configured account lockout is unenforceable.** The browser calls `supabase.auth.signInWithPassword` directly against Supabase — the lockout check/record fetches are separate browser calls an attacker simply skips. Fix requires moving the credential exchange server-side (route handler or server action that checks lockout, calls Supabase, records the attempt) — auth-flow surgery, test carefully. Until then only Supabase's own hosted rate limit protects login.
3. **`require_mfa` is decorative for never-enrolled users.** Proxy only steps up users who already HAVE a factor (`nextLevel==='aal2'`); a user who never enrolls gets a full aal1 session that passes every RLS policy, and the only block is a client-rendered card. `GET /api/sessions/export/?format=json` then returns org-wide decrypted staff notes. Fix: server-side enforcement — when org requires MFA and the role is privileged, block sensitive routes (or all dashboard/API routes) at aal1 without an enrolled factor.
4. **`paid_date`/`contractor_paid_date` are stamped in server UTC.** Marking paid at 9 PM ET on Dec 31 records Jan 1 — wrong cash-basis tax year (feeds Tax Summaries + annual PDFs). `organizations.timezone` exists, has a settings UI, and is read by NOTHING. Fix: a `todayInOrgTz(timezone)` helper used at every date-stamp site (`src/app/actions/invoices.ts`, Square webhook, mark-paid path).

### P1 — visible wrong numbers

5. **Admin-work sessions price with the logged-in user's rates, not the selected admin's** (`session-form.tsx`: rates fetched for `effectiveContractorId`, session written with `selectedAdminUserId`). Colleen's $25 admin rate is ignored when the owner logs it for her.
6. **Batch (scholarship/monthly) contractor pay is invisible in Payment History** — batch invoices have `session_id: null`, so the grouping drops them; "Total Contractor Earnings" undercounts. Needs attribution via `invoice_items → sessions` (a batch can span contractors).
7. **A no-show for a scholarship/monthly client is never billed** (no pending invoice to reprice; batch queries only pick up submitted/approved) while the contractor still gets paid. Decide: include `no_show` in batch pickup at the no-show fee, or exclude no-show pay for batch clients.
8. **Scholarship cron covers less than the manual path**: filters `payment_method='scholarship'` only (misses `billing_frequency='monthly'` clients and `is_scholarship` service types), omits `due_date` (those invoices can never go overdue or get reminders) and the per-client `apply_square_fee` snapshot.
9. **Overdue dunning never fires on defaults**: gated on `reminder_days.includes(0)` but the default is `[7,1]` and nothing documents that 0 enables it. Product call: make the overdue notice unconditional (still once-ever via the -1 claim) or document the 0.
10. **Payment History semantics**: "Paid Out" means the client paid the invoice, not that the contractor was paid; "Sessions" counts invoices (a 4-client session counts 4). Relabel or rebase on `contractor_paid_*`.
11. **PostgREST row-cap truncation on money views** (same class the payroll routes fixed): analytics totals, payments history, dashboard pending amount, sessions list (client-side filters over a capped array), sessions export, reconciliation summary. Paginate or aggregate server-side as each is touched.

### P2 — worth scheduling

12. **Orphaned but fully-built admin components** (help audit): `ClientPortalAccess` (portal invite/regenerate/revoke for existing clients), `SessionRequestsManager` (portal requests are currently invisible to staff), `ClientResourcesManager` (resources unreachable). Wiring these in is the fastest feature win in the codebase — the backends and components already exist.
13. **Portal magic link with a shared email** resolves to an arbitrary client (`.limit(1).single()`, no unique constraint, org not passed at the request-link call site) — group-home coordinators with one email across clients get a random child's portal.
14. **Analytics counts drafts/cancelled as delivered sessions** (status filter product call), reconciliation search has no debounce/race guard, dashboard cards total only their first 10–20 rows while reading as org-wide totals, "Mark Paid (Venmo)" is indistinguishable from "Mark as Paid" in data.
15. **brace-expansion advisory (GHSA-mh99-v99m-4gvg)**: only patched in 5.0.8, which breaks minimatch v3 (crashes eslint) — no v1/v2 backport exists yet. Not exploitable here (glob patterns are developer-authored). Clears for the dev chain when eslint 10 lands; watch for upstream exceljs/archiver updates for the prod chain.
16. **Latent UTC date parses that only bite off Vercel-UTC** (email lib, invoice send, client detail server component) — harmless today, break the day anyone sets a server TZ; align with `parseLocalDate` when touched.
17. Minor: `validateAccessToken` writes `last_accessed_at` every call → 4 audit rows per portal page view; `formatInvoiceNumber` (8 hex chars) collision risk against Square's unique invoice numbers; `use-contractor-rates` doesn't clear stale rates when switching to a contractor without custom rates.

### Accepted / not actionable

- CodeQL "trivial conditional" warnings (benign React guards) and unused-variable notes.
- Admin role lacking `payments:view`/tax access — intentional per permissions design.
- PDF page-break header orphaning — matches house pattern.
- ~~Rate limiting inert without Upstash env vars~~ — **RESOLVED 2026-07-29**: confirmed via `vercel env ls` that no Upstash vars existed (all rate limiting was silently disabled in production). Provisioned the Vercel Marketplace "Upstash for Redis" resource `mca-rate-limit`, which injects `KV_REST_API_URL`/`KV_REST_API_TOKEN`; `src/lib/rate-limit.ts` now falls back to those names. Verified live in prod: the 6th `/login/` request within 60s returns 429. Note this makes P0 #2 (unenforceable lockout) less acute but does NOT fix it — Supabase auth is still called directly from the browser, bypassing the app entirely; the proxy limit only covers requests that actually hit Next.js.
