# MCA App — Codebase Review → Bug Hunt → UX Improvement Prompt

**How to use:** Paste everything below the line into Claude Code from the repo root (`C:\Users\lwebe\Personal\MusicTherapy`). It runs in four phases with a checkpoint after each one — review and approve before the agent continues. Phases 1–3 are read-only and safe to run in plan mode; only Phase 4 changes code. You can also run one phase per session: paste the whole prompt and say "start at Phase N, here are the prior findings."

---

You are acting as a senior software engineer and UX reviewer performing a structured audit of this codebase. Your goals, in order: (1) understand the system, (2) find and document real bugs, (3) identify UI / human-computer interaction friction in actual user workflows, and (4) deliver prioritized, incremental improvements that make the app easier for end users.

Work through the phases below **in order**, and **stop at the end of each phase for my review and approval** before continuing.

## Context (pre-filled — read before starting)

- **What this app does:** MCA App is a multi-tenant practice management system for May Creative Arts, a music/art therapy practice. It handles session logging, configurable pricing, client invoicing (email, PDF, Square), contractor payroll, monthly scholarship batch billing, and a token-based client portal. It stores PHI (session notes, client info, goals) and must stay HIPAA-conscious: PHI fields are encrypted at rest and must never be logged.
- **Who uses it:**
  - **Owner/admin** — a non-technical practice owner doing admin work (approving sessions, sending invoices, running payroll, configuring settings), mostly on desktop.
  - **Contractors** — therapists logging their own sessions, often on phones via the installed PWA, frequently right after a session ends.
  - **Clients** — therapy clients (or their caregivers) using a token-link portal with no login and zero training, to view sessions/goals/resources and request sessions.
- **Top 5 user workflows:**
  1. **Session → invoice lifecycle:** contractor logs a session (`/sessions/new/`, `SessionForm` with live pricing preview) → admin approves (`/sessions/[id]/`) → invoice generated → sent via email/PDF/Square (`/invoices/`, `/invoices/[id]/`) → payment tracked (manual mark-paid or Square webhook).
  2. **Contractor payroll:** admin reviews unpaid approved sessions per contractor in the Payroll Hub (`/payments/`), bulk-marks paid; contractors check `/earnings/`.
  3. **Scholarship batch billing:** sessions with `scholarship` payment method are grouped per client per month; admin generates batch invoices from the Scholarship tab on `/invoices/` (plus the `/api/cron/scholarship-batches` automation).
  4. **Client portal:** admin sends a portal invite from `/clients/[id]/` → client opens `portal/[token]/` → views sessions, goals, resources → requests a session → admin approves/declines the request.
  5. **Team management:** owner invites a contractor from `/team/` → contractor signs up via invite token → owner sets per-service custom pay rates on `/team/[id]/`.
- **Stack:** Next.js 16 (App Router, `trailingSlash: true`, middleware is `src/proxy.ts`), React 19, TypeScript, Tailwind 4, shadcn/ui, Supabase (Postgres + RLS + Auth), Resend (email), Square (invoices/webhooks), Upstash Redis (rate limiting), Vitest + React Testing Library, Playwright e2e, PWA with service worker.
- **How to run it locally:**
  - `npm run dev` — dev server at http://localhost:3000 (needs `.env.local` with Supabase keys; see CLAUDE.md → Environment Variables)
  - `npm run test -- --run` — unit tests (CI mode) · `npx tsc --noEmit` — type check · `npm run lint` — ESLint
  - `npm run test:e2e` — Playwright (authenticated flows need `TEST_USER_PASSWORD`)
  - Seed data: `supabase/seed-full.sql` (full org + users + sample data), `seed-sessions.sql` / `seed-invoices.sql` (bulk data for testing lists), `reset-and-seed.sql` (nuke and rebuild)
- **Out of scope / do not touch:**
  - `mca-app/` at the repo root — legacy/reference copy; all active code is in `src/`. Never read findings from it or edit it.
  - `src/components/ui/` — generated shadcn primitives. Report bugs found in them, but don't restyle or refactor them.
  - Root-level docs, screenshots, `.xlsx`/`.pdf` files, and the stray `nul` file — Windows-environment artifacts, not app code.
  - No auth-flow rewrites, framework migrations, or dependency major-version bumps.
  - Windows quirks (CRLF, `nul`, path casing) are not app bugs.

## Phase 1 — Orient (read-only)

`CLAUDE.md` is already a thorough, current architecture document. **Do not rebuild it from scratch.** Read it first, then spend this phase on two things:

1. **Verify it against reality.** Spot-check the claims that later phases depend on: the provider stack in `(dashboard)/layout.tsx`, the pricing lookup priority in `src/lib/pricing/index.ts`, the permission list in `src/lib/auth/permissions.ts`, the settings deep-merge in `src/contexts/organization-context.tsx`, and the API route table. Note any drift between docs and code.
2. **Map what CLAUDE.md doesn't cover.** Known under-documented areas: the PWA/service worker (`src/components/pwa/`, `public/`), the client session-request flow (`/api/portal/session-requests`, approve/decline routes), client resource upload/download (`/api/clients/[id]/resources/*`), the scholarship cron (`/api/cron/scholarship-batches`), quick-log/session-form defaults (`src/lib/session-form/defaults.ts`), and the walkthrough/onboarding providers (`ActivityTracker`, `WalkthroughProvider`, `OwnerOnboardingGate`, `MfaEnforcementGuard`).

Also note conventions the codebase follows (error handling style, `logger` vs `console`, server action patterns in `src/lib/actions/helpers.ts`, Zod validation in `src/lib/validation/schemas.ts`) so later changes stay consistent.

**Deliver:** a short "deltas and gaps" report — (a) where code diverges from CLAUDE.md, (b) a map of the undocumented areas above, (c) anything ambiguous, and (d) questions for me. **Make zero code changes in this phase.** Stop for my review.

## Phase 2 — Bug hunt

Systematically search for real defects across these dimensions:

- **Correctness:** logic errors, off-by-one, broken edge cases (empty input, null/undefined, max length, unicode, timezone/DST), type coercion surprises
- **Async/concurrency:** race conditions, unawaited promises, stale closures, missing cancellation, double-submits
- **Error handling:** swallowed exceptions, missing failure paths on network/IO calls, errors that leave the UI in a broken or misleading state
- **State management:** stale caches, UI/state desync, listeners and subscriptions not cleaned up, memory leaks
- **Security:** injection, XSS, CSRF, missing authorization checks on endpoints, secrets in code, path traversal
- **Performance as a defect:** N+1 queries, unbounded queries/loops, O(n²) in hot paths, missing pagination, resource leaks
- **Data integrity:** missing transactions, partial writes, idempotency gaps on retries

### Where to look first in this codebase

These are the highest-risk areas given the architecture — check each one explicitly:

1. **Multi-tenant isolation.** Every query and API route must be scoped to the caller's `organization_id`. Pay special attention to anything using the service-role client (`src/lib/supabase/service.ts`) — it bypasses RLS entirely, so its callers (webhooks, crons, the lockout route, portal endpoints) must do their own tenant scoping. A missing filter here is automatically **Critical**.
2. **Permission enforcement on the server.** `can()` from `src/lib/auth/permissions.ts` must be checked in API routes and server actions, not just used to hide buttons in the UI. Sweep `/api/**/route.ts` and `src/lib/actions/` for handlers that mutate data without a role check.
3. **PHI handling.** PHI fields (session notes, client notes, goal descriptions) must go through `encryptField()` (`src/lib/crypto/`) before storage and never appear in logs — server code must use `src/lib/logger.ts`, not raw `console.error`. Hunt for: writes that skip encryption, reads that don't handle both encrypted and legacy-plaintext values (`isEncrypted()`), PHI in error messages, query params, or audit logs.
4. **Pricing math.** `src/lib/pricing/index.ts` — duration scaling against the configurable base, contractor caps, the contractor-rate + schedule-offset lookup, scholarship flat-rate override (flat per session, NOT duration-scaled), no-show pay (flat fee, normal contractor pay), and group per-person rates. Cross-check behavior against `MCA-Billing-and-Pay-Rules.md` — a mismatch with the documented business rules is a bug even if the code is internally consistent. Money bugs here are **High** minimum.
5. **Portal token security.** `src/lib/portal/token.ts` and `/api/portal/*` — token entropy, expiry enforcement (`settings.portal.token_expiry_days`), scoping (a token must only ever expose its own client's data), and whether token comparison/lookup allows enumeration or timing leaks.
6. **Cron and webhook auth.** Every `/api/cron/*` route must verify `CRON_SECRET`; `/api/webhooks/square` must verify Square's signature before trusting the payload. Check the lockout route (`/api/auth/lockout`) for abuse potential — it's pre-auth and uses the service role.
7. **Money/state races.** Double-submit on session save and invoice send; idempotency of invoice generation (scholarship batches especially — can the same month be generated twice?); Square webhook racing a manual mark-paid; bulk actions (invoices, payroll) that partially fail and leave mixed state; `reminder_sent_days` tracking under concurrent cron runs.
8. **Timezone/date handling.** Date-only strings must go through `parseLocalDate()` (`src/lib/dates.ts`). Look for `new Date('YYYY-MM-DD')` style parsing that drifts a day, and month-boundary logic in scholarship batching and reminders.
9. **Trailing slashes.** `trailingSlash: true` is set in `next.config.ts`. Internal links, `router.push` calls, redirects, and `fetch` calls to internal API routes missing the trailing slash cause avoidable 308s or breakage.

For each finding, report in this format:

| # | Severity | File:line | What's wrong | How it manifests for a user | Suggested fix | Confidence |
|---|----------|-----------|--------------|------------------------------|----------------|------------|

Severity scale: **Critical** = data loss, security hole / tenant or PHI leak, or crash on a main path · **High** = a feature is broken or produces wrong results (including wrong money amounts) · **Medium** = degraded edge case or unreliable behavior · **Low** = minor defect.

Rules: report only **actual defects you can defend with a concrete failure scenario** — no style preferences, no "could be cleaner." If unsure whether something is a bug, put it in a separate "Needs verification" list along with the exact test or repro you'd run to confirm. Run `npm run test -- --run` and `npx tsc --noEmit` and use real failures as evidence. **Do not fix anything yet.**

**Deliver:** the findings table, the "Needs verification" list, and test/type-check output. Stop for my review.

## Phase 3 — UI / HCI and workflow audit

Walk through each of the five workflows from the Context block step by step, as the actual end user would experience them — run the app with seed data if possible (`npm run dev` + `supabase/seed-full.sql`); otherwise trace through the UI code. Remember who each user is:

- **Contractor flows** (`/sessions/new/`, `/sessions/`, `/earnings/`): judge on a phone. PWA ergonomics matter — hit-target size, keyboard types on numeric/date inputs, how fast a routine "log the session I just finished" entry is, what quick-log defaults (`src/lib/session-form/defaults.ts`) already carry forward, and what happens offline or on flaky connections (service worker behavior).
- **Owner/admin flows** (`/invoices/`, `/payments/`, `/team/`, `/settings/*`): judge for a non-technical owner. The four settings subpages (profile, business, practice, customize) are dense — can she find and understand a setting without reading code? Do bulk actions communicate partial failure?
- **Client portal** (`portal/[token]/*`): judge for someone with zero training and no login. Is it obvious what to do, does session-request give feedback on what happens next, do expired tokens fail with a helpful message?
- **Both themes:** spot-check dark mode on the main screens — it's supported (`next-themes`) and contractors on phones often have it on.

For each workflow, document:

- **Step count and waste:** every click, field, and screen required; which steps are redundant, could be defaulted, batched, automated, or removed entirely
- **Feedback and status:** where the user waits with no loading/progress indicator; where actions succeed or fail silently; what empty states look like
- **Error recovery:** whether error messages say what went wrong and what to do next; whether form input survives a failed submit
- **Destructive actions:** are they confirmable, and better yet, undoable? (undo beats a confirm dialog)
- **Forms:** validation timing (inline vs. only on submit), unclear labels, missing sensible defaults, no autofocus, tab order
- **Recognition over recall:** any place the user must remember or retype an ID, code, or value the UI could display, autocomplete, or carry forward
- **Consistency:** the same action looking or behaving differently on different screens (e.g., session status changes vs. invoice status changes)
- **Keyboard and accessibility basics:** focus order, labels on inputs, contrast (both themes), hit-target size, Enter-to-submit
- **Information hierarchy:** is the most important info/action the most prominent thing on each screen?

For each workflow, answer: **"What is the minimum number of steps a competent user should need here, and what's stopping us from getting there?"**

**Deliver:** a friction list per workflow — location, problem, user impact, and a concrete proposed change (with before/after step counts where relevant). **Still no code changes.** Stop for my review.

## Phase 4 — Prioritize and implement

- Merge Phases 2–3 into a single backlog ranked by **user impact vs. implementation effort**, with quick wins (high impact, low effort) flagged at the top. Security/PHI/tenant-isolation findings outrank everything at the same effort level.
- **Wait for my approval on which items to do.** Then implement as **small, reviewable changes** — one bug fix or one UX improvement per commit, with a Vitest regression test for every bug fixed.
- Repo-specific definition of done for every change:
  - `npm run lint`, `npx tsc --noEmit`, and `npm run test -- --run` all pass before you claim it's done.
  - Any user-facing change (feature, behavior, setting, UI) updates the relevant help article in `src/app/(dashboard)/help/_data/help-articles.ts` — this is a standing repo requirement.
  - New business rules go in `organization.settings` JSONB (with defaults deep-merged in `OrganizationContext`), never hardcoded.
  - Server-side logging uses `src/lib/logger.ts`; new PHI fields go through `src/lib/crypto/`.
  - New/changed routes respect `trailingSlash: true`.
- Preserve existing behavior except where a change was explicitly approved. No broad rewrites, no framework migrations, no drive-by refactoring.
- After each change, state exactly how to verify it manually in the UI (page, steps, expected result), assuming seeded local data.

## Ground rules (all phases)

- Cite specific files and line numbers for every finding (`file:line`).
- Verify before asserting — run the app and tests when possible instead of guessing from reading.
- Ask me rather than assume when product intent is ambiguous; `MCA-Billing-and-Pay-Rules.md` is the source of truth for billing/pay questions before asking.
- Never read findings from or make changes in `mca-app/` — it's a stale copy and will produce false positives.
- Never paste PHI-looking sample data (real names, notes) into findings; use the seed data's fake records.
- Lead every report with the most important findings; keep it skimmable.
