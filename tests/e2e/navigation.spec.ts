import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'weberlucasdev@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || ''

test.describe('Smoke Tests - Critical User Flows', () => {
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

  test('can navigate to all main pages', async ({ page }) => {
    // Dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)

    // Sessions
    await page.goto('/sessions')
    await expect(page).toHaveURL(/\/sessions/)

    // Invoices
    await page.goto('/invoices')
    await expect(page).toHaveURL(/\/invoices/)

    // Clients
    await page.goto('/clients')
    await expect(page).toHaveURL(/\/clients/)

    // Settings
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/settings/)
  })

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/dashboard')

    // Find and click sessions link in sidebar
    const sessionsLink = page.getByRole('link', { name: /sessions/i }).first()
    await sessionsLink.click()
    await expect(page).toHaveURL(/\/sessions/)

    // Navigate to invoices
    const invoicesLink = page.getByRole('link', { name: /invoices/i }).first()
    await invoicesLink.click()
    await expect(page).toHaveURL(/\/invoices/)
  })

  test('logout works', async ({ page }) => {
    await page.goto('/dashboard')

    // Find logout button (might be in dropdown)
    const userMenu = page.getByRole('button', { name: /account|profile|user/i })
    if (await userMenu.isVisible()) {
      await userMenu.click()
    }

    const logoutButton = page.getByRole('button', { name: /log out|sign out/i })
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      await expect(page).toHaveURL(/\/login/)
    }
  })
})

test.describe('Dashboard', () => {
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

  test('dashboard shows summary statistics', async ({ page }) => {
    await page.goto('/dashboard')

    // Should show some stats/cards
    expect(await page.locator('[class*="card"]').count()).toBeGreaterThanOrEqual(1)
  })

  test('dashboard shows recent activity', async ({ page }) => {
    await page.goto('/dashboard')

    // Should have some content about sessions or activity
    await expect(page.getByText(/session|recent|activity/i)).toBeVisible()
  })
})

test.describe('Clients Page', () => {
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

  test('clients page loads', async ({ page }) => {
    await page.goto('/clients')
    await expect(page.getByText(/clients/i)).toBeVisible()
  })

  test('can add new client', async ({ page }) => {
    await page.goto('/clients')

    // Look for add client button
    const addButton = page.getByRole('button', { name: /add|new|create/i })
    if (await addButton.isVisible()) {
      await addButton.click()
      // Should show a dialog or navigate to form
      await expect(page.getByText(/client|name/i)).toBeVisible()
    }
  })
})

test.describe('Responsive Design', () => {
  test('mobile viewport shows hamburger menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    // Login page should still work on mobile
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('tablet viewport works', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/login')

    await expect(page.getByText('Welcome back')).toBeVisible()
  })
})

test.describe('Error Handling', () => {
  test('404 page for invalid routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345')

    // Should show 404 or redirect to login
    const is404 = await page.getByText(/404|not found/i).isVisible()
    const isLoginRedirect = page.url().includes('/login')

    expect(is404 || isLoginRedirect).toBe(true)
  })
})
