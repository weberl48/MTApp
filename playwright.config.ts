import { defineConfig, devices } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Load .env.local so authenticated specs actually run. Without this,
// TEST_USER_PASSWORD never reaches the test process and ~70% of the suite
// silently skips while still reporting green. No dotenv dependency: parse the
// two keys we need and never overwrite a value already set in the environment.
for (const key of ['TEST_USER_EMAIL', 'TEST_USER_PASSWORD']) {
  if (process.env[key]) continue
  try {
    const match = readFileSync('.env.local', 'utf8').match(
      new RegExp(`^${key}=("?)(.+?)\\1\\s*$`, 'm')
    )
    if (match) process.env[key] = match[2]
  } catch {
    // no .env.local — specs will skip, which is the intended fallback
  }
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
