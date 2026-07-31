# cert-refresh

Builds and refreshes the **cert** environment: a faithful copy of production
used to prove feature branches before they merge.

Cert is Supabase project `gzrukevymmguqxuoynqk` (formerly MCA-Dev). The app side
is the existing Vercel project's **Preview** environment, so every PR gets a URL
that runs against cert automatically.

> **Cert holds real production data, including decryptable PHI.** It inherits
> prod's compliance obligations — access control, retention, destruction. Treat
> its credentials at the same tier as prod's.

## Quick reference

```bash
node scripts/cert-refresh/refresh.mjs --preflight                    # check, change nothing
node scripts/cert-refresh/refresh.mjs --full      --confirm <today>  # rebuild schema + data (~10 min)
node scripts/cert-refresh/refresh.mjs --data-only --confirm <today>  # keep schema, reload data (~3 min)
node scripts/cert-refresh/refresh.mjs --overlay pay-config --confirm <today>
npx tsx scripts/cert-refresh/verify-cert.mts                         # read-only health report
node scripts/cert-refresh/seed-auth.mjs --reset-mfa <email>          # tester lost their authenticator
```

Use `--full` after prod's schema changed. Use `--data-only` for a routine data
refresh — also worth running weekly purely as a keep-alive, since the free-tier
project auto-pauses after about a week idle.

If a step fails, the error tells you how to resume:
`--from-step <n>`.

## Why it is built this way

**Schema comes from `pg_dump` against live prod, not from the repo.** The repo
cannot rebuild prod: `supabase/schema.sql` plus 56 hand-applied migrations is not
what is deployed, and there is no migration runner or drift detection. `admin_work`
exists in prod with no `CREATE TABLE` anywhere in the repo. Any "is cert == prod?"
question must be answered by comparing `pg_catalog`, never by reading the repo.

**Data comes from the daily JSON snapshot**, not `pg_dump --data-only`, so it
reuses the existing `scripts/backup-prod.mjs` output and its `_complete` marker.

## Connection details

The two projects sit on **different pooler hosts**. This is not a typo and has
cost an hour before. The transaction pooler (`:6543`) cannot serve `pg_dump`;
session mode (`:5432`) is required.

| | host | port |
|---|---|---|
| prod `ysmwowzxkgisshaormmf` | `aws-1-us-east-2.pooler.supabase.com` | 5432 |
| cert `gzrukevymmguqxuoynqk` | `aws-0-us-east-2.pooler.supabase.com` | 5432 |

## Safety: four layers

1. **No CLI surface to redirect a write.** No script takes a `<ref>` argument.
   This is deliberately unlike `scripts/rates-migration/apply.mjs` — that shape is
   fine for a supervised one-off and exactly wrong for a tool run by muscle memory.
2. **The target proves it is cert**, via `mca_cert.marker`. Prod has no such schema
   and never will, so pointing `CERT_REF` at prod fails with *"schema mca_cert does
   not exist"* rather than succeeding quietly. The marker lives outside `public`
   specifically so `DROP SCHEMA public CASCADE` cannot disarm it mid-refresh.
3. **Control-plane cross-check** on the project name and status — independent of (2).
4. **The prod reader cannot write.** `prodRead()` rejects anything that is not a
   single `SELECT`/`WITH`; `capture-prod.mjs` is the only file naming `PROD_REF`.

Destructive steps additionally require `--confirm <today's date>`, so a stray
up-arrow tomorrow is a no-op.

## Supabase specifics that bite

These were all found by running it, not by reading docs:

- **`pg_dump` output carries its own `CREATE SCHEMA public`.** The reset must drop
  only. Pre-creating the schema makes the restore fail with *"schema already exists"*.
- **`--no-privileges` is required, not cosmetic.** The pooler connects as `postgres`,
  which is not superuser on Supabase and cannot execute the dump's
  `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin` lines. Role grants are
  re-applied explicitly after the load, because `--schema=public` omits them and
  PostgREST cannot see the tables without them.
- **`auth.users` is owned by `supabase_auth_admin`.** `ALTER TABLE ... DISABLE
  TRIGGER` is refused. `session_replication_role = replica` suppresses triggers
  without ownership — but only within one session, so the auth seed's suppression,
  deletes and inserts all travel in a single batch.
- **`DROP SCHEMA public CASCADE` destroys cross-schema objects** that
  `pg_dump --schema=public` will not restore: `on_auth_user_created` (trigger on
  `auth.users`, function in `public`) and 8 `storage.objects` policies that call
  public helpers. Without reattaching them, signup silently creates auth users with
  no profile and uploads misbehave. `capture-prod.mjs` generates these from
  `pg_catalog` into `prod-attachments.sql`; `rebuild-schema.mjs` asserts they came back.

## The paired decrypt probe

`verify-cert.mts` decrypts three real PHI values twice: once with the cert key
(must succeed) and once with a deliberately wrong key (must fail).

The negative control is not redundant. `decryptField` catches a wrong-key failure
and returns the raw `enc:` string, and `/api/health` only checks that
`ENCRYPTION_KEY` is 64 hex characters — it never decrypts anything. So a wrong-key
cert renders `enc:AAAA…` everywhere and reports healthy. And a positive probe
alone cannot distinguish "decryption works" from "this value was never encrypted."

**A wrong key is worse than a missing one.** Missing fails loud (`src/proxy.ts`
returns 503 for every route in production). Wrong fails silent — and then
`updateClient` re-encrypts the ciphertext on save, because it calls `encryptField`
without an `isEncrypted()` guard. That row is then double-encrypted under two
different keys.

## Email safety

Cert keeps real names, notes and pricing. It rewrites only **recipient addresses**,
to `@cert.mca.invalid` (`.invalid` is RFC 6761-reserved and can never resolve).

The goal is *undeliverability*, not de-identification — do not confuse the two.
The local part is preserved so a tester can still tell who a reminder was for.

Two independent barriers:
1. Preview has no `RESEND_API_KEY`, so sends throw.
2. Even if a key appears, every address is unroutable.

Duplicates are preserved on `clients` deliberately — two siblings sharing a
parent's address collapse to the same sink address exactly as in prod, and that
collision is real behaviour worth testing. `users.email` gets an id suffix only
because a UNIQUE constraint forbids the collision.

`auth.users.email` is rewritten too: `audit_trigger_function()` reads it into
`audit_logs.user_email`, so skipping it would leak a real staff address into a
table testers export.

## Testers and MFA

`require_mfa` stays **true** on cert, so the enforcement path gets real coverage.

- Testers are listed in `CERT_TESTERS` and keep their **real** email — it is the
  login they already know, and nothing can send to it.
- Password is `CERT_TESTER_PASSWORD` from `.env.local`.
- First login blocks at the dashboard and routes to `/settings/profile` to enrol TOTP.
- **Enrolled factors survive refreshes.** `auth.mfa_factors` FKs to `auth.users(id)`,
  ids come from prod and the seed upserts rather than recreating. Enrol once.
- Lost authenticator: `node scripts/cert-refresh/seed-auth.mjs --reset-mfa <email>`.
- Password reset by email does **not** work on cert (no Resend). Re-run `seed-auth.mjs`.

Everyone who is not a tester gets 40 random bytes as a password, used once and
never stored — the account exists for referential and audit integrity only.

## Testing a feature branch

Non-schema branches need nothing: push, and the Preview deploy runs against cert.

Branches carrying migrations use an **overlay**, declared in `config.mjs`:

```bash
node scripts/cert-refresh/refresh.mjs --full --confirm <today>          # prod-exact baseline
node scripts/cert-refresh/refresh.mjs --overlay pay-config --confirm <today>
```

One schema-changing overlay at a time — `--overlay` refuses if another is active.
`verify-cert.mts` prints the active overlay, so a phantom bug from testing against
the wrong schema is diagnosable in ten seconds.

Delete the `OVERLAYS` entry once its migrations are applied to prod; the next
`--full` then picks them up natively.

**Caveat:** Preview env vars are project-wide, so *every* open PR's Preview points
at cert. While an overlay is active, a Preview of a branch expecting the old schema
will error.

## Files

| File | Role |
|---|---|
| `config.mjs` | refs, pooler hosts, sink domain, testers, FK order, overlays |
| `lib/run.mjs` | loads `.env.local`, turns refusals into readable messages |
| `lib/api.mjs` | `certQuery` (cert-only, chunked) and `prodRead` (SELECT-only) |
| `lib/guards.mjs` | `assertCert`, `requireConfirm` |
| `bootstrap-marker.mjs` | once, ever — stamps `mca_cert.marker` |
| `capture-prod.mjs` | read-only: schema dump + cross-schema attachments + manifest |
| `rebuild-schema.mjs` | destructive: verifies the capture, then drops and reloads |
| `apply-helpers.mjs` | PHI-sanitize helpers, gated on its own assertions |
| `seed-auth.mjs` | `auth.users` + identities; `--reset-mfa` |
| `restore-data.mjs` | JSON snapshot → cert, triggers suppressed |
| `certify.mjs` | email sink rewrite + `[CERT]` marker |
| `verify-cert.mts` | 13 assertions incl. the paired decrypt probe |
| `apply-sql.mjs` | generic cert-locked applier (used by overlays) |
| `refresh.mjs` | orchestrator |

## Environment

Required in `.env.local`:

```
SUPABASE_ACCESS_TOKEN        Management API
PROD_SUPABASE_DB_PASSWORD    pg_dump against prod
DEV_SUPABASE_DB_PASSWORD     psql against cert
CERT_ENCRYPTION_KEY          PRODUCTION's key, verbatim — PHI only decrypts under it
CERT_TESTERS                 comma-separated emails that keep a real address
CERT_TESTER_PASSWORD         shared cert password for those accounts
CERT_SINK_DOMAIN             optional, defaults to cert.mca.invalid
```
