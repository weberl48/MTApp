/**
 * One-time bootstrap: stamp the cert database with a tamper-evident marker.
 *
 * The marker lives in its own `mca_cert` schema, NOT in `public`, so it survives
 * every `DROP SCHEMA public CASCADE` the refresh performs. It is the mechanism
 * that makes "am I about to write to prod?" a question the *target* answers
 * rather than the caller — the only kind of guard that survives a copy-paste.
 *
 * Usage:  node scripts/cert-refresh/bootstrap-marker.mjs
 */
import './lib/run.mjs'
import { createInterface } from 'readline/promises'
import { certQuery, projectInfo } from './lib/api.mjs'
import { CERT_REF, PROD_REF } from './config.mjs'

if (CERT_REF === PROD_REF) {
  console.error('CERT_REF equals PROD_REF — refusing.')
  process.exit(1)
}

const info = await projectInfo(CERT_REF)
if (/prod/i.test(info.name)) {
  console.error(`Project ${CERT_REF} is named "${info.name}" — refusing to mark it as cert.`)
  process.exit(1)
}

// Refuse if already bootstrapped as something else.
const existing = await certQuery(
  `select to_regclass('mca_cert.marker') is not null as present;`
).catch(() => [{ present: false }])

if (existing?.[0]?.present) {
  const rows = await certQuery('select project_ref, label, bootstrapped_at from mca_cert.marker;')
  if (rows?.[0]?.project_ref && rows[0].project_ref !== CERT_REF) {
    console.error(
      `Already bootstrapped for a DIFFERENT ref (${rows[0].project_ref}). Refusing to overwrite.`
    )
    process.exit(1)
  }
  console.log(`Already bootstrapped: ${rows[0].project_ref} (${rows[0].bootstrapped_at})`)
  process.exit(0)
}

console.log(`About to mark this project as the CERT environment:`)
console.log(`  name: ${info.name}`)
console.log(`  ref:  ${CERT_REF}`)
console.log(`  region: ${info.region}`)
console.log('')
console.log('Cert will hold a full copy of production data, including PHI.')
console.log('')

const rl = createInterface({ input: process.stdin, output: process.stdout })
const typed = await rl.question(`Type the project ref to confirm: `)
rl.close()

if (typed.trim() !== CERT_REF) {
  console.error('Ref did not match — aborted.')
  process.exit(1)
}

await certQuery(`
  create schema if not exists mca_cert;

  create table if not exists mca_cert.marker (
    project_ref       text primary key,
    label             text not null,
    bootstrapped_at   timestamptz not null default now(),
    last_refreshed_at timestamptz,
    source_snapshot   text,
    overlay           text,
    prewipe_overlay   boolean not null default false,
    prewipe_ids       jsonb
  );

  insert into mca_cert.marker (project_ref, label)
  values ('${CERT_REF}', 'cert')
  on conflict (project_ref) do nothing;
`)

const [row] = await certQuery('select project_ref, label, bootstrapped_at from mca_cert.marker;')
console.log(`\nBootstrapped: ${row.project_ref} as "${row.label}" at ${row.bootstrapped_at}`)
console.log('Every destructive script now verifies this marker before writing.')
