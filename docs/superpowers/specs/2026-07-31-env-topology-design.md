# Environment topology: cert as a true prod mirror, local as the experiment

**Date:** 2026-07-31
**Status:** approved, implementing

## Problem

`.env.local` points at cert (`gzrukevymmguqxuoynqk`). Every local experiment therefore writes into
the environment that is supposed to faithfully represent production, and real cert testers
(Amara, Chelsea) are working in that same database. Cert cannot be both a mirror and a sandbox.

Two concrete symptoms observed 2026-07-31:

- The cert rebuild deleted `dev-owner@maycreativearts.test`, so `tests/e2e/helpers.ts`'s default
  credential resolves to a non-existent account and 38 of 53 Playwright specs fail in `login()`.
  With a cert-tester credential the same specs go 44/44 — the suite was never broken, its target was.
- `session-creation.spec.ts` and `session-resubmit-invoice.spec.ts` have **never been run**, because
  the only available target held real PHI and live financial records.

A third cloud Supabase project was previously declined on cost. That constraint stands.

## Decisions

| # | Decision |
|---|---|
| 1 | Local experiment DB = **local Supabase stack** via Docker (`supabase start`). Free, offline, resettable, no PHI. |
| 2 | **Port `scripts/cert-refresh/` to main** (7 commits, near-entirely additive). |
| 3 | Local gets **prod schema-only dump + `dev-seed` fake data**. Never real data. |
| 4 | Cert accepts writes from **human testers and read-only automated runs** only. |

## Architecture

```
PROD  ysmwowzxkgisshaormmf
  |
  +-- schema + data ----> CERT  gzrukevymmguqxuoynqk   (mirror; humans test here)
  |                              ^ Vercel Preview/Development
  |
  +-- schema ONLY ------> LOCAL  supabase start @ 127.0.0.1:54321
                                 + dev-seed fake data
                                 ^ npm run dev, experiments, mutating e2e
```

Data flows one way, downward. Nothing flows back up. Cert receives prod's data; local receives
only prod's *shape*. **Local is the only environment anything is allowed to break.**

Vercel Production stays on prod. Vercel Preview/Development stay on cert.

## Components

### `scripts/cert-refresh/` (ported from `feat/cert-environment`)

The prod → cert mirror. Already verified repeatable (two runs converge, 13/13 checks). Modes:
`--preflight | --full | --data-only | --overlay <name>`; destructive modes require `--confirm <today>`.

### Local bootstrap

Brings up a local stack and makes it usable:

1. `supabase start` (Docker).
2. Apply a **schema-only** dump captured from prod.
3. Apply the `scripts/dev-seed/` scenario dataset (~300 sessions, ~260 invoices, deterministic).
4. Recreate `dev-owner@maycreativearts.test` and `dev-contractor@maycreativearts.test` with
   `TEST_USER_PASSWORD`, org `require_mfa = false`.

**Critical reuse:** `pg_dump --schema=public` does NOT carry the `on_auth_user_created` trigger or
the 8 `storage.objects` policies — this bit the cert build and had to be captured separately. The
local bootstrap MUST reuse cert-refresh's existing capture logic. Without it local looks correct
while silently lacking auth-user creation and file uploads.

### Environment variables

`.env.local` points at **local** by default. Cert and prod remain reachable only through
explicitly-named `CERT_*` / `PROD_*` variables consumed by scripts — never by repointing
`NEXT_PUBLIC_SUPABASE_URL`. This is the single change that stops local work reaching cert.

Local `ENCRYPTION_KEY` is its own throwaway key, never prod's.

## Guardrails

Marker-based, extending the pattern `dev-seed` already uses:

| DB | Marker | Seed / experiment scripts |
|---|---|---|
| local | `mca_local.marker` | allowed |
| cert | `mca_cert.marker` | refuse |
| prod | neither | refuse |

Refusal is fail-closed: a script that cannot positively identify a local marker does not run.

Playwright's default config targets local. `playwright.prod.config.ts` and the cert config are
explicit opt-in files. The two mutating specs run against local only.

## Testing

| Environment | Expected |
|---|---|
| local | **Full 51-test suite green, including the two mutating specs** (the success criterion) |
| cert | read-only 44 subset |
| prod | 28 subset; auth-page specs permanently excluded (prod 429s them by design — measured: HTTP 429 after ~2 requests/60s) |

## Risks

- **Docker Desktop install** — needs admin rights and possibly a reboot; a one-time user action.
- **Schema drift** — the prod schema dump must be re-captured whenever a migration lands. Folded
  into the migration workflow rather than left to memory.
- **Local Supabase keys differ** from cloud; `.env.local` must carry the local anon/service keys.

## Out of scope

- Merging `feat/pay-config-simplification` (the `service_rates` engine). It is a separate branch;
  its migration is correctly unapplied to prod because the code is not on `main`.
- Changing prod's Square sandbox status or the `client_portal` feature flag.
