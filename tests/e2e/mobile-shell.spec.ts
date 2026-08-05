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

test.describe('Mobile shell — invoices as cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT)
    await login(page)
  })

  test('the first card shows the amount, a status badge, and a Mark Paid action — no sideways scroll', async ({ page }) => {
    // Mark Paid only renders for an admin/owner viewing a 'sent' invoice
    // (InvoiceTable's showActions && isAdmin && invoice.status === 'sent'
    // gate) — this spec targets the seeded owner account, same as the rest
    // of this file's default TEST_EMAIL.
    test.skip(TEST_EMAIL.includes('contractor'), 'Mark Paid is an admin/owner-only action')

    // ?tab=sent (InvoicesPage reads it from the URL on load) guarantees the
    // list is invoices whose raw status is 'sent', so the Mark Paid button
    // is present regardless of whether any of them have also gone overdue.
    await page.goto('/invoices/?tab=sent')

    const firstActions = page.locator('[data-tour="invoice-row-actions"]').first()
    await expect(firstActions).toBeVisible()
    await expect(firstActions.getByRole('button', { name: /mark paid/i })).toBeVisible()
    await expect(firstActions.locator('[data-slot="badge"]').first()).toBeVisible()

    // The amount (trailing, tabular-nums) sits in the title row — a sibling
    // of the actions footer within the same MobileListItem card.
    const firstCard = firstActions.locator(
      'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " bg-card ")][1]'
    )
    await expect(firstCard.locator('.tabular-nums').first()).toBeVisible()

    const noHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth === document.documentElement.clientWidth
    )
    expect(noHorizontalScroll).toBe(true)
  })
})
