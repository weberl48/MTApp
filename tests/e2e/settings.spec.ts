import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'weberlucasdev@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || ''

test.describe('Settings Page', () => {
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
    await expect(page.getByText(/name|email/i).first()).toBeVisible()
  })

  test('can navigate between settings sections', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('link', { name: /business rules/i }).click()
    await expect(page).toHaveURL(/\/settings\/business/)
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

  test('team page shows invite functionality', async ({ page }) => {
    // Team is a top-level page now, not a settings tab
    await page.goto('/team')
    await expect(page.getByText(/invite/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Service Types', () => {
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

  test('business rules shows service type list', async ({ page }) => {
    // Service types live under Settings > Business Rules (services tab is the default)
    await page.goto('/settings/business')
    // A seeded service type should be listed
    await expect(page.getByText('Musical Expressions').first()).toBeVisible({ timeout: 10000 })
  })
})
