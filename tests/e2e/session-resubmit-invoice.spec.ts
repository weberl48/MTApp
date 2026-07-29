import { test, expect, Page } from '@playwright/test'

// Test credentials - use environment variables in CI
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'weberlucasdev@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || ''

async function login(page: Page) {
  await page.goto('/login/')
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/(dashboard|sessions)/, { timeout: 15000 })
}

/**
 * Helper: Pick the first available individual service type (no headcount field).
 * Same approach as session-creation.spec.ts.
 */
async function selectIndividualServiceType(page: Page): Promise<string | null> {
  const trigger = page.locator('[data-tour="session-form-service-type"] button[role="combobox"]')
  await trigger.click()

  const options = page.getByRole('option')
  const count = await options.count()

  for (let i = 0; i < count; i++) {
    const optionText = await options.nth(i).textContent()
    await options.nth(i).click()

    const headcountField = page.locator('#groupHeadcount')
    const isGroup = await headcountField.isVisible().catch(() => false)
    if (!isGroup) {
      return optionText?.trim() || null
    }
    await trigger.click()
  }
  return null
}

async function selectFirstClient(page: Page) {
  const searchInput = page.getByPlaceholder('Search clients...')
  await searchInput.click()
  const firstClient = page.locator('[role="button"]').filter({ has: page.locator('.truncate') }).first()
  await firstClient.waitFor({ timeout: 5000 })
  await firstClient.click()
}

test.describe('P0 regression: draft submitted later still gets an invoice', () => {
  test.beforeEach(async () => {
    if (!TEST_PASSWORD) {
      test.skip()
    }
  })

  test('save as draft, then submit via edit — invoice is created', async ({ page }) => {
    await login(page)
    await page.goto('/sessions/new/')
    await page.waitForSelector('[data-tour="session-form-service-type"]', { timeout: 10000 })

    await page.fill('#time', '08:15')
    const serviceType = await selectIndividualServiceType(page)
    if (!serviceType) {
      test.skip()
      return
    }
    await selectFirstClient(page)
    await page.waitForTimeout(500)

    // Save as DRAFT
    await page.locator('input[name="status"][value="draft"]').check()
    await page.locator('[data-tour="session-form-submit"]').click()
    await expect(page.getByText('Session Logged!')).toBeVisible({ timeout: 15000 })

    // Open the newest draft from the sessions list (today's date sorts first)
    await page.goto('/sessions/')
    const draftRow = page.locator('a[href*="/sessions/"]').filter({ hasText: /draft/i }).first()
    await draftRow.waitFor({ timeout: 10000 })
    await draftRow.click()
    await page.waitForURL(/\/sessions\/[0-9a-f-]+\//, { timeout: 10000 })

    // Edit → switch to Submit for approval → save
    await page.getByRole('link', { name: /edit/i }).or(page.getByRole('button', { name: /edit/i })).first().click()
    await page.waitForSelector('[data-tour="session-form-service-type"]', { timeout: 10000 })
    await page.locator('input[name="status"][value="submitted"]').check()
    await page.locator('[data-tour="session-form-submit"]').click()

    // The fix's direct signal: the edit path reports invoice creation
    await expect(page.getByText(/session updated and invoice(s)? created/i)).toBeVisible({ timeout: 15000 })

    // Second signal: back on the detail page, no "Create Invoice" recovery button
    await page.waitForURL(/\/sessions\/[0-9a-f-]+\//, { timeout: 10000 })
    await expect(page.getByRole('button', { name: /create invoice/i })).not.toBeVisible()
  })
})
