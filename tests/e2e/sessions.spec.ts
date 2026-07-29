import { test, expect } from '@playwright/test'

// Test credentials - use environment variables in CI
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'weberlucasdev@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || ''

test.describe('Sessions Page', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if no test password configured
    if (!TEST_PASSWORD) {
      test.skip()
      return
    }

    // Login before each test
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/(dashboard|sessions)/)
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
    if (!TEST_PASSWORD) {
      test.skip()
      return
    }

    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/(dashboard|sessions)/)
  })

  test('new session form loads with required fields', async ({ page }) => {
    await page.goto('/sessions/new')

    // Check for key form elements (labels can repeat in select placeholders — first match suffices)
    await expect(page.getByText(/service type/i).first()).toBeVisible()
    await expect(page.getByText(/date/i).first()).toBeVisible()
    await expect(page.getByText(/duration/i).first()).toBeVisible()
  })

  test('session form shows pricing preview', async ({ page }) => {
    await page.goto('/sessions/new')

    // Pricing hint appears once a service type is selected (nothing renders before that)
    await page.locator('[data-tour="session-form-service-type"] button[role="combobox"]').click()
    await page.getByRole('option').first().click()
    await expect(page.getByText(/rate: \$/i).first()).toBeVisible()
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
