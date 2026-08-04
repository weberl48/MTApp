import { test, expect } from '@playwright/test'
import { login } from './helpers'

/**
 * Appearance picker smoke (spec: docs/superpowers/specs/2026-08-04-user-themes-design.md):
 * picking a theme stamps data-theme on <html>, survives a reload, and Classic
 * clears it. Skips (via login()) when TEST_USER_PASSWORD is not configured.
 */
test.describe('Appearance theme picker', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('picking a theme applies it, persists across reload, and Classic clears it', async ({ page }) => {
    await page.goto('/dashboard/')
    const html = page.locator('html')

    await page.getByRole('button', { name: 'Appearance' }).click()
    await page.getByRole('button', { name: /ocean/i }).click()
    await expect(html).toHaveAttribute('data-theme', 'ocean')

    await page.reload()
    await expect(html).toHaveAttribute('data-theme', 'ocean')

    await page.getByRole('button', { name: 'Appearance' }).click()
    await page.getByRole('button', { name: /classic/i }).click()
    await expect(html).not.toHaveAttribute('data-theme')

    await page.reload()
    await expect(html).not.toHaveAttribute('data-theme')
  })
})
