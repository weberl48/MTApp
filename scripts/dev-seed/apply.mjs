#!/usr/bin/env node
/**
 * Apply scripts/dev-seed/dev-seed.sql to the MCA-Dev Supabase project via the
 * Management API. The dev project ref is HARD-CODED — this script cannot touch
 * production. Regenerate first if the generator changed:
 *
 *   node scripts/dev-seed/generate.mjs && node scripts/dev-seed/apply.mjs
 */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DEV_REF = 'gzrukevymmguqxuoynqk' // MCA-Dev. NEVER the prod ref.
const HERE = dirname(fileURLToPath(import.meta.url))

// dev-seed.sql is generated output (not committed) — always regenerate so the
// applied SQL matches the checked-in generator.
execFileSync(process.execPath, [join(HERE, 'generate.mjs')], { stdio: 'inherit' })

const env = Object.fromEntries(
  readFileSync(join(HERE, '..', '..', '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
if (!env.SUPABASE_ACCESS_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN not found in .env.local')
  process.exit(1)
}
// Belt-and-braces: refuse to run if .env.local somehow points at production.
if (env.NEXT_PUBLIC_SUPABASE_URL?.includes('ysmwowzxkgisshaormmf')) {
  console.error('.env.local points at PRODUCTION — refusing to seed. Repoint it at MCA-Dev first.')
  process.exit(1)
}

const sql = readFileSync(join(HERE, 'dev-seed.sql'), 'utf8')
// The generator marks chunk boundaries so each Management API call stays small.
const chunks = sql
  .split(/^-- CHUNK /m)
  .slice(1)
  .map(c => {
    const nl = c.indexOf('\n')
    return { label: c.slice(0, nl).trim(), sql: c.slice(nl + 1).trim() }
  })

async function run(label, query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${DEV_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    console.error(`✗ ${label}: HTTP ${res.status}\n${(await res.text()).slice(0, 1500)}`)
    process.exit(1)
  }
  console.log(`✓ ${label}`)
  return res.json().catch(() => null)
}

for (const chunk of chunks) {
  await run(chunk.label, chunk.sql)
}

const counts = await run(
  'verify counts',
  `SELECT 'clients' t, count(*) FROM clients WHERE id::text LIKE 'dd5eed00%'
   UNION ALL SELECT 'sessions', count(*) FROM sessions WHERE id::text LIKE 'dd5eed00%'
   UNION ALL SELECT 'attendees', count(*) FROM session_attendees WHERE id::text LIKE 'dd5eed00%'
   UNION ALL SELECT 'invoices', count(*) FROM invoices WHERE id::text LIKE 'dd5eed00%'
   UNION ALL SELECT 'items', count(*) FROM invoice_items WHERE id::text LIKE 'dd5eed00%'
   UNION ALL SELECT 'goals', count(*) FROM client_goals WHERE id::text LIKE 'dd5eed00%'
   UNION ALL SELECT 'requests', count(*) FROM session_requests WHERE id::text LIKE 'dd5eed00%'`
)
console.table(Object.fromEntries((counts || []).map(r => [r.t, Number(r.count)])))
console.log('Seed applied to MCA-Dev (idempotent — rerun any time).')
