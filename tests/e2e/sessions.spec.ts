import { test, expect } from '@playwright/test'
import { login, TEST_PASSWORD } from './helpers'

// Test credentials - use environment variables in CI

test.describe('Sessions Page', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if no test password configured
    if (!TEST_PASSWORD) {
      test.skip()
      return
    }

    // Login before each test
    await login(page)
  })

  test('sessions page loads with list view', async ({ page }) => {
    await page.goto('/sessions')
    await expect(page.getByText(/sessions/i)).toBeVisible()
    // Should have view toggle (List/Calendar)
    await expect(page.getByRole('tab', { name: /list/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /calendar/i })).toBeVisible()
  })

  test('can switch between list and calendar view', async ({ page }) => {
    await page.goto('/sessions')

    // Click calendar view
    await page.getByRole('tab', { name: /calendar/i }).click()
    await expect(page.locator('[class*="calendar"]').first()).toBeVisible()

    // Switch back to list
    await page.getByRole('tab', { name: /list/i }).click()
  })

  test('new session button navigates to create page', async ({ page }) => {
    await page.goto('/sessions')
    await page.getByRole('link', { name: /new session|add session/i }).click()
    await expect(page).toHaveURL(/\/sessions\/new/)
  })

  test('session filters work', async ({ page }) => {
    await page.goto('/sessions')

    // Open the filters panel (button renders after the client-side load — auto-wait via click)
    await page.getByRole('button', { name: /^filters/i }).click()

    // Status filter should exist in the expanded panel
    await expect(page.getByText('Status', { exact: true }).first()).toBeVisible()
  })
})

test.describe('Session Creation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('new session form loads with required fields', async ({ page }) => {
    await page.goto('/sessions/new')

    // Check for key form elements (labels can repeat in select placeholders — first match suffices)
    await expect(page.getByText(/service type/i).first()).toBeVisible()
    await expect(page.getByText(/date/i).first()).toBeVisible()
    await expect(page.getByText(/duration/i).first()).toBeVisible()
  })

  test('session form shows pricing preview', async ({ page }) => {
    // Trailing slash (trailingSlash: true) — '/sessions/new' 308-redirects, and
    // clicking during that redirect raced the async service-type fetch below.
    await page.goto('/sessions/new/')

    // The trigger renders before its options finish loading (visibility is not
    // data-readiness), so a single early click opens an empty listbox and the
    // option wait times out under parallel-worker load. Retry the open until
    // options actually exist; Escape first so a stale empty listbox closes.
    const trigger = page.locator('[data-tour="session-form-service-type"] button[role="combobox"]')
    await trigger.waitFor({ state: 'visible', timeout: 10000 })
    await expect(async () => {
      await page.keyboard.press('Escape')
      await trigger.click()
      await expect(page.getByRole('option').first()).toBeVisible({ timeout: 1500 })
    }).toPass({ timeout: 20000 })
    await page.getByRole('option').first().click()

    // Pricing hint appears once a service type is selected (nothing renders before that)
    await expect(page.getByText(/rate: \$/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('cannot submit session without required fields', async ({ page }) => {
    await page.goto('/sessions/new')

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /submit/i })
    if (await submitButton.isVisible()) {
      await submitButton.click()
      // Should show validation error or stay on page
      await expect(page).toHaveURL(/\/sessions\/new/)
    }
  })
})
