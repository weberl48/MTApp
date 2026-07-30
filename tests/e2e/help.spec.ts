import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('help center', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/help/')
  })

  test('synonym search finds invoice help for "bill"', async ({ page }) => {
    // Retry fill+assert: on a cold page the input can be visible before React
    // hydration attaches its onChange, silently swallowing the first fill.
    await expect(async () => {
      const input = page.getByPlaceholder('Search help articles...')
      await input.fill('')
      await input.fill('bill')
      await expect(page.getByRole('link', { name: /invoice/i }).first()).toBeVisible({ timeout: 2000 })
    }).toPass({ timeout: 15000 })
  })

  test('FAQ answer renders inline for question phrasing', async ({ page }) => {
    await page.getByPlaceholder('Search help articles...').fill('why didnt this client get an invoice')
    await expect(page.getByText(/scholarship/i).first()).toBeVisible()
  })

  test('common questions accordion expands', async ({ page }) => {
    const first = page.getByRole('button', { name: /why didn't this client get an invoice/i })
    await first.click()
    await expect(page.getByText(/read more/i).first()).toBeVisible()
  })

  test('article feedback records without error', async ({ page }) => {
    await page.goto('/help/invoice-lifecycle/')
    await page.getByRole('button', { name: /yes, this helped/i }).click()
    await expect(page.getByText(/thanks for the feedback/i)).toBeVisible()
  })

  test('contextual help links from invoices page', async ({ page }) => {
    await page.goto('/invoices/')
    await page.getByRole('link', { name: 'Help for this page' }).click()
    await expect(page).toHaveURL(/\/help\/invoice-lifecycle\//)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/invoice/i)
  })
})
