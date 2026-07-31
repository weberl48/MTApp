#!/usr/bin/env node
/**
 * Apply scripts/dev-seed/dev-seed.sql to a NON-PRODUCTION database.
 *
 *   node scripts/dev-seed/apply.mjs            # local stack (default)
 *   node scripts/dev-seed/apply.mjs --cloud    # legacy cloud dev project
 *
 * Local is the default because local is now the experiment environment: cert
 * mirrors production and holds real PHI, so synthetic rows must never go there.
 * See docs/superpowers/specs/2026-07-31-env-topology-design.md.
 *
 * Regenerate first if the generator changed:
 *   node scripts/dev-seed/generate.mjs && node scripts/dev-seed/apply.mjs
 */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DEV_REF = 'gzrukevymmguqxuoynqk' // legacy cloud dev target. NEVER the prod ref.
const HERE = dirname(fileURLToPath(import.meta.url))
const useLocal = !process.argv.includes('--cloud')

const env = Object.fromEntries(
  readFileSync(join(HERE, '..', '..', '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

// ---------------------------------------------------------------- target guards
let runChunk

if (useLocal) {
  // assertLocal throws unless mca_local.marker is present AND the connection is
  // loopback AND mca_cert.marker is absent — see scripts/local-env/lib/local-db.mjs.
  const { assertLocal, sql } = await import('../local-env/lib/local-db.mjs')
  assertLocal()
  runChunk = (label, query) => {
    sql(query)
    console.log(`✓ ${label}`)
  }
} else {
  if (!env.SUPABASE_ACCESS_TOKEN) {
    console.error('SUPABASE_ACCESS_TOKEN not found in .env.local')
    process.exit(1)
  }
  // Belt-and-braces: refuse to run if .env.local somehow points at production.
  if (env.NEXT_PUBLIC_SUPABASE_URL?.includes('ysmwowzxkgisshaormmf')) {
    console.error('.env.local points at PRODUCTION — refusing to seed.')
    process.exit(1)
  }

  // DEV_REF used to be a throwaway sandbox. It is now the CERT environment and
  // holds a full copy of production data, including PHI — injecting synthetic
  // rows into it would corrupt the very dataset cert exists to provide.
  // The marker lives in a non-public schema, so it survives cert rebuilds.
  const res = await fetch(`https://api.supabase.com/v1/projects/${DEV_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: "select to_regclass('mca_cert.marker') is not null as is_cert;" }),
  })
  const rows = res.ok ? await res.json() : null
  if (rows?.[0]?.is_cert) {
    console.error(
      `Target ${DEV_REF} is the CERT environment (mca_cert.marker present).\n` +
        'It holds real production data — refusing to seed synthetic rows into it.\n' +
        'Seed the local stack instead:  node scripts/dev-seed/apply.mjs'
    )
    process.exit(1)
  }

  runChunk = async (label, query) => {
    const r = await fetch(`https://api.supabase.com/v1/projects/${DEV_REF}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    if (!r.ok) {
      console.error(`✗ ${label}: HTTP ${r.status}\n${(await r.text()).slice(0, 1500)}`)
      process.exit(1)
    }
    console.log(`✓ ${label}`)
  }
}

console.log(`Seeding ${useLocal ? 'LOCAL stack' : `cloud project ${DEV_REF}`}`)

// dev-seed.sql is generated output (not committed) — always regenerate so the
// applied SQL matches the checked-in generator. Runs after the guards so a
// refusal costs nothing.
execFileSync(process.execPath, [join(HERE, 'generate.mjs')], { stdio: 'inherit' })

const sqlText = readFileSync(join(HERE, 'dev-seed.sql'), 'utf8')
// The generator marks chunk boundaries so each cloud API call stays small.
const chunks = sqlText
  .split(/^-- CHUNK /m)
  .slice(1)
  .map(c => {
    const nl = c.indexOf('\n')
    return { label: c.slice(0, nl).trim(), sql: c.slice(nl + 1).trim() }
  })

for (const chunk of chunks) {
  await runChunk(chunk.label, chunk.sql)
}

console.log(`Seed applied (idempotent — rerun any time).`)
