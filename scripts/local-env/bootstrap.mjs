/**
 * Build the local experiment database from a prod SCHEMA capture + fake data.
 *
 * Local gets production's SHAPE and none of its data. That is the whole point:
 * cert mirrors prod (and holds real PHI, and real testers work in it), so local
 * exists to be broken freely — and no client data ever reaches this laptop.
 *
 * Pipeline:
 *   1. supabase start                      (Docker)
 *   2. verify a prod capture               (checksum BEFORE anything is dropped)
 *   3. rebuild public from the schema dump + cross-schema attachments
 *   4. assert the restore is complete      (incl. on_auth_user_created)
 *   5. stamp mca_local.marker              (arms the guard for every other script)
 *   6. apply the base seed                 (org, dev users, services, clients)
 *
 * Then:  node scripts/dev-seed/apply.mjs --local
 *
 * Usage:  node scripts/local-env/bootstrap.mjs [--source <stamp>] [--skip-start]
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LOCAL, PATHS, MARKER_SCHEMA } from './config.mjs'
import { sql, scalar, isUp, assertLocalConnectionString } from './lib/local-db.mjs'
import { disableCliSection, findTomlDuplicates } from './lib/toml-config.mjs'
import { baseSeedSql } from './base-seed.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..')

assertLocalConnectionString(LOCAL.db)

const envText = readFileSync(join(REPO, '.env.local'), 'utf8')
const envValue = (k) => envText.match(new RegExp(`^${k}=("?)(.+?)\\1\\s*$`, 'm'))?.[2]

// ------------------------------------------------------------------ 1. stack up
// Both [db.migrations] and [db.seed] must be off before the stack starts: the
// migration files are incremental ALTERs against an existing production schema
// and supabase/seed.sql is a legacy seed, so neither can run on an empty DB -
// and both are redundant once the full prod schema dump loads in step 3.

if (!process.argv.includes('--skip-start')) {
  const configPath = join(REPO, 'supabase', 'config.toml')
  if (!existsSync(configPath)) {
    console.log('  supabase init ...')
    execFileSync('npx', ['supabase', 'init'], { cwd: REPO, stdio: 'inherit', shell: true })
  }
  disableCliSection(configPath, 'db.migrations')
  disableCliSection(configPath, 'db.seed')

  // Validate before starting. A malformed config surfaces from the CLI only as
  // "ProjectConfigParseError" with no line number, which is a slow thing to
  // diagnose after a multi-minute image pull.
  const problems = findTomlDuplicates(readFileSync(configPath, 'utf8'))
  if (problems.length) {
    throw new Error(`supabase/config.toml is malformed:\n  ${problems.join('\n  ')}`)
  }

  if (!isUp()) {
    console.log('  supabase start (first run pulls images — this takes a while) ...')
    execFileSync('npx', ['supabase', 'start'], { cwd: REPO, stdio: 'inherit', shell: true, timeout: 900_000 })
  } else {
    console.log('  local stack already up')
  }
}

if (!isUp()) {
  throw new Error(`Local database is not reachable at ${LOCAL.db.replace(/:[^:@]*@/, ':***@')}`)
}

// ------------------------------------------------- 2. locate + verify the capture
const srcIdx = process.argv.indexOf('--source')
const stamp = srcIdx >= 0 ? process.argv[srcIdx + 1] : readdirSync(PATHS.captureRoot).sort().pop()
if (!stamp) {
  throw new Error(
    `No captures in ${PATHS.captureRoot}.\nRun:  node scripts/cert-refresh/capture-prod.mjs`
  )
}

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

// Integrity gate BEFORE the drop, for the same reason cert does it: a truncated
// capture would otherwise leave the database with no public schema at all.
if (sha !== manifest.schema_sha256) {
  throw new Error(`Schema checksum mismatch — capture ${stamp} is corrupt.`)
}
if (manifest.table_count < 10) {
  throw new Error(`Capture records only ${manifest.table_count} tables. Refusing.`)
}

console.log(`\nRebuilding LOCAL from prod capture ${stamp}`)
console.log(`  ${manifest.table_count} tables, ${manifest.function_count} functions`)

// ------------------------------------------------------------- 3. rebuild schema
console.log('\n  dropping public ...')
sql('drop schema if exists public cascade;')

function psqlFile(file, label) {
  console.log(`  psql ${label} ...`)
  execFileSync(
    `${PATHS.pgBin}/psql.exe`,
    ['-v', 'ON_ERROR_STOP=1', '--quiet', '--no-psqlrc', '-f', file, LOCAL.db],
    { stdio: ['ignore', 'inherit', 'inherit'], timeout: 600_000 }
  )
}

psqlFile(schemaFile, 'public schema')

// PostgREST cannot see the new tables until the Supabase roles are granted.
console.log('  restoring role grants ...')
sql(`
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

psqlFile(attachFile, 'cross-schema attachments')

// ------------------------------------------------------------- 4. assert restored
const tbl = Number(scalar(
  `select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'`
))
const present = Number(scalar(`
  select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid
  where not t.tgisinternal and c.oid='auth.users'::regclass and t.tgname='on_auth_user_created'
`))

console.log(`\n  restored: ${tbl} tables`)
if (tbl < manifest.table_count) {
  throw new Error(`Only ${tbl}/${manifest.table_count} tables restored.`)
}
if (!present) {
  throw new Error(
    'on_auth_user_created is NOT on auth.users — signup would silently create profile-less users.'
  )
}

// --------------------------------------------------------------- 5. arm the guard
// Outside public so a future rebuild's DROP SCHEMA cannot disarm it midway.
sql(`
  create schema if not exists ${MARKER_SCHEMA};
  create table if not exists ${MARKER_SCHEMA}.marker (
    label text primary key,
    source_snapshot text,
    stamped_at timestamptz not null default now()
  );
  delete from ${MARKER_SCHEMA}.marker;
  insert into ${MARKER_SCHEMA}.marker (label, source_snapshot) values ('local', '${stamp}');
`)
console.log(`  stamped ${MARKER_SCHEMA}.marker`)

// ------------------------------------------------------------------ 6. base seed
const password = envValue('TEST_USER_PASSWORD')
if (!password) throw new Error('TEST_USER_PASSWORD missing from .env.local — dev accounts need it.')

console.log('  applying base seed (org, dev users, services, clients) ...')
sql(baseSeedSql(password))

const userCount = scalar('select count(*) from public.users')
const svcCount = scalar('select count(*) from service_types')
console.log(`  seeded: ${userCount} users, ${svcCount} service types`)

console.log(`
Local database ready.

  Next:   node scripts/dev-seed/apply.mjs --local
  Keys:   npx supabase status          (copy anon/service_role into .env.local)
  Sign in as dev-owner@maycreativearts.test / TEST_USER_PASSWORD
`)
