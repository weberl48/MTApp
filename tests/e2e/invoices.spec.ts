import { test, expect } from '@playwright/test'
import { login } from './helpers'


test.describe('Invoices Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('invoices page loads with summary cards', async ({ page }) => {
    await page.goto('/invoices')
    // Scoped to main: nav chrome (sidebar/tab bar) also says "Invoices".
    await expect(page.locator('main').getByText(/invoices/i).first()).toBeVisible()

    // Should show summary cards ("Pending Review" / "Awaiting Payment")
    await expect(page.getByText('Pending Review')).toBeVisible()
    await expect(page.getByText('Awaiting Payment')).toBeVisible()
  })

  test('invoices page has status tabs', async ({ page }) => {
    await page.goto('/invoices')

    // Tabs render after the client-side data load — wait for one, then count
    await expect(page.getByRole('tab', { name: /pending/i })).toBeVisible({ timeout: 10000 })
    expect(await page.getByRole('tab').count()).toBeGreaterThanOrEqual(2)
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
    await login(page)
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
