import { test, expect } from '@playwright/test'
import { login } from './helpers'


test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  // /settings/ is a hub of link cards (Profile & Security, Practice & Branding,
  // Business Rules, Customize & Automate, Audit Log) — not tabs.
  test('settings hub loads with section cards', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('link', { name: /profile & security/i })).toBeVisible()
  })

  test('profile section shows account details', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('link', { name: /profile & security/i }).click()
    await expect(page).toHaveURL(/\/settings\/profile/)
    // Assert real labeled form controls, not bare page text — any stray
    // "name"/"email" string on the page would satisfy a text-presence check.
    await expect(page.getByLabel('Name', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Phone', { exact: true })).toBeVisible()
  })

  test('profile section renders two-factor authentication controls', async ({ page }) => {
    await page.goto('/settings/profile')
    await expect(page.getByText('Two-Factor Authentication').first()).toBeVisible({ timeout: 10000 })
  })

  test('can navigate between settings sections', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('link', { name: /business rules/i }).click()
    await expect(page).toHaveURL(/\/settings\/business/)
    // Landing on the URL is not evidence the section rendered.
    await expect(page.getByRole('tab', { name: /invoices/i }).first()).toBeVisible({ timeout: 10000 })
  })

  test('admin sections visible for owner users', async ({ page }) => {
    await page.goto('/settings')

    // Owner sees the org-management cards
    await expect(page.getByRole('link', { name: /business rules/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /customize & automate/i })).toBeVisible()
  })
})

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('team page is reachable from in-app navigation and shows invite action', async ({ page }) => {
    // Navigate the way a user does — a direct goto() would still pass if the
    // Team link were removed from the sidebar entirely.
    await page.goto('/dashboard')
    await page.getByRole('link', { name: 'Team', exact: true }).click()
    await expect(page).toHaveURL(/\/team/)
    // An actual control, not any text containing "invite".
    await expect(
      page.getByRole('button', { name: /invite/i }).or(page.getByRole('link', { name: /invite/i })).first()
    ).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Service Types', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('business rules shows service type list', async ({ page }) => {
    // Service types live under Settings > Business Rules (services tab is the default)
    await page.goto('/settings/business')
    // A seeded service type should be listed
    await expect(page.getByText('Musical Expressions').first()).toBeVisible({ timeout: 10000 })
  })
})
