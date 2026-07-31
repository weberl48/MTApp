# Local experiment environment

The environment you are allowed to break.

| Environment | Holds | Who writes to it |
|---|---|---|
| **prod** `ysmwowzxkgisshaormmf` | the business | the business |
| **cert** `gzrukevymmguqxuoynqk` | a mirror of prod, **real PHI** | human testers; read-only automated runs |
| **local** `supabase start` | prod's *shape* + fake data | you, freely |

Data flows one way, downward. Nothing flows back up. Design record:
`docs/superpowers/specs/2026-07-31-env-topology-design.md`.

## Prerequisites

- **Docker** (Docker Desktop on Windows) — `supabase start` cannot run without it.
- A prod schema capture. Reused from the cert toolset, and it is **schema-only**:

```bash
node scripts/cert-refresh/capture-prod.mjs
```

## Build it

```bash
node scripts/local-env/bootstrap.mjs     # stack up, schema, marker, base seed
node scripts/dev-seed/apply.mjs          # ~300 sessions / ~260 invoices of fake data
npx supabase status                      # copy anon + service_role keys into .env.local
```

Sign in as `dev-owner@maycreativearts.test` with `TEST_USER_PASSWORD`. These are the
credentials `tests/e2e/helpers.ts` defaults to — restoring them here is what makes the
Playwright suite green out of the box after the cert rebuild deleted the originals.

Rerun `bootstrap.mjs` any time. It is destructive to local and only to local.

## Why local can run tests cert and prod cannot

`require_mfa` is **false** on the local org, and no account has a TOTP factor, so
`login()` completes without an MFA dance. Cert mirrors prod, where MFA is on.

Prod additionally rate-limits auth routes to 5 requests/60s (measured: HTTP 429 after
~2 requests), so the login/signup specs can never pass there. **Local is the only
environment where the full suite — including the two data-creating specs — can run.**

## The guard

Every script here calls `assertLocal()`, which throws unless all three hold:

1. the connection string is loopback and contains neither the prod nor cert ref
2. `mca_local.marker` exists and says `label='local'`
3. `mca_cert.marker` is **absent**

The marker lives outside `public` so a rebuild's `DROP SCHEMA public CASCADE` cannot
disarm it partway through. There is deliberately **no Management API client in this
directory** — that API can only address cloud projects, so its absence means a bug
here cannot reach cert or prod.

## Gotchas

- **`pg_dump --schema=public` does not carry everything.** The `on_auth_user_created`
  trigger and the `storage.objects` policies live outside `public`;
  `capture-prod.mjs` emits them separately as `prod-attachments.sql`. Skip them and
  signup silently creates profile-less users and uploads break. `bootstrap.mjs` fails
  loudly if the trigger is missing after restore.
- **`on_auth_user_created` must be suppressed while seeding accounts.** Its
  no-metadata branch mints a new organization per insert. `base-seed.mjs` sets
  `session_replication_role = replica` in the *same statement batch* as the inserts —
  it cannot be a separate call, and `ALTER TABLE ... DISABLE TRIGGER` is refused
  because `auth.users` is owned by `supabase_auth_admin`.
- **The base seed and `dev-seed/generate.mjs` share hard-coded UUIDs.** `generate.mjs`
  assumes the org, both dev users, seven service types and four clients already exist.
  Change an id in one file and you must change it in the other.
