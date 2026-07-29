// Daily local backup of the production Supabase database (all app tables → JSON).
//
// Runs via Windows Task Scheduler ("MCA Prod DB Backup": at logon + daily noon);
// self-dedupes so it backs up at most once per day. Safe to run manually:
//   node scripts/backup-prod.mjs
//
// Output: C:\Users\lwebe\Personal\MusicTherapy-backups\daily\YYYY-MM-DD\<table>.json
// Retention: daily folders older than KEEP_DAYS are pruned (the one-off pre-wipe
// backup folders outside daily\ are never touched). PHI note fields are stored in
// their encrypted form; client names/emails are plaintext — keep the backup root
// out of git and cloud sync.

import { readFileSync, mkdirSync, writeFileSync, existsSync, appendFileSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_REF = 'ysmwowzxkgisshaormmf'
const BACKUP_ROOT = 'C:\\Users\\lwebe\\Personal\\MusicTherapy-backups'
const KEEP_DAYS = 30
const TABLES = [
  'organizations', 'users', 'clients', 'service_types', 'contractor_rates',
  'sessions', 'session_attendees', 'session_reminders',
  'invoices', 'invoice_items', 'session_requests',
  'client_goals', 'client_access_tokens', 'audit_logs',
]

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const dailyRoot = join(BACKUP_ROOT, 'daily')
const today = new Date().toLocaleDateString('sv') // YYYY-MM-DD, local time
const outDir = join(dailyRoot, today)
const marker = join(outDir, '_complete')
const logFile = join(BACKUP_ROOT, 'backup.log')

function log(msg) {
  appendFileSync(logFile, `${new Date().toISOString()} ${msg}\n`)
}

if (existsSync(marker)) process.exit(0) // already backed up today

const env = readFileSync(join(repoRoot, '.env.local'), 'utf8')
const token = env.match(/^SUPABASE_ACCESS_TOKEN=("?)(.+?)\1\s*$/m)?.[2]
if (!token) {
  log('FAIL: SUPABASE_ACCESS_TOKEN not found in .env.local')
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })

const counts = []
let failed = false
for (const table of TABLES) {
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `SELECT * FROM ${table}` }),
    })
    const body = await res.text()
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
    const rows = JSON.parse(body)
    if (!Array.isArray(rows)) throw new Error(`unexpected response: ${body.slice(0, 200)}`)
    writeFileSync(join(outDir, `${table}.json`), body)
    counts.push(`${table}=${rows.length}`)
  } catch (err) {
    failed = true
    log(`FAIL ${today} ${table}: ${err.message}`)
  }
}

if (!failed) {
  writeFileSync(marker, counts.join('\n') + '\n')
  log(`OK ${today}: ${counts.join(' ')}`)
  // Prune old daily folders (completed backups only survive the window)
  const cutoff = new Date(Date.now() - KEEP_DAYS * 86400_000).toLocaleDateString('sv')
  for (const name of readdirSync(dailyRoot)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(name) && name < cutoff) {
      rmSync(join(dailyRoot, name), { recursive: true, force: true })
      log(`PRUNED ${name}`)
    }
  }
} else {
  log(`INCOMPLETE ${today}: ${counts.join(' ')} (no _complete marker written; will retry next trigger)`)
  process.exit(1)
}
