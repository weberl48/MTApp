/**
 * Local experiment environment configuration.
 *
 * Local is the ONLY environment anything is allowed to break. Cert mirrors prod
 * and real testers work in it; prod is the business. See
 * docs/superpowers/specs/2026-07-31-env-topology-design.md.
 *
 * The local stack is `supabase start` (Docker). Its ports are fixed by the CLI
 * unless supabase/config.toml overrides them.
 */

/** Refs this toolset must NEVER address. Used as a substring blocklist. */
export const FORBIDDEN_REFS = ['ysmwowzxkgisshaormmf', 'gzrukevymmguqxuoynqk']

/**
 * Default `supabase start` endpoints. 563xx, not the CLI's 543xx defaults:
 * supabase/config.toml moves every port because Windows' dynamic excluded
 * port ranges swallow the 543xx block on this machine (see the [api] note
 * there). Keep these in sync with config.toml and .env.local.
 */
export const LOCAL = {
  db: process.env.LOCAL_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:56322/postgres',
  api: process.env.LOCAL_API_URL || 'http://127.0.0.1:56321',
}

/**
 * Marker schema proving a database is local. Mirrors cert's mca_cert.marker and
 * lives OUTSIDE public for the same reason: `DROP SCHEMA public CASCADE` during a
 * rebuild must not disarm the guard partway through.
 */
export const MARKER_SCHEMA = 'mca_local'

/** Reused from the cert toolset — same capture feeds both cert and local. */
export const PATHS = {
  captureRoot: 'E:/mtmdbback/cert-source',
  pgBin: 'E:/mtmdbback/tools/pgsql/bin',
}

/**
 * Accounts recreated on every bootstrap. These are the credentials
 * tests/e2e/helpers.ts defaults to — restoring them here is what makes the
 * e2e suite green out of the box again after the cert rebuild deleted them.
 */
export const LOCAL_ACCOUNTS = [
  { email: 'dev-owner@maycreativearts.test', role: 'developer' },
  { email: 'dev-contractor@maycreativearts.test', role: 'contractor' },
]
