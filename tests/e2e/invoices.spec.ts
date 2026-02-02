import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'weberlucasdev@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || ''

test.describe('Invoices Page', () => {
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

  test('invoices page loads with summary cards', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByText(/invoices/i)).toBeVisible()

    // Should show summary cards
    await expect(page.getByText(/pending|awaiting/i)).toBeVisible()
  })

  test('invoices page has status tabs', async ({ page }) => {
    await page.goto('/invoices')

    // Should have tabs for filtering by status
    await expect(page.getByRole('tab')).toHaveCount({ minimum: 2 })
  })

  test('can search invoices', async ({ page }) => {
    await page.goto('/invoices')

    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      // Search should filter results
      await page.waitForTimeout(500) // Debounce
    }
  })
})

test.describe('Invoice Actions', () => {
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

  test('bulk selection works', async ({ page }) => {
    await page.goto('/invoices')

    // If there are invoices, try selecting one
    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible()) {
      await checkbox.click()
      // Should show bulk action bar
      await expect(page.getByText(/selected/i)).toBeVisible()
    }
  })
})
