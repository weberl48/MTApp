import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../.auth/user.json')

/**
 * Authentication setup - runs once before all tests
 * Saves session to reuse across tests (faster execution)
 *
 * To use: Set TEST_USER_EMAIL and TEST_USER_PASSWORD env variables
 * Then add to playwright.config.ts:
 *
 * projects: [
 *   { name: 'setup', testMatch: /auth\.setup\.ts/ },
 *   {
 *     name: 'chromium',
 *     use: { storageState: 'tests/.auth/user.json' },
 *     dependencies: ['setup']
 *   }
 * ]
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    console.log('Skipping auth setup - no credentials provided')
    return
  }

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()

  // Wait for successful login
  await page.waitForURL(/\/(dashboard|sessions)/, { timeout: 10000 })

  // Verify we're logged in
  await expect(page).not.toHaveURL(/\/login/)

  // Save authentication state
  await page.context().storageState({ path: authFile })
})
