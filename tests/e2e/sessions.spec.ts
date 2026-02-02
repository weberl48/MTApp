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
    await page.getByLabel('Password').fill(TEST_PASSWORD)
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
    await expect(page.locator('[class*="calendar"]')).toBeVisible()

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

    // Open filter if collapsed
    const filterButton = page.getByRole('button', { name: /filter/i })
    if (await filterButton.isVisible()) {
      await filterButton.click()
    }

    // Status filter should exist
    await expect(page.getByText(/status/i)).toBeVisible()
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
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/(dashboard|sessions)/)
  })

  test('new session form loads with required fields', async ({ page }) => {
    await page.goto('/sessions/new')

    // Check for key form elements
    await expect(page.getByText(/service type/i)).toBeVisible()
    await expect(page.getByText(/date/i)).toBeVisible()
    await expect(page.getByText(/duration/i)).toBeVisible()
  })

  test('session form shows pricing preview', async ({ page }) => {
    await page.goto('/sessions/new')

    // Pricing section should be visible
    await expect(page.getByText(/pricing|total|amount/i)).toBeVisible()
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
