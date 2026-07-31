/**
 * Rebuild cert's public schema from a prod capture. DESTRUCTIVE.
 *
 * This is the statement that erases MCA-Dev's accumulated divergence — the
 * pay-config branch's service_rates table, its 8 dropped service_types columns,
 * the dropped contractor_rates — by construction rather than by a hand-written
 * down-migration.
 *
 * Order matters. The capture is verified BEFORE anything is dropped, because a
 * truncated schema file would otherwise leave cert with no public schema and no
 * way to restore one.
 *
 * Usage:  node scripts/cert-refresh/rebuild-schema.mjs --confirm <YYYY-MM-DD> [--source <stamp>]
 */
import './lib/run.mjs'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { execFileSync } from 'child_process'
import { createHash } from 'crypto'
import { certQuery, envValue } from './lib/api.mjs'
import { assertCert, requireConfirm, assertNotProdConnection } from './lib/guards.mjs'
import { CERT_REF, POOLER, PATHS } from './config.mjs'

const info = await assertCert()
requireConfirm(process.argv)

// ------------------------------------------------------- locate + verify capture
const srcIdx = process.argv.indexOf('--source')
const stamp =
  srcIdx >= 0
    ? process.argv[srcIdx + 1]
    : readdirSync(PATHS.captureRoot).sort().pop()
if (!stamp) throw new Error(`No captures in ${PATHS.captureRoot}. Run capture-prod.mjs first.`)

const dir = `${PATHS.captureRoot}/${stamp}`
const schemaFile = `${dir}/prod-public-schema.sql`
const attachFile = `${dir}/prod-attachments.sql`
const manifestFile = `${dir}/capture-manifest.json`

for (const f of [schemaFile, attachFile, manifestFile]) {
  if (!existsSync(f)) throw new Error(`Capture incomplete — missing ${f}`)
}

const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
const schemaSql = readFileSync(schemaFile, 'utf8')
const sha = createHash('sha256').update(schemaSql).digest('hex')

// The pre-drop integrity gate. Without this, a half-written capture bricks cert.
if (sha !== manifest.schema_sha256) {
  throw new Error(`Schema file checksum mismatch — capture is corrupt.\n  expected ${manifest.schema_sha256}\n  actual   ${sha}`)
}
if (Buffer.byteLength(schemaSql, 'utf8') < 50_000) {
  throw new Error(`Schema file is implausibly small (${schemaSql.length} bytes). Refusing.`)
}
if (manifest.table_count < 10) {
  throw new Error(`Capture records only ${manifest.table_count} tables. Refusing.`)
}

console.log(`Rebuilding ${info.name} (${CERT_REF}) from capture ${stamp}`)
console.log(`  ${manifest.table_count} tables, ${manifest.function_count} functions`)
console.log(`  attachments: ${JSON.stringify(manifest.attachment_counts)}`)

// ------------------------------------------------------------------ reset schema
// Drop only — the pg_dump output carries its own CREATE SCHEMA public, so
// pre-creating it here makes the restore fail with "schema already exists".
// Grants are re-applied after the dump loads, below.
console.log('\n  dropping public ...')
await certQuery(`drop schema if exists public cascade;`)

// ------------------------------------------------------------------ load schema
const pw = envValue('DEV_SUPABASE_DB_PASSWORD')
if (!pw) throw new Error('DEV_SUPABASE_DB_PASSWORD missing from .env.local')

const { host, port } = POOLER[CERT_REF]
const conn = `postgresql://postgres.${CERT_REF}@${host}:${port}/postgres`
assertNotProdConnection(conn)

function psql(file, label) {
  console.log(`  psql ${label} ...`)
  execFileSync(
    `${PATHS.pgBin}/psql.exe`,
    ['-v', 'ON_ERROR_STOP=1', '--quiet', '-f', file, conn],
    { env: { ...process.env, PGPASSWORD: pw }, stdio: ['ignore', 'inherit', 'pipe'], timeout: 600_000 }
  )
}

psql(schemaFile, 'public schema')

// Supabase's role grants are not part of a --schema=public dump, so PostgREST
// (anon/authenticated/service_role) cannot see the new tables until these run.
console.log('  restoring role grants ...')
await certQuery(`
  alter schema public owner to postgres;
  grant usage on schema public to anon, authenticated, service_role;
  grant all   on schema public to postgres, service_role;
  grant all on all tables    in schema public to anon, authenticated, service_role;
  grant all on all functions in schema public to anon, authenticated, service_role;
  grant all on all sequences in schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`)

psql(attachFile, 'cross-schema attachments')

// ------------------------------------------------------------------ assert restored
const [{ trg }] = await certQuery(`
  select count(*)::int as trg from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where not t.tgisinternal and n.nspname in ('auth','storage')
`)
const [{ pol }] = await certQuery(
  `select count(*)::int as pol from pg_policies where schemaname <> 'public'`
)
const [{ tbl }] = await certQuery(
  `select count(*)::int as tbl from information_schema.tables where table_schema='public' and table_type='BASE TABLE'`
)

const want = manifest.attachment_counts
console.log(`\n  restored: ${tbl} tables, ${trg} cross-schema triggers, ${pol} policies`)

if (trg < want.triggers) {
  throw new Error(`Only ${trg}/${want.triggers} cross-schema triggers restored. on_auth_user_created may be missing — signup would silently create profile-less users.`)
}
if (pol < want.policies) {
  throw new Error(`Only ${pol}/${want.policies} non-public policies restored — storage uploads would misbehave.`)
}
if (tbl < manifest.table_count) {
  throw new Error(`Only ${tbl}/${manifest.table_count} tables restored.`)
}

const [{ present }] = await certQuery(`
  select count(*)::int as present from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  where not t.tgisinternal and c.oid = 'auth.users'::regclass and t.tgname = 'on_auth_user_created'
`)
if (!present) throw new Error('on_auth_user_created is NOT on auth.users after restore.')

// The rebuild is what clears any branch overlay.
await certQuery(`
  update mca_cert.marker
  set overlay = null, prewipe_overlay = false, prewipe_ids = null, source_snapshot = '${stamp}'
`)

console.log('\nSchema rebuilt. Branch overlays cleared.')
console.log('Next: node scripts/cert-refresh/apply-helpers.mjs')
