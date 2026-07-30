# Dev Portal: Tests section + functional smoke checks

**Date:** 2026-07-30
**Status:** design approved, not yet implemented

## Problem

The dev portal answers "is the environment configured?" but cannot answer "does
the app actually work?". Two concrete gaps:

1. **No test visibility.** Unit and e2e results only exist in a terminal. There
   is no single place to see whether everything is green.
2. **Presence checks masquerade as health checks.** `/api/health` reports
   `email: pass` when `RESEND_API_KEY` merely *exists*. On 2026-07-29 that green
   check hid a total email outage: the sender domain `rattatata.xyz` had been
   registrar-suspended, so Resend rejected every send with
   `403 domain is not verified`. Resend's own log showed the last successful app
   email was **2025-12-13** — seven months of silent failure behind a passing
   check. The endpoint sweep did not catch it either: it counts a `401` as PASS,
   so it "covers" the PDF and email routes while asserting nothing about whether
   they produce anything.

The fix for (2) is checks that assert on **artifacts**, not on config.

**Three flavors of false green, all observed in one 24-hour window** — the
pattern is broader than any single endpoint, which is why the fix is a suite
rather than a patch:

| Signal | Reported | Reality |
|---|---|---|
| `RESEND_API_KEY` present | `email: pass` | every send 403 — sender domain de-verified |
| Endpoint sweep hits a protected route | PASS on `401` | says nothing about whether the route produces anything |
| `GET /v1/models` authenticates (200, 11 models) | key looks healthy | every completion 400 — no credit balance |

The third is the instructive one: it is the *authenticated, free, obvious* probe
for an API key, and it stays green through a total outage. Cheapness and
authentication are not evidence of health — only exercising the real path is.

## Non-goals

- Running tests in CI (GitHub Actions already does; this is a local tool).
- Replacing the terminal. `npm run test` stays the primary interface.
- Any production surface. Everything here is dev-only.
- Coverage reporting or per-test history.
- PHI encrypt/decrypt round-trip check — considered and explicitly declined.

## Suites

| Suite | Command / mechanism | Approx |
|---|---|---|
| `unit` | `npx vitest run --reporter=json` | ~17s |
| `smoke` | `GET localhost:3000/api/dev/smoke/` + direct Resend and Anthropic probes | ~3s |
| `e2e-quick` | `npx playwright test --grep @smoke --workers=1 --reporter=json` | ~15s |
| `e2e-full` | `npx playwright test --workers=1 --reporter=json` | ~2–4min |

`--workers=1` always: the suite is only reliably green serially, because tests
share one dev organization's data.

Splitting `e2e-quick` from `e2e-full` keeps the everyday "is it broken?"
question fast without hiding the full suite behind a tag.

## Architecture

The portal already shapes every section as an on-demand `GET` returning JSON
that `public/app.js` fetches, and already spawns child processes (`external.mjs`
runs `gh` via `execFile`). This design follows both patterns rather than
introducing new ones.

```
POST /api/tests/run {suite}  -> spawn child, return {runId} immediately
GET  /api/tests              -> state of all four suites
app.js polls GET every 1s while any suite is running
```

Background-run-plus-poll was chosen over SSE (a transport the portal lacks, and
a page reload drops the stream — heavy machinery to animate three numbers) and
over a synchronous request (a 2–4 minute e2e run holding an HTTP connection
open, with no progress and total loss of visibility on reload).

### Run state

Held in memory per suite, with the last completed result persisted to
`data/tests.json` so it survives a portal restart:

```js
{
  suite: 'unit',
  status: 'idle' | 'running' | 'pass' | 'fail' | 'error' | 'skip',
  passed: 412, failed: 0, total: 412,
  durationMs: 17240,
  startedAt, finishedAt,
  sha: 'f6ba5d8', dirty: true,     // what the result is actually about
  failures: [{ name, message }],   // capped at 20
  runId: 'unit-1753849200000',
}
```

`sha` + `dirty` exist so a green badge from three commits ago reads as stale
rather than reassuring — the same failure mode as the health check above.

## App-side additions

### `src/app/api/dev/smoke/route.ts`

Dev-only: returns 404 when `NODE_ENV !== 'development'`, mirroring the existing
`/api/dev/errors/` relay. Runs the checks in-process and returns
`{ checks: [...] }`. Never 500s — a thrown check becomes a `fail` entry.

In-process was chosen over Playwright (slow, and duplicates the e2e button's
coverage) and over the portal forging a `@supabase/ssr` auth cookie (depends on
that library's private cookie format; it would break on upgrade and look like an
app failure rather than a tooling one).

The tradeoff accepted: this verifies generation logic against real data, not the
HTTP + auth + client-download chain. That chain is covered by the e2e suite,
including `tests/e2e/invoice-pdf-download.spec.ts`.

### `src/lib/dev/smoke-checks.ts`

Each check returns `{ name, status, detail, ms }` and never throws.

| Check | Method | Pass condition |
|---|---|---|
| `invoice-pdf` | newest dev invoice → `fetchInvoicePdfData` → `renderToBuffer(InvoicePDF)` | first 5 bytes are `%PDF-` **and** length > 1000 |
| `sessions-csv` | `buildSessionsExportCsv` (see below) over real rows | header row present **and** ≥1 data row |
| `tax-summary-csv` | `buildSummaryCsv` from `@/lib/payroll/annual-summary` | header present **and** every data row has the same field count as the header |
| `email-sender` | `POST api.resend.com/emails`, `from` = the app's real address, `to: ['delivered@resend.dev']` | HTTP 200 (403 ⇒ sender domain unverified) |
| `ai-help` | `POST api.anthropic.com/v1/messages`, the app's own model, `max_tokens: 1`, `thinking: {type: 'disabled'}` | HTTP 200 (400 ⇒ no credit balance) |

Notes:

- The byte-length floor on `invoice-pdf` is load-bearing: an empty or truncated
  file still begins with `%PDF-`.
- Each data-dependent check reports `skip` (never `fail`) when its fixture is
  absent — no invoices for `invoice-pdf`, no sessions for `sessions-csv`, no paid
  sessions in the target year for `tax-summary-csv`. An empty database is not a
  broken app, and a check that cries wolf on a fresh clone gets ignored.
- **`ai-help` must make a real inference call.** `GET /v1/models` is authenticated
  and free, which makes it the obvious probe and the wrong one: on 2026-07-30 it
  returned `200` with 11 models listed while every actual completion failed
  `400 — "Your credit balance is too low to access the Anthropic API"`. A
  models-list check would have reported healthy through the whole outage. One
  token on the cheapest path is the smallest probe that distinguishes
  *key is valid* from *key can do work*. Read the model from `HELP_AI_MODEL`
  exactly as `src/lib/help/ai.ts` does, so the check follows the app rather than
  pinning its own. Disable thinking: on `claude-sonnet-5` adaptive thinking is
  the default and would share the 1-token cap.
- Reports `skip` when `ANTHROPIC_API_KEY` is unset — the feature is designed to
  hide itself in that case, so absence is a valid configuration, not a fault.

### The `configured` ⇒ `works` invariant

Two endpoints advertise a capability to the UI purely from the presence of an
env var:

| Endpoint | Reports | Actually checks |
|---|---|---|
| `/api/help/chat` (GET) | `{configured: <bool>}` | `!!process.env.ANTHROPIC_API_KEY` |
| `/api/health` | `email: pass` | `!!process.env.RESEND_API_KEY` |

A missing key is the *safe* state — the feature hides itself and nothing looks
broken. The dangerous state is **present but unusable**: `configured: true`
makes the Ask-the-AI panel and bubble appear to every user, and then every
question fails. That is strictly worse than the feature being invisible, and
neither endpoint can distinguish the two.

So the smoke suite asserts the implication, not just the parts: for each such
capability, if the presence check reports available, the corresponding real
probe must succeed. A green presence check paired with a failing probe is
itself the finding, and it is the specific shape of every false green this
suite exists to catch — a revoked key, an exhausted credit balance, a
de-verified sender domain. All three leave the env var perfectly intact.
- `delivered@resend.dev` is Resend's simulator address. No human ever receives
  these probes, so the check is safe to run repeatedly.
- `email-sender` reads `EMAIL_FROM_DOMAIN` exactly as `getFromAddress()` does,
  so it tests the address the app would really send from — including the
  hardcoded fallback. If `RESEND_API_KEY` is absent (the normal dev state, where
  it is deliberately unset) the check reports `skip`, not `fail`.

### `src/lib/sessions/export-csv.ts` (extraction)

`/api/sessions/export/route.ts` builds its CSV inline. Extract
`buildSessionsExportCsv(rows, ...)` so the route and the smoke check share one
builder — otherwise the check re-implements the logic and passes while the real
export is broken. Matches the repo convention of business logic in `src/lib/`
with a colocated test.

The tax-summary equivalents (`buildSummaryCsv`, `buildDetailCsv`) are already
exported and need no change.

**Out of scope:** the payroll XLSX exports
(`payroll-hub-table.tsx`, `contractor-payments-table.tsx`) build workbooks
client-side with ExcelJS and cannot run in-process. Their download path is
covered by `src/lib/download.test.ts` and the e2e suite.

## Portal-side additions

| File | Change |
|---|---|
| `tools/dev-portal/lib/tests.mjs` | new — spawn, reporter parsing, run-state registry, concurrency guard, timeouts |
| `tools/dev-portal/lib/store.mjs` | add `tests.json` read/write alongside `errors.json` / `history.json` |
| `tools/dev-portal/server.mjs` | add `POST /api/tests/run` and `GET /api/tests` |
| `tools/dev-portal/public/index.html` + `app.js` + `styles.css` | Tests card, four buttons, poll loop, failure detail |
| `tools/dev-portal/README.md` | document the section and the smoke checks |

No `.gitignore` change is needed: `/tools/dev-portal/data/` is already ignored
wholesale (`.gitignore:45`) and nothing in it is tracked, so `tests.json` is
covered the moment it is written.

## Error handling

**`error` is a distinct status from `fail`.** `fail` means a test failed —
the app is broken. `error` means the tooling broke: runner missing, reporter
output unparseable, process killed, timeout. Each carries a stderr tail.
Conflating them is how a red badge becomes something you learn to ignore.

- **Dev server down** → `smoke` reports `skip` ("dev server not reachable on
  :3000"), never `fail`.
- **Concurrency** → one run per suite; `unit` and any e2e suite never run
  simultaneously (both touch the dev server and the shared dev org). A second
  click while a suite is active returns the in-flight `runId` instead of
  starting a race.
- **Timeouts** → `unit` 120s, `e2e-quick` 120s, `e2e-full` 600s, `smoke` 30s.
  On expiry: kill the child, status `error`.
- **Secrets** → the Resend key, DB passwords and `TEST_USER_PASSWORD` must never
  reach portal output. Reporter stdout is parsed for counts and failure names,
  and any captured stderr is scrubbed of `re_[A-Za-z0-9_-]+` before display.
- **Zero dependencies** preserved: Node 20+ builtins only, consistent with the
  rest of the portal.

## Testing

| Target | Test |
|---|---|
| `src/lib/dev/smoke-checks.ts` | colocated unit test, dependencies mocked — each check's pass **and** fail branch |
| `src/lib/sessions/export-csv.ts` | colocated unit test (header, escaping, empty-rows case) |
| `tools/dev-portal/lib/tests.mjs` | reporter parsing against captured vitest + playwright JSON fixtures — the piece most likely to break silently on a runner upgrade |

**Non-vacuity is required, not optional.** Every check must be observed failing
when its subject is broken before it is considered done — e.g. point
`EMAIL_FROM_DOMAIN` at an unverified domain and confirm `email-sender` goes red.
A check that has never failed has not been shown to check anything. This is the
direct lesson of 2026-07-29, where both a health check and a first draft of an
e2e spec reported success while asserting nothing.

## Success criteria

1. `npm run portal` shows a Tests card with four suites and last-known results.
2. Each button runs its suite; results appear without a page reload; a reload
   mid-run resumes showing progress.
3. A failing test shows its name and message, not just a count.
4. Results display the SHA they ran against and mark a dirty tree.
5. Breaking PDF generation turns `smoke` red; reverting turns it green.
6. Breaking the email sender domain turns `smoke` red — the outage that started
   this work would now be caught.
7. An exhausted Anthropic credit balance turns `smoke` red while
   `/api/help/chat` still reports `configured: true` — the `configured` ⇒ `works`
   invariant is what catches it.
8. Tooling failure reads as `error`, never as `fail`.
9. Nothing in this design is reachable in production.
