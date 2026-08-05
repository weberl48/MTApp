import { test, expect } from '@playwright/test'
import { login, TEST_EMAIL } from './helpers'

// Galaxy S20+ CSS viewport — the reference device for the mobile shell
// (docs/superpowers/specs/2026-08-05-mobile-experience-design.md).
const MOBILE_VIEWPORT = { width: 412, height: 915 }

test.describe('Mobile shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT)
    await login(page)
    await page.goto('/dashboard')
  })

  test('the Primary tab bar is visible instead of the desktop sidebar', async ({ page }) => {
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden()
  })

  test('tapping the Sessions tab navigates to /sessions/', async ({ page }) => {
    const tabBar = page.getByRole('navigation', { name: 'Primary' })
    await tabBar.getByRole('link', { name: /sessions/i }).click()
    await expect(page).toHaveURL(/\/sessions\/?$/)
  })

  test('More opens a sheet with a Settings link', async ({ page }) => {
    await page.getByRole('button', { name: /^more$/i }).click()

    const moreNav = page.getByRole('navigation', { name: 'More navigation' })
    await expect(moreNav).toBeVisible()
    await expect(moreNav.getByRole('link', { name: /settings/i })).toBeVisible()
  })

  test('center action opens the quick-log drawer for a contractor, or the new-session form for staff', async ({ page }) => {
    const centerAction = page.getByLabel('Log new session')
    const isContractorAccount = TEST_EMAIL.includes('contractor')

    await centerAction.click()

    if (isContractorAccount) {
      await expect(page.getByRole('heading', { name: 'Quick Log' })).toBeVisible()
    } else {
      await expect(page).toHaveURL(/\/sessions\/new\/?$/)
    }
  })
})
