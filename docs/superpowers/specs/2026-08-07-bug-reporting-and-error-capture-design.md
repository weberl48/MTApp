# Bug reporting and production error capture

**Date:** 2026-08-07
**Status:** approved, implementing

## Problem

Three gaps, all of which mean a broken app stays broken until someone complains:

1. **No way for a user to report a bug.** A contractor who hits a wall has no channel except texting the owner.
2. **Frontend errors are captured in development only.** `DevErrorReporter` hooks `window.onerror`, `unhandledrejection` and `console.error`, but it is mounted behind `NODE_ENV === 'development'` and posts to a LAN-only dev portal. In production a React crash or a failed fetch is recorded nowhere.
3. **The error boundaries swallow crashes.** `(dashboard)/error.tsx`, `(auth)/error.tsx`, `(portal)/error.tsx` and `global-error.tsx` render an apology and log nothing.

Backend capture already works: `logger.error()` writes PHI-safe `{name, message}` rows to `public.app_errors` in production (migration `20260803_app_errors.sql`), and the dev portal pulls them over the Management API. This design extends that spine rather than replacing it.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Who reviews the data | The developer, in the existing LAN dev portal | No in-app review surface to build, no consumer-side RLS work |
| Who can file a report | Logged-in staff only | Portal clients are token-auth'd and unauthenticated; an anonymous ingest path is a separate abuse surface |
| Context captured | Full, including an optional user-attached screenshot | Maximum reproducibility, accepted PHI cost, mitigated below |
| Frontend error transport | Authenticated app route → `app_errors` | Reuses the existing reporter and its tested throttle; honours the migration's "no browser writes" rule; adds no subprocessor |
| Triage | Auto-filed GitHub issue in a **new private** repo | GitHub is the worklist; assignment and commit-linking come free |
| Issue contents | Pointer only — zero user free text | Free text will contain client names; GitHub has no BAA here |

Rejected: Sentry and equivalents (a new subprocessor holding PHI-bearing error text, needing a BAA, and outside the portal that is the agreed pane of glass). Rejected: direct browser inserts under an RLS policy, the way `help_events` works — errors are far chattier than help events and RLS gives no rate limiting.

## The PHI boundary

This is the load-bearing constraint. **The repo is public and cert holds real production data**, so the rule is that PHI never leaves Supabase.

- `bug_reports.description` is user-authored free text and **will** name clients. It is encrypted at rest with `encryptField()`, exactly like `sessions.notes`.
- Screenshots are PHI outright — a capture of the sessions list is a client roster. They live in a **private** Storage bucket reached only through short-TTL signed URLs.
- **The GitHub issue is a pointer, not a copy.** Its body carries only generated fields: report id, route *pattern*, role, browser, viewport, app commit, and the buffered JS errors (already the PHI-safe shape). The title is generated too. No user-typed character reaches GitHub, so there is no redaction that can silently fail.
- `app_errors` stays deliberately anonymous — no `user_id`, no `organization_id` — as its migration intends. Frontend rows just start arriving with `source = 'frontend'`.

Consent for the screenshot is real rather than nominal: it is opt-in per report, the user picks a file they already took and can therefore already see, and the dialog previews it with a remove button before submit.

Two residual risks, accepted and recorded:

- The dev portal has **no authentication**. Anyone on the LAN — including the Pi mirror at `192.168.1.160:4321` — can view bug reports and their screenshots. Acceptable for a private LAN; it would not be acceptable if the portal were ever exposed.
- CI (`no-real-data.yml`) already rejects tracked `.png`/`.jpg` outside `public/` and base64-inlined images, so a screenshot cannot reach the public repo by accident. No change needed; this design depends on that guard staying.

## Data model

### `bug_reports` (new)

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL` PK | The human-facing report number used in the issue title |
| `created_at` | `TIMESTAMPTZ` | |
| `organization_id` | `UUID` → `organizations` | |
| `user_id` | `UUID` → `users`, nullable, `ON DELETE SET NULL` | Attributed on purpose — a follow-up question is the point. A departing contractor does not take their reports with them |
| `user_role` | `TEXT` | Snapshotted; roles change |
| `environment` | `TEXT` | `production` / `preview` |
| `description` | `TEXT NOT NULL` | **PHI-encrypted** |
| `route_pattern` | `TEXT` | `/invoices/[id]/` — the only location field GitHub sees |
| `url` | `TEXT` | Raw, with real ids. Stays in Supabase |
| `user_agent`, `viewport`, `app_commit` | `TEXT` | `app_commit` pins the report to a deploy |
| `recent_errors` | `JSONB` | Last few client-buffer entries, PHI-safe `{kind, message}` shape |
| `screenshot_path` | `TEXT` | Storage key; null when none attached |
| `github_issue_number` | `INTEGER` | Null if filing failed — the report still lands |
| `github_issue_url` | `TEXT` | |

Indexed on `created_at DESC`; the portal only ever asks for "most recent N".

**RLS.** No INSERT policy at all: `description` needs the server-only `ENCRYPTION_KEY`, so writes go through a server action using the service client, per CLAUDE.md's rule for browser-written PHI. SELECT is developer/owner only, mirroring `app_errors`.

### `bug-screenshots` (new private Storage bucket)

Path `<org_id>/<uuid>.<ext>`. `image/png|jpeg|webp` only, 5 MB cap, no public policy — mirroring the existing `client-resources` upload route.

### `app_errors` — unchanged

Retention: `prune_bug_reports()` deletes screenshots' rows at 1 year and clears `screenshot_path` at 90 days, alongside the existing `prune_app_errors()` 30-day sweep. A GitHub issue outlives the row it points at, so an old closed issue's link will 404 — intended, but it means issues should be closed before their row ages out.

Both objects are applied **by hand, cert first then prod** — this project is not `supabase link`ed.

## Components

### Capture: the report itself

- `src/lib/bug-reports/route-pattern.ts` — `toRoutePattern(pathname)`, replacing UUIDs and numeric segments with `[id]`. Pure, unit-tested; it is the function that keeps real record ids out of GitHub.
- `src/lib/bug-reports/github-issue.ts` — `buildIssueTitle()` / `buildIssueBody()`, pure and unit-tested with an explicit test that no free text can appear; plus `fileBugIssue()` doing the REST call. Never throws — a GitHub outage must not lose the report.
- `src/app/actions/bug-reports.ts` — `submitBugReport(FormData)`: authenticates, validates with zod, uploads the screenshot, encrypts the description, inserts the row, then files the issue and patches the number back.
- `src/components/bug-report/bug-report-dialog.tsx` — description textarea, optional screenshot picker with preview and remove, and a collapsible "what gets sent" disclosure so the capture is never a surprise.
- Entry points: the avatar menu, under Help Center; and a "Report this" button on every error boundary, pre-filled with the digest.

### Capture: error telemetry

- `src/lib/errors/report.ts` — the existing `src/lib/dev/error-report.ts` moved out of `dev/` and renamed, since it now runs in production. `createReportGate` and `consoleArgsToMessage` are unchanged, and their existing tests move with them.
- `src/lib/errors/client-buffer.ts` — a small session-scoped ring buffer of recent client errors so a bug report can attach what just went wrong. Pure, unit-tested.
- `src/components/errors/error-reporter.tsx` — the promoted `DevErrorReporter`, mounted unconditionally. In development it forwards to the portal as today; in production it posts to `/api/errors/`. Feeds the ring buffer in both.
- `src/app/api/errors/route.ts` — POST, requires an authenticated staff session, runs `apiRateLimit`, validates a tight zod schema, truncates, and writes to `app_errors` with the service client.
- The four error boundaries report their crash and offer "Report this".

### Review: the portal

- `src/app/api/bug-reports/route.ts` — GET, gated by the `CRON_SECRET` bearer through the existing `verifyBearerSecret`, exactly as `/api/health` detail is. Returns decrypted descriptions and freshly-minted signed screenshot URLs.
  Reading through the app rather than the Management API is deliberate: the app already owns `ENCRYPTION_KEY` and the crypto helpers, so the portal never gets a second copy of them to drift from.
- `tools/dev-portal/lib/bug-reports.mjs` + a `GET /api/bug-reports` route + a Bug Reports panel, mirroring `prod-errors.mjs`.

## Testing

Unit tests colocated per repo convention: `route-pattern.test.ts` (id shapes, trailing slashes, no leakage), `github-issue.test.ts` (the no-free-text guarantee, missing-field tolerance), `client-buffer.test.ts` (cap, ordering, redaction), and the relocated `report.test.ts`. Manual verification against local: file a report, confirm the row, the encrypted description, the screenshot, and the issue.

## Out of scope

Anonymous reports from the client portal; in-app review UI; alerting or digests; error grouping and fingerprinting; source-map symbolication of production stack traces.
