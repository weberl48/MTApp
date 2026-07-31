/**
 * Local database access + the guard that keeps this toolset off cert and prod.
 *
 * Everything here talks to the local stack over psql. There is deliberately no
 * Management API client in this directory: the Management API can only address
 * CLOUD projects, so its absence means a bug here cannot reach cert or prod.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LOCAL, PATHS, MARKER_SCHEMA, FORBIDDEN_REFS } from '../config.mjs'

/** psql must be told the client encoding; Windows otherwise assumes the ANSI code page. */
const PG_ENV = { ...process.env, PGCLIENTENCODING: 'UTF8' }

/**
 * Run SQL against the local DB, returning stdout. Throws on any SQL error.
 *
 * Inline SQL is written to a UTF-8 temp file and run with -f rather than passed
 * via -c: an argument travels through the Windows command line, which re-encodes
 * it in the ANSI code page and corrupts any non-ASCII character. The dev-seed
 * dataset contains em dashes, so -c fails with
 * `invalid byte sequence for encoding "UTF8": 0x97`.
 */
export function sql(query, { file = false } = {}) {
  assertLocalConnectionString(LOCAL.db)
  const base = ['-v', 'ON_ERROR_STOP=1', '--quiet', '--no-psqlrc']

  if (file) {
    return execFileSync(`${PATHS.pgBin}/psql.exe`, [...base, '-f', query, LOCAL.db], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: PG_ENV,
      timeout: 600_000,
    }).toString()
  }

  const dir = mkdtempSync(join(tmpdir(), 'mca-local-'))
  const path = join(dir, 'q.sql')
  try {
    writeFileSync(path, query, 'utf8')
    return execFileSync(`${PATHS.pgBin}/psql.exe`, [...base, '-f', path, LOCAL.db], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: PG_ENV,
      timeout: 600_000,
    }).toString()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/** Scalar query helper — returns a single trimmed value. */
export function scalar(query) {
  assertLocalConnectionString(LOCAL.db)
  return execFileSync(
    `${PATHS.pgBin}/psql.exe`,
    ['-t', '-A', '-v', 'ON_ERROR_STOP=1', '--no-psqlrc', '-c', query, LOCAL.db],
    { stdio: ['ignore', 'pipe', 'pipe'], env: PG_ENV, timeout: 120_000 }
  )
    .toString()
    .trim()
}

/**
 * A connection string must be local by construction, not by convention.
 * Checked on EVERY call rather than once at startup, so a later mutation of
 * LOCAL.db cannot slip past a one-time check.
 */
export function assertLocalConnectionString(conn) {
  for (const ref of FORBIDDEN_REFS) {
    if (conn.includes(ref)) {
      throw new Error(`Refusing: connection string addresses cloud project ${ref}.`)
    }
  }
  if (!/@(127\.0\.0\.1|localhost|\[::1\]):/.test(conn)) {
    throw new Error(
      `Refusing: ${conn.replace(/:[^:@]*@/, ':***@')} is not a loopback address. ` +
        'This toolset only operates on the local Supabase stack.'
    )
  }
}

/**
 * Fail-closed proof that the target is the local experiment DB.
 *
 * Throws rather than returning a boolean — a guard whose result can be ignored
 * is not a guard. Three independent conditions must ALL hold:
 *   1. loopback connection string (above)
 *   2. mca_local.marker exists and says label='local'
 *   3. mca_cert.marker is ABSENT (defence in depth: if a cert dump were ever
 *      restored into local, this catches it before anything is written)
 */
export function assertLocal() {
  assertLocalConnectionString(LOCAL.db)

  let label
  try {
    label = scalar(`select label from ${MARKER_SCHEMA}.marker;`)
  } catch (e) {
    throw new Error(
      `Target has no ${MARKER_SCHEMA}.marker — it is not a bootstrapped local database.\n` +
        `Run:  node scripts/local-env/bootstrap.mjs\n` +
        `(underlying error: ${String(e.message).split('\n')[0]})`
    )
  }

  if (label !== 'local') {
    throw new Error(`Marker label is "${label}", expected "local".`)
  }

  const isCert = scalar(`select to_regclass('mca_cert.marker') is not null;`)
  if (isCert === 't') {
    throw new Error(
      'This database carries mca_cert.marker — it is a CERT database, not local. Refusing.'
    )
  }

  return true
}

/** True when the local stack is up and accepting connections. */
export function isUp() {
  try {
    scalar('select 1;')
    return true
  } catch {
    return false
  }
}
