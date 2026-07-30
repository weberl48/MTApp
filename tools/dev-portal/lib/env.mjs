import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

/**
 * Minimal .env.local parser — the portal only needs SUPABASE_ACCESS_TOKEN
 * (Management API) and, if present, CRON_SECRET (unlocks prod health detail).
 * Values are never sent to the browser.
 */
export function loadRepoEnv() {
  const env = {}
  let raw = ''
  try {
    raw = readFileSync(join(REPO_ROOT, '.env.local'), 'utf8')
  } catch {
    // No repo .env.local (e.g. running in the Pi container) — env vars only.
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  // Real environment variables win (the container has no .env.local).
  for (const key of ['SUPABASE_ACCESS_TOKEN', 'CRON_SECRET']) {
    if (process.env[key]) env[key] = process.env[key]
  }
  return env
}

export { REPO_ROOT }
