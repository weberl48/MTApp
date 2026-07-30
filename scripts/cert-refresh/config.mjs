/**
 * Cert environment configuration.
 *
 * The cert environment is a faithful copy of production used to prove feature
 * branches before they merge. See scripts/cert-refresh/README.md.
 */

/** The ONLY database this toolset may write to. */
export const CERT_REF = 'gzrukevymmguqxuoynqk'

/** Read-only source. Never written to by anything in this directory. */
export const PROD_REF = 'ysmwowzxkgisshaormmf'

/**
 * Session-mode pooler hosts. Note the two projects sit on DIFFERENT hosts —
 * this is not a typo and has cost an hour before. The transaction pooler
 * (:6543) cannot serve pg_dump; session mode (:5432) is required.
 * Verified against GET /v1/projects/<ref>/config/database/pooler.
 */
export const POOLER = {
  [PROD_REF]: { host: 'aws-1-us-east-2.pooler.supabase.com', port: 5432 },
  [CERT_REF]: { host: 'aws-0-us-east-2.pooler.supabase.com', port: 5432 },
}

/**
 * Sink domain for every recipient address on cert.
 * `.invalid` is reserved by RFC 6761 and can never resolve, so even a
 * misconfiguration that restores RESEND_API_KEY cannot deliver mail.
 */
export const SINK_DOMAIN = process.env.CERT_SINK_DOMAIN || 'cert.mca.invalid'

/**
 * Accounts that keep their real email so testers can sign in with a login they
 * already know. Nothing can send to them — Preview has no RESEND_API_KEY.
 * Comma-separated in .env.local as CERT_TESTERS.
 */
export const TESTERS = (process.env.CERT_TESTERS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

/**
 * FK-safe insert order. audit_logs is last: it references users and organizations.
 * Tables absent from a snapshot are skipped rather than erroring.
 */
export const FK_ORDER = [
  'organizations',
  'users',
  'clients',
  'service_types',
  'sessions',
  'session_attendees',
  'invoices',
  'invoice_items',
  'session_reminders',
  'client_goals',
  'session_requests',
  'contractor_rates',
  'service_rates',
  'client_resources',
  'client_access_tokens',
  'user_invites',
  'user_onboarding',
  'app_settings',
  'login_attempts',
  'square_webhook_events',
  'help_events',
  'admin_work',
  'audit_logs',
]

/** Email columns rewritten to the sink. Data-driven so additions are one line. */
export const EMAIL_COLUMNS = [
  { table: 'clients', column: 'contact_email', nullable: true, unique: false },
  { table: 'session_reminders', column: 'recipient_email', nullable: false, unique: false },
  { table: 'user_invites', column: 'invited_email', nullable: false, unique: false },
  { table: 'users', column: 'email', nullable: false, unique: true, skipTesters: true },
]

/**
 * Branch migrations not yet applied to prod, in application order.
 * An entry exists exactly while the migration is NOT on prod. Once it is
 * hand-applied to prod, DELETE the entry — the next --full picks it up natively.
 */
export const OVERLAYS = {
  'pay-config': [
    'supabase/migrations/20260730_service_rates.sql',
    'supabase/migrations/20260730_service_rates_backfill_prod.sql',
    'supabase/migrations/20260730_trim_duration_options.sql',
    'supabase/migrations/20260730_drop_legacy_pay_columns.sql',
  ],
}

/** Backup + working directories. Outside the repo: these hold PHI and plaintext PII. */
export const PATHS = {
  dailyBackups: 'E:/mtmdbback/daily',
  preWipeBackup: 'E:/mtmdbback/prod-backup-2026-07-29',
  captureRoot: 'E:/mtmdbback/cert-source',
  pgBin: 'E:/mtmdbback/tools/pgsql/bin',
}

/** Accounts left over from the old MCA-Dev sandbox, removed during the auth seed. */
export const STRAY_DEV_ACCOUNTS = [
  'dev-owner@maycreativearts.test',
  'dev-contractor@maycreativearts.test',
]
