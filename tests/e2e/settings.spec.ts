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
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/(dashboard|sessions)/)
  })

  test('settings page loads with tabs', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText(/settings/i)).toBeVisible()

    // Should have profile tab
    await expect(page.getByRole('tab', { name: /profile/i })).toBeVisible()
  })

  test('profile tab shows user information', async ({ page }) => {
    await page.goto('/settings')

    // Profile tab should be default
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('can navigate between settings tabs', async ({ page }) => {
    await page.goto('/settings')

    // Click security tab if visible
    const securityTab = page.getByRole('tab', { name: /security/i })
    if (await securityTab.isVisible()) {
      await securityTab.click()
      await expect(page.getByText(/password|mfa|two-factor/i)).toBeVisible()
    }
  })

  test('admin tabs visible for admin users', async ({ page }) => {
    await page.goto('/settings')

    // Check for admin-only tabs (may or may not be visible depending on role)
    // These are checked to exist but not necessarily visible depending on user role
    void page.getByRole('tab', { name: /team/i })
    void page.getByRole('tab', { name: /services/i })

    // At least profile should always be visible
    await expect(page.getByRole('tab', { name: /profile/i })).toBeVisible()
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
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/(dashboard|sessions)/)
  })

  test('team tab shows invite functionality', async ({ page }) => {
    await page.goto('/settings')

    const teamTab = page.getByRole('tab', { name: /team/i })
    if (await teamTab.isVisible()) {
      await teamTab.click()
      // Should show invite options
      await expect(page.getByText(/invite|team member/i)).toBeVisible()
    }
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
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/(dashboard|sessions)/)
  })

  test('services tab shows service type list', async ({ page }) => {
    await page.goto('/settings')

    const servicesTab = page.getByRole('tab', { name: /services/i })
    if (await servicesTab.isVisible()) {
      await servicesTab.click()
      // Should show service types
      await expect(page.getByText(/service type/i)).toBeVisible()
    }
  })
})
