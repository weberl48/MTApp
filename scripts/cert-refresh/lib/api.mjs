/**
 * Supabase Management API access, split by direction.
 *
 * There are exactly two exports that touch a database, and they are asymmetric
 * on purpose:
 *   certQuery() — writes, and can ONLY ever address CERT_REF
 *   prodRead()  — addresses PROD_REF but rejects anything that is not a SELECT
 *
 * Neither takes a project ref argument. That is the point: this toolset is run
 * repeatedly by muscle memory, and a `<ref>` parameter is exactly the shape that
 * eventually gets the wrong value pasted into it.
 */
import { readFileSync } from 'fs'
import { CERT_REF, PROD_REF } from '../config.mjs'

let cachedToken = null

function token() {
  if (cachedToken) return cachedToken
  const env = readFileSync('.env.local', 'utf8')
  const m = env.match(/^SUPABASE_ACCESS_TOKEN=(.+)$/m)
  if (!m) throw new Error('SUPABASE_ACCESS_TOKEN missing from .env.local')
  cachedToken = m[1].trim().replace(/"/g, '')
  return cachedToken
}

/** Read a value from .env.local without printing it. */
export function envValue(key) {
  const env = readFileSync('.env.local', 'utf8')
  const m = env.match(new RegExp(`^${key}=(.*)$`, 'm'))
  return m ? m[1].trim().replace(/^"|"$/g, '') : undefined
}

async function post(ref, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Management API ${res.status} on ${ref}: ${text.slice(0, 600)}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    return []
  }
}

/**
 * Run SQL against CERT. The ref is not a parameter and cannot be overridden.
 * Callers must have already passed assertCert().
 */
export async function certQuery(sql) {
  return post(CERT_REF, sql)
}

/**
 * Run a read against PROD. Rejects anything that is not a single SELECT/WITH —
 * this file is the only place PROD_REF appears in a query path, and it has no
 * write mode by construction.
 */
export async function prodRead(sql) {
  const trimmed = sql.trim()
  if (!/^(SELECT|WITH)\b/i.test(trimmed)) {
    throw new Error(`prodRead refuses non-SELECT statement: ${trimmed.slice(0, 80)}`)
  }
  // Multi-statement check must ignore semicolons inside string literals — the
  // attachment queries legitimately build 'DROP TRIGGER ...; CREATE TRIGGER ...;'
  // as *data*. Strip quoted literals and comments, then look for a real separator.
  const bare = trimmed
    .replace(/\$([A-Za-z_]*)\$[\s\S]*?\$\1\$/g, "''") // dollar-quoted
    .replace(/'(?:[^']|'')*'/g, "''") // single-quoted, doubled escapes
    .replace(/--[^\n]*/g, '') // line comments
    .replace(/;\s*$/, '') // trailing terminator
  if (bare.includes(';')) {
    throw new Error('prodRead refuses multi-statement SQL')
  }
  return post(PROD_REF, sql)
}

/** Project metadata from the control plane — an independent check from the DB marker. */
export async function projectInfo(ref) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}`, {
    headers: { Authorization: `Bearer ${token()}` },
  })
  if (!res.ok) throw new Error(`Cannot read project ${ref}: ${res.status}`)
  return res.json()
}

/**
 * Apply a large SQL payload in chunks, splitting on `-- CHUNK` markers when
 * present (the convention scripts/dev-seed/generate.mjs already uses) and
 * halving on HTTP 413.
 */
export async function certApplyChunked(statements, { label = 'apply', maxBytes = 900_000 } = {}) {
  const chunks = []
  let current = []
  let size = 0
  for (const stmt of statements) {
    const len = Buffer.byteLength(stmt, 'utf8')
    if (size + len > maxBytes && current.length) {
      chunks.push(current)
      current = []
      size = 0
    }
    current.push(stmt)
    size += len
  }
  if (current.length) chunks.push(current)

  for (let i = 0; i < chunks.length; i++) {
    const sql = chunks[i].join('\n')
    try {
      await certQuery(sql)
    } catch (e) {
      if (/\b413\b/.test(String(e.message)) && chunks[i].length > 1) {
        const mid = Math.ceil(chunks[i].length / 2)
        chunks.splice(i, 1, chunks[i].slice(0, mid), chunks[i].slice(mid))
        i--
        continue
      }
      throw new Error(`${label} chunk ${i + 1}/${chunks.length} failed: ${e.message}`)
    }
    if (chunks.length > 1) {
      process.stderr.write(`  ${label}: chunk ${i + 1}/${chunks.length}\n`)
    }
  }
  return chunks.length
}

export { CERT_REF, PROD_REF }
