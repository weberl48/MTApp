/**
 * Apply the PHI-sanitize helper functions, then prove they work.
 *
 * `audit_trigger_function()` fires on every write to an audited table and hard-
 * fails if get_phi_fields() / hash_for_audit(text) / sanitize_phi_jsonb(jsonb)
 * are missing. This exact omission broke production on 2026-07-04.
 *
 * After a pg_dump restore these are usually already present (they are public
 * functions, so the schema dump carries them) and this is a no-op CREATE OR
 * REPLACE. It runs anyway, as a separate visible step, because the cost of
 * being wrong is every subsequent INSERT failing — and because if prod itself
 * has drifted, this repairs cert before the insert storm rather than after.
 *
 * Non-skippable. Exits non-zero on any failed assertion.
 *
 * Usage:  node scripts/cert-refresh/apply-helpers.mjs
 */
import './lib/run.mjs'
import { readFileSync } from 'fs'
import { certQuery } from './lib/api.mjs'
import { assertCert } from './lib/guards.mjs'

await assertCert()

const MIGRATION = 'supabase/migrations/20260704_restore_phi_sanitize_helpers.sql'
console.log(`Applying ${MIGRATION} ...`)

const sql = readFileSync(MIGRATION, 'utf8')
await certQuery(sql)

// ------------------------------------------------------------------ assertions
const [{ fns }] = await certQuery(`
  select count(*)::int as fns from pg_proc
  where proname in ('get_phi_fields','hash_for_audit','sanitize_phi_jsonb')
`)
if (fns < 3) {
  console.error(`FAIL: only ${fns}/3 helper functions present. Every audited write would error.`)
  process.exit(1)
}

const [{ hashed }] = await certQuery(`
  select sanitize_phi_jsonb('{"notes":"secret","name":"ok"}'::jsonb) ->> 'notes' like 'hash:%' as hashed
`)
if (!hashed) {
  console.error('FAIL: sanitize_phi_jsonb did not hash a PHI field.')
  process.exit(1)
}

const [{ preserved }] = await certQuery(`
  select sanitize_phi_jsonb('{"notes":"secret","name":"ok"}'::jsonb) ->> 'name' = 'ok' as preserved
`)
if (!preserved) {
  console.error('FAIL: sanitize_phi_jsonb mangled a non-PHI field.')
  process.exit(1)
}

const [{ wired }] = await certQuery(`
  select pg_get_functiondef('audit_trigger_function()'::regprocedure) like '%sanitize_phi_jsonb%' as wired
`)
if (!wired) {
  console.error('FAIL: audit_trigger_function() does not call sanitize_phi_jsonb — audit rows would carry raw PHI.')
  process.exit(1)
}

console.log('  3/3 functions present')
console.log('  sanitize_phi_jsonb hashes PHI and preserves non-PHI')
console.log('  audit_trigger_function() is wired to it')
console.log('\nHelpers verified. Safe to insert data.')
