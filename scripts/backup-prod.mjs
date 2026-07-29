// Daily local backup of the production Supabase database (all app tables → JSON).
//
// Runs via Windows Task Scheduler ("MCA Prod DB Backup": at logon + daily noon);
// self-dedupes so it backs up at most once per day. Safe to run manually:
//   node scripts/backup-prod.mjs
//
// Output: C:\Users\lwebe\Personal\MusicTherapy-backups\daily\YYYY-MM-DD\<table>.json
// Retention: daily folders older than KEEP_DAYS are pruned (the one-off pre-wipe
// backup folders outside daily\ are never touched).
//
// SECURITY: PHI note fields are stored in their encrypted form, but client names,
// emails and addresses are plaintext — keep the backup root out of git and cloud sync.
//
// WHAT THIS DOES **NOT** RESTORE: login credentials. Supabase owns those in the
// `auth` schema; we deliberately back up only a non-secret identity projection
// (id + email + timestamps, see AUTH_IDENTITY_QUERY) so that a restore can map
// public.users rows back to the right people — password hashes and MFA secrets are
// NOT copied to local disk on purpose. After a full-project restore, users sign in
// via password reset. See MANIFEST.json in each backup folder.

import { readFileSync, mkdirSync, writeFileSync, existsSync, appendFileSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_REF = 'ysmwowzxkgisshaormmf'
const BACKUP_ROOT = 'C:\\Users\\lwebe\\Personal\\MusicTherapy-backups'
const KEEP_DAYS = 30
const PAGE_SIZE = 5000

// Tables are DISCOVERED from the database, never hand-listed: a hand-maintained
// list silently drifts as tables are added (it had already missed 7 of 21).
const TABLE_DISCOVERY_QUERY = `
  SELECT c.relname AS table_name
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY c.relname
`

// Non-secret identity projection only — never encrypted_password / MFA factors.
const AUTH_IDENTITY_QUERY = `
  SELECT id, email, created_at, last_sign_in_at, email_confirmed_at
  FROM auth.users ORDER BY created_at
`

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const dailyRoot = join(BACKUP_ROOT, 'daily')
const today = new Date().toLocaleDateString('sv') // YYYY-MM-DD, local time
const outDir = join(dailyRoot, today)
const marker = join(outDir, '_complete')
const logFile = join(BACKUP_ROOT, 'backup.log')

// Create the root before anything can log — log() itself used to throw ENOENT
// here, turning an early failure into a silent crash.
mkdirSync(BACKUP_ROOT, { recursive: true })

function log(msg) {
  try {
    appendFileSync(logFile, `${new Date().toISOString()} ${msg}\n`)
  } catch (err) {
    console.error(`[backup] could not write log: ${err.message}`)
  }
}

async function runQuery(token, query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
  const rows = JSON.parse(body)
  if (!Array.isArray(rows)) throw new Error(`unexpected response: ${body.slice(0, 200)}`)
  return rows
}

/**
 * Page through a table by ctid so an ever-growing table (audit_logs) can never
 * exceed the API's response limit. ctid is stable for the duration of the read
 * and exists on every table, so this needs no per-table key knowledge.
 */
async function fetchAllRows(token, table) {
  const all = []
  let offset = 0
  for (;;) {
    const page = await runQuery(
      token,
      `SELECT * FROM ${table} ORDER BY ctid LIMIT ${PAGE_SIZE} OFFSET ${offset}`
    )
    all.push(...page)
    if (page.length < PAGE_SIZE) break
    offset += page.length
  }
  return all
}

async function main() {
  if (existsSync(marker)) return 0 // already backed up today

  let token
  try {
    const env = readFileSync(join(repoRoot, '.env.local'), 'utf8')
    token = env.match(/^SUPABASE_ACCESS_TOKEN=("?)(.+?)\1\s*$/m)?.[2]
  } catch (err) {
    log(`FAIL: cannot read .env.local: ${err.message}`)
    return 1
  }
  if (!token) {
    log('FAIL: SUPABASE_ACCESS_TOKEN not found in .env.local')
    return 1
  }

  let tables
  try {
    tables = (await runQuery(token, TABLE_DISCOVERY_QUERY)).map((r) => r.table_name)
  } catch (err) {
    log(`FAIL: table discovery: ${err.message}`)
    return 1
  }
  if (tables.length === 0) {
    log('FAIL: table discovery returned no tables')
    return 1
  }

  mkdirSync(outDir, { recursive: true })

  const counts = {}
  let failed = false

  for (const table of tables) {
    try {
      const rows = await fetchAllRows(token, table)
      writeFileSync(join(outDir, `${table}.json`), JSON.stringify(rows))
      counts[table] = rows.length
    } catch (err) {
      failed = true
      log(`FAIL ${today} ${table}: ${err.message}`)
    }
  }

  // Identity projection so a restored public.users maps back to real people.
  try {
    const identities = await runQuery(token, AUTH_IDENTITY_QUERY)
    writeFileSync(join(outDir, 'auth_users_identity.json'), JSON.stringify(identities))
    counts['auth_users_identity'] = identities.length
  } catch (err) {
    failed = true
    log(`FAIL ${today} auth_users_identity: ${err.message}`)
  }

  writeFileSync(
    join(outDir, 'MANIFEST.json'),
    JSON.stringify(
      {
        project_ref: PROJECT_REF,
        taken_at: new Date().toISOString(),
        complete: !failed,
        row_counts: counts,
        restore_notes: [
          'Restore with json_populate_recordset INSERTs via the Management API, in FK order (organizations → users → clients → service_types → sessions → session_attendees → invoices → invoice_items). Original UUIDs are preserved.',
          'auth_users_identity.json is a NON-SECRET projection: no password hashes, no MFA factors. Recreate auth users from these ids/emails, then have each person use password reset. public.users has no FK to auth.users, so a restore will NOT error on missing auth rows — it will silently leave profiles nobody can sign in as.',
          'PHI note fields are encrypted with the ENCRYPTION_KEY of the project they came from; restoring into a project with a different key makes notes undecryptable.',
        ],
      },
      null,
      2
    )
  )

  const summary = Object.entries(counts).map(([t, n]) => `${t}=${n}`).join(' ')

  if (failed) {
    log(`INCOMPLETE ${today}: ${summary} (no _complete marker written; will retry next trigger)`)
    return 1
  }

  writeFileSync(marker, summary + '\n')
  log(`OK ${today} (${tables.length} tables): ${summary}`)

  // Prune old daily folders (completed backups only survive the window)
  const cutoff = new Date(Date.now() - KEEP_DAYS * 86400_000).toLocaleDateString('sv')
  for (const name of readdirSync(dailyRoot)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(name) && name < cutoff) {
      rmSync(join(dailyRoot, name), { recursive: true, force: true })
      log(`PRUNED ${name}`)
    }
  }
  return 0
}

// Nothing above may escape unlogged — an unhandled throw here is a backup that
// silently never happened.
try {
  process.exit(await main())
} catch (err) {
  log(`FAIL ${today} unhandled: ${err?.stack || err?.message || String(err)}`)
  process.exit(1)
}
