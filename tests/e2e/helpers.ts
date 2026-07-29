import { test, type Page } from '@playwright/test'

// Defaults to the dev project's seeded owner, not the production owner: the
// e2e suite runs against MCA-Dev (require_mfa off there, so login completes).
export const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'dev-owner@maycreativearts.test'
export const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || ''

/**
 * Log in through the real login form, or skip the test when no credentials are
 * configured. Every authenticated spec calls this instead of inlining the flow:
 * the sequence was copy-pasted into 14 beforeEach blocks across 8 files, so a
 * single selector change (e.g. the "Show password" toggle breaking
 * getByLabel(/password/i)) meant editing 14 identical sites.
 *
 * Deliberately NOT using Playwright's storageState here. `auth.setup.ts` has a
 * ready scaffold for it and it would be faster, but a setup project that finds
 * no credentials writes no auth file, and every dependent test then errors on
 * the missing file instead of skipping cleanly — which is the behaviour that
 * lets this suite run at all without TEST_USER_PASSWORD.
 */
export async function login(page: Page) {
  if (!TEST_PASSWORD) {
    test.skip()
    return
  }

  await page.goto('/login')
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/(dashboard|sessions)/)
}

/**
 * Pick the first client in the session form's client picker.
 *
 * The picker is a dialog behind the "Select clients..." button; rows are buttons
 * named "Select <client name>". Scope to the dialog — the trigger's own
 * accessible name ("Select clients...") also matches /^Select /.
 */
export async function selectFirstClient(page: Page) {
  await page.getByRole('button', { name: /select clients/i }).click()
  const firstClient = page.getByRole('dialog').getByRole('button', { name: /^Select / }).first()
  await firstClient.waitFor({ timeout: 5000 })
  await firstClient.click()
  await page.keyboard.press('Escape')
}
