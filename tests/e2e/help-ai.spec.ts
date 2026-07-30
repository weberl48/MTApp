import { test, expect } from '@playwright/test'
import { login } from './helpers'

// UI tests need ANTHROPIC_API_KEY set (the chat hides itself otherwise); CI skips.
test.skip(!process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY not set')

test.describe('AI help chat', () => {
  test('bubble opens the chat on a dashboard page', async ({ page }) => {
    await login(page)
    await page.goto('/sessions/')
    await page.getByRole('button', { name: 'Ask the AI helper' }).click()
    await expect(page.getByRole('heading', { name: 'Ask the AI helper' })).toBeVisible()
    await expect(page.getByText(/don't include client names/i)).toBeVisible()
  })

  // Costs real API credits — opt in explicitly with HELP_AI_E2E=1.
  test('answers a scholarship question with sources', async ({ page }) => {
    test.skip(process.env.HELP_AI_E2E !== '1', 'HELP_AI_E2E not enabled (needs API credits)')
    test.setTimeout(120000) // streamed answer can take a while on a cold prompt cache
    await login(page)
    await page.goto('/help/')
    // The floating bubble is also named "Ask the AI helper" — target the panel teaser uniquely.
    await page.getByRole('button', { name: /get an answer instead of searching/i }).click()
    await page.getByPlaceholder('Ask how something works…').fill('How do scholarship invoices work?')
    await page.getByRole('button', { name: 'Send question' }).click()
    const answer = page.locator('.mr-4').last()
    await expect(answer).toContainText(/scholarship/i, { timeout: 60000 })
    await expect(answer.getByRole('link').first()).toBeVisible({ timeout: 60000 })
  })
})
