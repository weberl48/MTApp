/**
 * Restore prod data into cert from a daily JSON snapshot.
 *
 * Two things here are load-bearing:
 *
 *  1. `ALTER TABLE ... DISABLE TRIGGER USER` around the whole load. This is what
 *     stops audit_trigger_function() writing one audit_logs row per restored
 *     record — a full restore would otherwise bury the 2,046 real audit rows
 *     under ~2,400 fabricated ones and make the audit screens untestable.
 *     DISABLE TRIGGER USER leaves internal constraint triggers alone, so foreign
 *     keys stay enforced while the audit trigger stays quiet.
 *
 *  2. json_populate_recordset maps by column NAME. A snapshot predating a prod
 *     column add loads with that column defaulted rather than erroring, which is
 *     the forgiveness you want — and is why this beats generating explicit
 *     column lists. verify-cert.mts catches the resulting drift.
 *
 * Usage:  node scripts/cert-refresh/restore-data.mjs [--snapshot YYYY-MM-DD] [--tables a,b]
 */
import './lib/run.mjs'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { certQuery, certApplyChunked } from './lib/api.mjs'
import { assertCert } from './lib/guards.mjs'
import { PATHS, FK_ORDER } from './config.mjs'

await assertCert()

// ------------------------------------------------------------------ pick snapshot
const snapIdx = process.argv.indexOf('--snapshot')
const snap =
  snapIdx >= 0
    ? process.argv[snapIdx + 1]
    : readdirSync(PATHS.dailyBackups)
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort()
        .pop()

const dir = `${PATHS.dailyBackups}/${snap}`
if (!existsSync(dir)) throw new Error(`No snapshot at ${dir}`)
if (!existsSync(`${dir}/_complete`)) {
  throw new Error(`Snapshot ${snap} has no _complete marker — it may be a partial backup. Refusing.`)
}

const tablesIdx = process.argv.indexOf('--tables')
const only = tablesIdx >= 0 ? process.argv[tablesIdx + 1].split(',') : null

console.log(`Restoring snapshot ${snap} into cert`)

// Only restore tables that exist in BOTH the snapshot and cert's schema.
const certTables = (
  await certQuery(
    `select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE'`
  )
).map((r) => r.table_name)

const plan = FK_ORDER.filter((t) => {
  if (only && !only.includes(t)) return false
  if (!certTables.includes(t)) return false
  return existsSync(`${dir}/${t}.json`)
})

const skippedNoFile = FK_ORDER.filter((t) => certTables.includes(t) && !existsSync(`${dir}/${t}.json`))
const snapshotOnly = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_') && f !== 'MANIFEST.json')
  .map((f) => f.replace('.json', ''))
  .filter((t) => !FK_ORDER.includes(t) && t !== 'auth_users_identity')

if (snapshotOnly.length) {
  console.warn(`  NOTE: snapshot has tables not in FK_ORDER, skipping: ${snapshotOnly.join(', ')}`)
}
if (skippedNoFile.length) {
  console.log(`  no snapshot file (skipping): ${skippedNoFile.join(', ')}`)
}

// ---------------------------------------------------- disable user triggers
console.log('\n  disabling user triggers (keeps audit_logs clean, FKs still enforced) ...')
const disable = plan.map((t) => `alter table public.${t} disable trigger user;`).join('\n')
await certQuery(disable)

let total = 0
try {
  for (const table of plan) {
    const rows = JSON.parse(readFileSync(`${dir}/${table}.json`, 'utf8'))
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(`  ${table.padEnd(24)} 0`)
      continue
    }

    // Chunk by row count so a single statement stays well under the API limit.
    const perChunk = Math.max(1, Math.floor(400_000 / (JSON.stringify(rows[0]).length + 1)))
    const statements = []
    for (let i = 0; i < rows.length; i += perChunk) {
      const slice = rows.slice(i, i + perChunk)
      const json = JSON.stringify(slice)
      if (json.includes('$mca_cert$')) {
        throw new Error(`${table} contains the dollar-quote delimiter — cannot safely embed.`)
      }
      statements.push(
        `insert into public.${table} select * from json_populate_recordset(null::public.${table}, $mca_cert$${json}$mca_cert$::json);`
      )
    }
    await certApplyChunked(statements, { label: table })
    console.log(`  ${table.padEnd(24)} ${rows.length}`)
    total += rows.length
  }
} finally {
  console.log('\n  re-enabling user triggers ...')
  const enable = plan.map((t) => `alter table public.${t} enable trigger user;`).join('\n')
  await certQuery(enable)
}

// ------------------------------------------------------------------ assertions
const [{ disabled }] = await certQuery(`
  select count(*)::int as disabled from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname='public' and not t.tgisinternal and t.tgenabled = 'D'
`)
if (disabled > 0) {
  throw new Error(`${disabled} trigger(s) left DISABLED — cert would silently stop auditing.`)
}

await certQuery(`analyze;`)
await certQuery(`update mca_cert.marker set last_refreshed_at = now(), source_snapshot = '${snap}';`)

console.log(`\nRestored ${total} rows across ${plan.length} tables. All triggers re-enabled.`)
console.log('Next: node scripts/cert-refresh/certify.mjs')
