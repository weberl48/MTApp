import { defineConfig, devices } from '@playwright/test'

/**
 * Runs the e2e suite against DEPLOYED PRODUCTION rather than a local dev server.
 *
 * Differences from `playwright.config.ts`, all forced by prod being real:
 * - No `webServer` — prod is already deployed; never boot a local server here.
 * - `storageState` from a single pre-run TOTP login (see the prod-auth script);
 *   combined with `E2E_REUSE_AUTH=1` the per-test `login()` becomes a no-op.
 * - `workers: 1` — prod auth/API routes are rate limited (5/60s auth, 60/60s API)
 *   and the org's data is shared, so parallel workers produce false failures.
 * - `retries: 0` — a retry against prod repeats real side effects.
 *
 * Specs that CREATE data (session-creation, session-resubmit-invoice) must be
 * selected explicitly; they write real sessions and invoices into the live books.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.PROD_BASE_URL || 'https://maycreativearts.vercel.app',
    storageState: process.env.PROD_STORAGE_STATE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
