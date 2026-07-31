/**
 * Import first in every cert-refresh script.
 *
 * These are operator tools run under time pressure against a database holding
 * real PHI. A refusal must read as a clear instruction, not a V8 stack trace —
 * an operator who can't tell "the guard stopped you" from "the script crashed"
 * will start reaching for --force.
 */
import { readFileSync, existsSync } from 'fs'

// Load .env.local into process.env. Every script imports this module first, and
// ES import evaluation is ordered, so config.mjs sees the values. Existing
// process.env wins, so a shell override still works.
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    if (process.env[key] !== undefined) continue
    process.env[key] = m[2].trim().replace(/^"(.*)"$/, '$1')
  }
}

process.on('unhandledRejection', (err) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(`\n✗ ${msg}\n`)
  if (process.env.CERT_DEBUG && err instanceof Error) console.error(err.stack)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error(`\n✗ ${err.message}\n`)
  if (process.env.CERT_DEBUG) console.error(err.stack)
  process.exit(1)
})
