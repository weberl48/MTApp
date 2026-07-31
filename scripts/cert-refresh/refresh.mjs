/**
 * Orchestrate a cert refresh.
 *
 *   --preflight             check everything without changing anything
 *   --full                  rebuild schema from prod, then reload data
 *   --data-only             keep the schema, truncate and reload data
 *   --overlay <name>        apply a branch's un-shipped migrations (see config.OVERLAYS)
 *   --from-step <n>         resume after a failure
 *
 * Destructive modes need --confirm <today's date>.
 *
 * Usage:  node scripts/cert-refresh/refresh.mjs --full --confirm 2026-07-30
 */
import './lib/run.mjs'
import { execFileSync } from 'child_process'
import { readdirSync, existsSync } from 'fs'
import { certQuery, envValue } from './lib/api.mjs'
import { assertCert, requireConfirm } from './lib/guards.mjs'
import { CERT_REF, PATHS, OVERLAYS, TESTERS, FK_ORDER } from './config.mjs'

const argv = process.argv
const mode = argv.includes('--full') ? 'full' : argv.includes('--data-only') ? 'data-only' : 'preflight'
const fromStep = argv.includes('--from-step') ? Number(argv[argv.indexOf('--from-step') + 1]) : 0
const overlayIdx = argv.indexOf('--overlay')
const overlay = overlayIdx >= 0 ? argv[overlayIdx + 1] : null

function run(script, args = []) {
  execFileSync('node', [`scripts/cert-refresh/${script}`, ...args], { stdio: 'inherit' })
}

// ------------------------------------------------------------------ preflight
console.log(`cert-refresh — mode: ${mode}${overlay ? `, overlay: ${overlay}` : ''}\n`)

const info = await assertCert()
console.log(`  target: ${info.name} (${CERT_REF}) ${info.status}`)

const missing = ['SUPABASE_ACCESS_TOKEN', 'PROD_SUPABASE_DB_PASSWORD', 'DEV_SUPABASE_DB_PASSWORD',
                 'CERT_ENCRYPTION_KEY', 'CERT_TESTER_PASSWORD', 'CERT_TESTERS']
  .filter((k) => !envValue(k))
if (missing.length) throw new Error(`Missing from .env.local: ${missing.join(', ')}`)
console.log(`  env: all required keys present`)

if (TESTERS.length === 0) throw new Error('CERT_TESTERS is empty — nobody could sign in to cert.')
console.log(`  testers: ${TESTERS.join(', ')}`)

const snap = readdirSync(PATHS.dailyBackups).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().pop()
if (!snap) throw new Error(`No daily snapshots in ${PATHS.dailyBackups}`)
if (!existsSync(`${PATHS.dailyBackups}/${snap}/_complete`)) {
  throw new Error(`Snapshot ${snap} incomplete. Run: node scripts/backup-prod.mjs`)
}
console.log(`  snapshot: ${snap} (complete)`)

execFileSync(`${PATHS.pgBin}/pg_dump.exe`, ['--version'])
console.log(`  pg tooling: ok`)

if (overlay && !OVERLAYS[overlay]) {
  throw new Error(`Unknown overlay "${overlay}". Known: ${Object.keys(OVERLAYS).join(', ') || '(none)'}`)
}

if (mode === 'preflight') {
  console.log('\nPreflight passed. Nothing was changed.')
  process.exit(0)
}

requireConfirm(argv)

// One schema-changing overlay at a time — otherwise a Preview of another branch
// silently tests against the wrong schema and produces phantom bug reports.
const [m] = await certQuery('select overlay from mca_cert.marker')
if (overlay && m.overlay && m.overlay !== overlay) {
  throw new Error(`Overlay "${m.overlay}" is already applied. Run --full first to reset.`)
}

// ------------------------------------------------------------------ steps
const steps = []
if (mode === 'full') {
  steps.push(['rebuild schema', () => run('rebuild-schema.mjs', ['--confirm', argv[argv.indexOf('--confirm') + 1]])])
} else {
  steps.push(['truncate', async () => {
    const tables = (await certQuery(
      `select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE'`
    )).map((r) => r.table_name)
    const ordered = tables.filter((t) => FK_ORDER.includes(t)).concat(tables.filter((t) => !FK_ORDER.includes(t)))
    await certQuery(`truncate table ${ordered.map((t) => `public.${t}`).join(', ')} restart identity cascade;`)
    console.log(`  truncated ${ordered.length} tables`)
  }])
}
steps.push(['phi helpers', () => run('apply-helpers.mjs')])
steps.push(['seed auth', () => run('seed-auth.mjs')])
steps.push(['restore data', () => run('restore-data.mjs', ['--snapshot', snap])])
steps.push(['certify', () => run('certify.mjs')])
if (overlay) {
  steps.push([`overlay ${overlay}`, () => {
    for (const file of OVERLAYS[overlay]) {
      if (!existsSync(file)) throw new Error(`Overlay file missing: ${file} (wrong branch checked out?)`)
      console.log(`  applying ${file}`)
      run('apply-sql.mjs', [file])
    }
  }])
}
// shell:true — on Windows `npx` is npx.cmd and execFileSync will not find it otherwise.
steps.push(['verify', () => execFileSync('npx tsx scripts/cert-refresh/verify-cert.mts', { stdio: 'inherit', shell: true })])

for (let i = 0; i < steps.length; i++) {
  const [label, fn] = steps[i]
  if (i < fromStep) { console.log(`\n[${i + 1}/${steps.length}] ${label} — skipped (--from-step)`); continue }
  console.log(`\n[${i + 1}/${steps.length}] ${label}`)
  try {
    await fn()
  } catch (e) {
    console.error(`\nStep ${i + 1} (${label}) failed. Fix, then resume with:`)
    console.error(`  node scripts/cert-refresh/refresh.mjs --${mode} --from-step ${i} --confirm <today>`)
    process.exit(1)
  }
}

if (overlay) await certQuery(`update mca_cert.marker set overlay = '${overlay}'`)
console.log(`\ncert refresh complete.`)
