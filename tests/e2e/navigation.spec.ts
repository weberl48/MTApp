import { test, expect } from '@playwright/test'
import { login } from './helpers'


test.describe('Smoke Tests - Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
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

    // Invoices lives under the collapsible "Billing" group — expand it first
    await page.getByRole('button', { name: /billing/i }).click()
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
    await login(page)
  })

  test('dashboard shows summary statistics', async ({ page }) => {
    await page.goto('/dashboard')

    // Cards render after the client-side data load — wait for one, then count
    const cards = page.locator('[data-slot="card"], [class*="card"]')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
    expect(await cards.count()).toBeGreaterThanOrEqual(1)
  })

  test('dashboard shows recent activity', async ({ page }) => {
    await page.goto('/dashboard')

    // Should have some content about sessions or activity. Scoped to <main>:
    // the mobile tab bar and its "Sessions" label are always in the DOM (CSS-
    // hidden at desktop widths, not unmounted — see tab-bar.tsx), so the
    // unscoped locator now resolves to it too and trips Playwright's
    // strict-mode "must match exactly one element" check.
    await expect(page.locator('main').getByText(/session|recent|activity/i).first()).toBeVisible()
  })
})

test.describe('Clients Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('clients page loads', async ({ page }) => {
    await page.goto('/clients')
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible()
  })

  test('can add new client', async ({ page }) => {
    await page.goto('/clients')

    // This spec used to pass vacuously: isVisible() doesn't auto-wait, so on a
    // still-loading page the if-branch skipped the whole body — and its broad
    // getByText(/client|name/i) assertion was a guaranteed strict-mode
    // violation whenever the branch DID run. Assert the real flow instead.
    const addButton = page.getByRole('button', { name: /add client/i })
    await expect(addButton).toBeVisible({ timeout: 10000 })
    await addButton.click()
    await expect(page.getByRole('heading', { name: /add new client/i })).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  // Renamed from "mobile viewport shows hamburger menu" — it never actually
  // asserted a hamburger (this describe block predates login, so it only
  // exercised the public /login page); the hamburger it was named for is gone
  // now anyway (sidebar.tsx dropped the mobile drawer entirely). The real
  // dashboard nav-chrome assertion this name implied lives in the test below
  // and in tests/e2e/mobile-shell.spec.ts, both against the actual dashboard.
  test('mobile viewport renders the login page', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    // Login page should still work on mobile
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible()
  })

  test('tablet viewport works', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/login')

    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('mobile viewport shows the Primary tab bar, not the desktop sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 })
    await login(page)
    await page.goto('/dashboard')

    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden()
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
