/**
 * Local database access + the guard that keeps this toolset off cert and prod.
 *
 * Everything here talks to the local stack over psql. There is deliberately no
 * Management API client in this directory: the Management API can only address
 * CLOUD projects, so its absence means a bug here cannot reach cert or prod.
 */
import { execFileSync } from 'node:child_process'
import { LOCAL, PATHS, MARKER_SCHEMA, FORBIDDEN_REFS } from '../config.mjs'

/** Run SQL against the local DB, returning stdout. Throws on any SQL error. */
export function sql(query, { file = false } = {}) {
  assertLocalConnectionString(LOCAL.db)
  const args = ['-v', 'ON_ERROR_STOP=1', '--quiet', '--no-psqlrc']
  args.push(file ? '-f' : '-c', query)
  args.push(LOCAL.db)
  return execFileSync(`${PATHS.pgBin}/psql.exe`, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 600_000,
  }).toString()
}

/** Scalar query helper — returns a single trimmed value. */
export function scalar(query) {
  assertLocalConnectionString(LOCAL.db)
  return execFileSync(
    `${PATHS.pgBin}/psql.exe`,
    ['-t', '-A', '-v', 'ON_ERROR_STOP=1', '--no-psqlrc', '-c', query, LOCAL.db],
    { stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000 }
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
