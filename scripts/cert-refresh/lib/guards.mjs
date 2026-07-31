/**
 * Safety guards. Four independent layers stand between this toolset and
 * production; any one alone would be defeatable, together they need deliberate
 * sabotage.
 *
 *   L1  No CLI surface to redirect a write — no script takes a <ref> argument.
 *   L2  The TARGET proves it is cert, via mca_cert.marker. Prod has no such
 *       schema and never will, so editing CERT_REF to the prod ref fails with
 *       "schema mca_cert does not exist" rather than succeeding quietly.
 *   L3  Control-plane cross-check on the project name — independent of L2.
 *   L4  The prod reader physically cannot write (see lib/api.mjs prodRead).
 *
 * L2 lives OUTSIDE the public schema specifically so `DROP SCHEMA public CASCADE`
 * cannot disarm it partway through a refresh.
 */
import { certQuery, projectInfo } from './api.mjs'
import { CERT_REF, PROD_REF } from '../config.mjs'

/**
 * L2 + L3. Every destructive script calls this first, and it throws rather than
 * returning a boolean — a guard whose result can be ignored is not a guard.
 */
export async function assertCert() {
  if (CERT_REF === PROD_REF) {
    throw new Error('CERT_REF equals PROD_REF — refusing to run.')
  }

  let rows
  try {
    rows = await certQuery('select project_ref, label from mca_cert.marker;')
  } catch (e) {
    if (/mca_cert/i.test(e.message)) {
      throw new Error(
        `Target ${CERT_REF} has no mca_cert.marker — it is not a bootstrapped cert database.\n` +
          `If this really is cert, run:  node scripts/cert-refresh/bootstrap-marker.mjs\n` +
          `If you changed CERT_REF, change it back.`
      )
    }
    throw e
  }

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error(`mca_cert.marker must hold exactly one row, found ${rows?.length}`)
  }
  if (rows[0].project_ref !== CERT_REF) {
    throw new Error(
      `Marker says this database is ${rows[0].project_ref}, but CERT_REF is ${CERT_REF}.`
    )
  }
  if (rows[0].label !== 'cert') {
    throw new Error(`Marker label is ${rows[0].label}, expected "cert".`)
  }

  const info = await projectInfo(CERT_REF)
  if (/prod/i.test(info.name)) {
    throw new Error(`Project ${CERT_REF} is named "${info.name}" — refusing.`)
  }
  if (info.status !== 'ACTIVE_HEALTHY') {
    throw new Error(
      `Project ${CERT_REF} is ${info.status}, not ACTIVE_HEALTHY. ` +
        `Free-tier projects auto-pause after ~1 week idle — unpause it first.`
    )
  }

  return info
}

/**
 * Destructive steps require today's date typed back, so a stray up-arrow in a
 * terminal tomorrow is a no-op rather than a rebuild.
 */
export function requireConfirm(argv, { now = new Date() } = {}) {
  const i = argv.indexOf('--confirm')
  const supplied = i >= 0 ? argv[i + 1] : undefined
  const today = now.toISOString().slice(0, 10)
  if (supplied !== today) {
    throw new Error(
      `This step is destructive. Re-run with:  --confirm ${today}` +
        (supplied ? `\n(got "${supplied}")` : '')
    )
  }
}

/** Guard for a connection string assembled anywhere in the toolset. */
export function assertNotProdConnection(conn) {
  if (conn.includes(PROD_REF)) {
    throw new Error('Refusing: connection string addresses the production project.')
  }
}
