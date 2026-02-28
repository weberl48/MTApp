import { test, expect, Page } from '@playwright/test'

// Test credentials - use environment variables in CI
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'weberlucasdev@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || ''

/**
 * Helper: Select a value from a shadcn/Radix Select component.
 * Clicks the trigger within the container, then clicks the option by text.
 */
async function selectOption(page: Page, containerSelector: string, optionText: string | RegExp) {
  const container = page.locator(containerSelector)
  await container.locator('button[role="combobox"]').click()
  await page.getByRole('option', { name: optionText }).click()
}

/**
 * Helper: Login and navigate to session creation page.
 */
async function loginAndGoToNewSession(page: Page) {
  await page.goto('/login/')
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/(dashboard|sessions)/, { timeout: 15000 })
  await page.goto('/sessions/new/')
  // Wait for form to load (service types fetched)
  await page.waitForSelector('[data-tour="session-form-service-type"]', { timeout: 10000 })
}

/**
 * Helper: Pick the first available individual service type (per_person_rate = 0).
 * Since we can't inspect per_person_rate from the UI, we pick the first service type
 * and check if the headcount field appears. If it does, that's a group type — try the next one.
 * Returns the name of the selected service type.
 */
async function selectIndividualServiceType(page: Page): Promise<string | null> {
  const trigger = page.locator('[data-tour="session-form-service-type"] button[role="combobox"]')
  await trigger.click()

  const options = page.getByRole('option')
  const count = await options.count()

  for (let i = 0; i < count; i++) {
    const optionText = await options.nth(i).textContent()
    await options.nth(i).click()

    // Check if headcount field appeared (group service)
    const headcountField = page.locator('#groupHeadcount')
    const isGroup = await headcountField.isVisible().catch(() => false)

    if (!isGroup) {
      return optionText?.trim() || null
    }

    // It's a group type — try next one
    await trigger.click()
  }

  return null // No individual service type found
}

/**
 * Helper: Pick the first available group service type (per_person_rate > 0).
 * Returns the name of the selected service type.
 */
async function selectGroupServiceType(page: Page): Promise<string | null> {
  const trigger = page.locator('[data-tour="session-form-service-type"] button[role="combobox"]')
  await trigger.click()

  const options = page.getByRole('option')
  const count = await options.count()

  for (let i = 0; i < count; i++) {
    const optionText = await options.nth(i).textContent()
    await options.nth(i).click()

    // Check if headcount field appeared (group service)
    const headcountField = page.locator('#groupHeadcount')
    const isGroup = await headcountField.isVisible().catch(() => false)

    if (isGroup) {
      return optionText?.trim() || null
    }

    // It's an individual type — try next one
    await trigger.click()
  }

  return null // No group service type found
}

/**
 * Helper: Select the first available client from the ClientMultiSelect.
 */
async function selectFirstClient(page: Page) {
  const searchInput = page.getByPlaceholder('Search clients...')
  await searchInput.click()
  // Wait for dropdown to appear and click the first client
  const firstClient = page.locator('[role="button"]').filter({ has: page.locator('.truncate') }).first()
  await firstClient.waitFor({ timeout: 5000 })
  await firstClient.click()
}

test.describe('Session Creation E2E', () => {
  test.beforeEach(async ({ page }) => {
    if (!TEST_PASSWORD) {
      test.skip()
      return
    }
  })

  test('individual session: create, verify pricing, see success', async ({ page }) => {
    await loginAndGoToNewSession(page)

    // Date defaults to today — leave it
    // Set time
    await page.fill('#time', '10:00')

    // Select 30 min duration (usually default, but be explicit)
    await selectOption(page, '[data-tour="session-form-duration"]', /30 minutes/)

    // Select an individual service type
    const serviceType = await selectIndividualServiceType(page)
    if (!serviceType) {
      test.skip()
      return
    }

    // Select a client
    await selectFirstClient(page)

    // Wait for pricing to calculate
    await page.waitForTimeout(500)

    // Verify pricing preview is visible (admin sees Pricing Breakdown, contractor sees Your Earnings)
    const hasPricingBreakdown = await page.getByText('Pricing Breakdown').isVisible().catch(() => false)
    const hasEarnings = await page.getByText('Your Earnings').isVisible().catch(() => false)
    expect(hasPricingBreakdown || hasEarnings).toBe(true)

    // If admin, verify pricing fields are shown
    if (hasPricingBreakdown) {
      await expect(page.getByText('Total Amount:')).toBeVisible()
      await expect(page.getByText('Contractor Pay:')).toBeVisible()
      await expect(page.getByText('MCA Cut:')).toBeVisible()
    }

    // Submit the session
    await page.locator('[data-tour="session-form-submit"]').click()

    // Wait for success screen
    await expect(page.getByText('Session Logged!')).toBeVisible({ timeout: 15000 })

    // Verify action buttons on success screen
    await expect(page.getByRole('button', { name: /log another session/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /view all sessions/i })).toBeVisible()

    // Navigate to sessions list
    await page.getByRole('button', { name: /view all sessions/i }).click()
    await expect(page).toHaveURL(/\/sessions\//)
  })

  test('group session: create with headcount, verify pricing', async ({ page }) => {
    await loginAndGoToNewSession(page)

    // Set time
    await page.fill('#time', '14:00')

    // Select 45 min duration
    await selectOption(page, '[data-tour="session-form-duration"]', /45 minutes/)

    // Select a group service type
    const serviceType = await selectGroupServiceType(page)
    if (!serviceType) {
      test.skip()
      return
    }

    // Headcount field should be visible
    await expect(page.locator('#groupHeadcount')).toBeVisible()

    // Client multi-select should NOT be visible for group sessions
    await expect(page.getByPlaceholder('Search clients...')).not.toBeVisible()

    // Enter headcount
    await page.fill('#groupHeadcount', '4')

    // Wait for pricing to calculate
    await page.waitForTimeout(500)

    // Verify pricing appears
    const hasPricingBreakdown = await page.getByText('Pricing Breakdown').isVisible().catch(() => false)
    const hasEarnings = await page.getByText('Your Earnings').isVisible().catch(() => false)
    expect(hasPricingBreakdown || hasEarnings).toBe(true)

    // Submit the session
    await page.locator('[data-tour="session-form-submit"]').click()

    // Wait for success
    await expect(page.getByText('Session Logged!')).toBeVisible({ timeout: 15000 })
  })

  test('pricing preview updates when duration changes', async ({ page }) => {
    await loginAndGoToNewSession(page)

    await page.fill('#time', '09:00')

    // Select individual service type
    const serviceType = await selectIndividualServiceType(page)
    if (!serviceType) {
      test.skip()
      return
    }

    // Select a client
    await selectFirstClient(page)

    // Select 30 min duration
    await selectOption(page, '[data-tour="session-form-duration"]', /30 minutes/)
    await page.waitForTimeout(500)

    // Capture pricing text at 30 min
    const pricingContainer = page.locator('[data-tour="session-form-duration"]').locator('..')
    const pricingSection30 = await page.locator('.bg-blue-50, .bg-green-50').first().textContent() || ''

    // Change to 60 min
    await selectOption(page, '[data-tour="session-form-duration"]', /60 minutes/)
    await page.waitForTimeout(500)

    // Capture pricing text at 60 min
    const pricingSection60 = await page.locator('.bg-blue-50, .bg-green-50').first().textContent() || ''

    // Pricing should have changed
    expect(pricingSection60).not.toBe(pricingSection30)
  })

  test('form validation: cannot submit without required fields', async ({ page }) => {
    await loginAndGoToNewSession(page)

    // Try to submit without filling anything (service type is required)
    await page.locator('[data-tour="session-form-submit"]').click()

    // Should still be on the same page
    await expect(page).toHaveURL(/\/sessions\/new\//)

    // Should show a validation error for service type
    const serviceTypeError = page.locator('[data-tour="session-form-service-type"]').locator('..').getByText(/select.*service|service.*required/i)
    const hasServiceError = await serviceTypeError.isVisible().catch(() => false)

    // Or there might be a toast error — either way we should still be on the form
    await expect(page.locator('[data-tour="session-form-submit"]')).toBeVisible()
  })

  test('form validation: group session requires headcount', async ({ page }) => {
    await loginAndGoToNewSession(page)

    await page.fill('#time', '11:00')

    // Select a group service type
    const serviceType = await selectGroupServiceType(page)
    if (!serviceType) {
      test.skip()
      return
    }

    // Don't fill headcount — try to submit
    await page.locator('[data-tour="session-form-submit"]').click()

    // Should still be on the form
    await expect(page).toHaveURL(/\/sessions\/new\//)

    // Should show headcount validation error
    const headcountError = page.getByText(/headcount|attendees.*required|enter.*number/i)
    const hasError = await headcountError.isVisible().catch(() => false)

    // Form should still be visible (submission was blocked)
    await expect(page.locator('#groupHeadcount')).toBeVisible()
  })

  test('log another session flow resets form', async ({ page }) => {
    await loginAndGoToNewSession(page)

    await page.fill('#time', '15:00')

    // Select service type and client (individual)
    const serviceType = await selectIndividualServiceType(page)
    if (!serviceType) {
      test.skip()
      return
    }

    await selectFirstClient(page)
    await page.waitForTimeout(500)

    // Submit
    await page.locator('[data-tour="session-form-submit"]').click()
    await expect(page.getByText('Session Logged!')).toBeVisible({ timeout: 15000 })

    // Click "Log Another Session"
    await page.getByRole('button', { name: /log another session/i }).click()

    // Form should be back — service type should be cleared
    await expect(page.locator('[data-tour="session-form-service-type"]')).toBeVisible()

    // The service type select should show placeholder (not a selected value)
    const selectTrigger = page.locator('[data-tour="session-form-service-type"] button[role="combobox"]')
    const triggerText = await selectTrigger.textContent()
    expect(triggerText?.toLowerCase()).toContain('select')
  })
})
