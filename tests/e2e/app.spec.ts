import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('signup page loads', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByText('Get Started')).toBeVisible()
  })

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByText('Reset your password', { exact: true })).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('invalid@test.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show error message
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Public Pages', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('sessions page redirects to login', async ({ page }) => {
    await page.goto('/sessions')
    await expect(page).toHaveURL(/\/login/)
  })

  test('invoices page redirects to login', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Navigation', () => {
  test('login page has link to signup', async ({ page }) => {
    await page.goto('/login')
    const signupLink = page.getByRole('link', { name: /sign up|create account|register/i })
    await expect(signupLink).toBeVisible()
  })

  test('signup page has link to login', async ({ page }) => {
    await page.goto('/signup')
    const loginLink = page.getByRole('link', { name: /sign in|log in/i })
    await expect(loginLink).toBeVisible()
  })
})

test.describe('Form Validation', () => {
  test('signup requires password confirmation', async ({ page }) => {
    await page.goto('/signup')

    // Fill form with mismatched passwords
    await page.getByLabel('Practice Name').fill('Test Practice')
    await page.getByLabel('Full Name').fill('Test User')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('Password123!')
    await page.getByLabel('Confirm Password').fill('Different123!')

    // Try to submit
    await page.getByRole('button', { name: /create practice/i }).click()

    // Should show password mismatch error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })
})
