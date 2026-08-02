/**
 * Dev portal configuration: monitored environments + the API endpoint catalog
 * used by the smoke sweep.
 *
 * The sweep probes endpoints UNAUTHENTICATED. `expect` lists the statuses that
 * prove the route is alive and enforcing its guards (401/404 for protected
 * routes is a PASS). Anything else <500 is a WARN, >=500 or network error is a
 * FAIL. Routes with real side effects are `skip: true`.
 */

export const PORT = Number(process.env.PORT) || 4321

export const GITHUB_REPO = 'weberl48/MTApp'

// Overridable for the Pi mirror, where "local" means this PC's dev server.
const LOCAL_APP_URL = process.env.LOCAL_APP_URL || 'http://localhost:3000'

// Cert environment. Canonical home for these is scripts/cert-refresh/config.mjs —
// mirrored here because the Pi container only ships tools/dev-portal (see
// Dockerfile's `COPY . .`), so a cross-tree import would break there.
// If you change them there, change them here.
export const CERT_REF = 'gzrukevymmguqxuoynqk'
export const CERT_SINK_DOMAIN = process.env.CERT_SINK_DOMAIN || 'cert.mca.invalid'

// Stable alias pinned to the cert Preview deployment:
//   vercel deploy && vercel alias set <deployment> mca-cert.vercel.app
export const CERT_APP_URL = process.env.CERT_APP_URL || 'https://mca-cert.vercel.app'

/**
 * Vercel Deployment Protection bypass.
 *
 * Preview deployments sit behind Vercel SSO — which is exactly right, because
 * this one serves real PHI. That also means the portal gets a 302 to the SSO
 * login instead of the app, so HTTP checks are meaningless without a bypass.
 *
 * Enable it once in the dashboard (Project > Settings > Deployment Protection >
 * Protection Bypass for Automation), then put the generated secret in
 * .env.local as CERT_BYPASS_SECRET. There is no REST API for creating it.
 *
 * Until then the portal detects the SSO redirect and reports `protected`
 * rather than pretending cert is down.
 */
export const CERT_BYPASS_SECRET = process.env.CERT_BYPASS_SECRET || null

export const ENVIRONMENTS = [
  {
    key: 'local',
    name: 'Local Dev',
    subtitle: 'Runs against the cert database — REAL PHI',
    baseUrl: LOCAL_APP_URL,
    supabaseRef: 'gzrukevymmguqxuoynqk',
    supabaseName: 'Cert',
    links: [
      { label: 'Open app', url: `${LOCAL_APP_URL}/dashboard/` },
      { label: 'Supabase', url: 'https://supabase.com/dashboard/project/gzrukevymmguqxuoynqk' },
    ],
  },
  {
    key: 'cert',
    name: 'Cert',
    subtitle: 'Vercel Preview — faithful copy of prod',
    // Preview URLs are per-deployment, so this is a pinned alias rather than a
    // deployment URL. It sits behind Vercel SSO — see CERT_BYPASS_SECRET.
    baseUrl: CERT_APP_URL,
    bypassSecret: CERT_BYPASS_SECRET,
    supabaseRef: CERT_REF,
    supabaseName: 'Cert',
    links: [
      { label: 'Open cert', url: CERT_APP_URL },
      { label: 'Preview deployments', url: 'https://vercel.com/lucas-projects-eee2f5e6/maycreativearts/deployments' },
      { label: 'Supabase', url: `https://supabase.com/dashboard/project/${CERT_REF}` },
      { label: 'Refresh runbook', url: `https://github.com/${GITHUB_REPO}/blob/main/scripts/cert-refresh/README.md` },
    ],
  },
  {
    key: 'prod',
    name: 'Production',
    subtitle: 'maycreativearts.vercel.app',
    baseUrl: 'https://maycreativearts.vercel.app',
    supabaseRef: 'ysmwowzxkgisshaormmf',
    supabaseName: 'MCA-Prod',
    links: [
      { label: 'Open app', url: 'https://maycreativearts.vercel.app/dashboard/' },
      { label: 'Supabase', url: 'https://supabase.com/dashboard/project/ysmwowzxkgisshaormmf' },
      { label: 'Vercel', url: 'https://vercel.com/lucas-projects-eee2f5e6/maycreativearts' },
    ],
  },
]

export const GLOBAL_LINKS = [
  { label: 'GitHub repo', url: `https://github.com/${GITHUB_REPO}` },
  { label: 'GitHub Actions', url: `https://github.com/${GITHUB_REPO}/actions` },
  { label: 'Vercel project', url: 'https://vercel.com/lucas-projects-eee2f5e6/maycreativearts' },
]

// Placeholder UUID for parameterized routes — guards should reject before any lookup.
const FAKE_ID = '00000000-0000-0000-0000-000000000000'

export const ENDPOINTS = [
  { method: 'GET', path: '/api/health/', expect: [200, 503], group: 'health' },
  { method: 'GET', path: '/api/health/live/', expect: [200], group: 'health' },
  { method: 'GET', path: '/api/health/ready/', expect: [200, 503], group: 'health' },
  { method: 'POST', path: '/api/health/restore/', group: 'health', skip: 'side effect: triggers a Supabase restore' },
  // Replaced /api/auth/lockout/, which was removed in the 2026-08-02 security
  // audit: authentication moved server-side to this route so the lockout policy
  // is actually enforced, and the old endpoint was an unauthenticated write into
  // login_attempts (anyone could run a victim's failure counter up).
  { method: 'POST', path: '/api/auth/login/', expect: [400, 401, 415, 422], group: 'auth' },
  { method: 'POST', path: `/api/clients/${FAKE_ID}/access-token/`, expect: [401, 403, 404], group: 'clients' },
  { method: 'GET', path: `/api/clients/${FAKE_ID}/resources/`, expect: [401, 403, 404], group: 'clients' },
  { method: 'POST', path: `/api/clients/${FAKE_ID}/send-invite/`, expect: [401, 403, 404], group: 'clients' },
  // Dev-only relay: rejects the empty probe locally (400), hard 404 in production.
  { method: 'POST', path: '/api/dev/errors/', expect: [400, 404], group: 'dev' },
  { method: 'GET', path: '/api/cron/cleanup/', expect: [401], group: 'cron' },
  { method: 'GET', path: '/api/cron/scholarship-batches/', expect: [401], group: 'cron' },
  { method: 'GET', path: '/api/cron/send-invoice-reminders/', expect: [401], group: 'cron' },
  { method: 'GET', path: '/api/cron/send-reminders/', expect: [401], group: 'cron' },
  { method: 'POST', path: '/api/invites/user/', expect: [401], group: 'invites' },
  { method: 'GET', path: '/api/invites/validate/?token=probe', expect: [400, 401, 404], group: 'invites' },
  { method: 'GET', path: `/api/invoices/${FAKE_ID}/pdf/`, expect: [401, 403, 404], group: 'invoices' },
  { method: 'POST', path: `/api/invoices/${FAKE_ID}/send/`, expect: [401, 403, 404], group: 'invoices' },
  { method: 'POST', path: `/api/invoices/${FAKE_ID}/square/`, expect: [401, 403, 404], group: 'invoices' },
  { method: 'GET', path: '/api/payroll/annual-summary/pdf/', expect: [401, 403], group: 'payroll' },
  { method: 'GET', path: '/api/payroll/tax-summary/', expect: [401, 403], group: 'payroll' },
  { method: 'POST', path: '/api/portal/validate/', expect: [400, 401, 404], group: 'portal' },
  { method: 'POST', path: `/api/session-requests/${FAKE_ID}/approve/`, expect: [401, 403, 404], group: 'session-requests' },
  { method: 'POST', path: `/api/session-requests/${FAKE_ID}/decline/`, expect: [401, 403, 404], group: 'session-requests' },
  { method: 'GET', path: '/api/sessions/export/', expect: [401, 403], group: 'sessions' },
  { method: 'GET', path: '/api/square/status/', expect: [200, 401, 403], group: 'square' },
  // Signature verification is fail-closed in production only; dev accepts unsigned sandbox posts.
  { method: 'POST', path: '/api/webhooks/square/', expect: [400, 401, 403], expectByEnv: { local: [200] }, group: 'square' },
]

// History sampling: every 5 minutes, keep ~7 days per environment.
export const POLL_INTERVAL_MS = 5 * 60 * 1000
export const HISTORY_MAX_POINTS = 2016
export const ERROR_MAX_ENTRIES = 500
