/**
 * Minimal, surgical edits to supabase/config.toml.
 *
 * Extracted from bootstrap.mjs so it can be exercised directly: two earlier
 * regex versions silently corrupted the file, and the CLI reports a broken
 * config only as "ProjectConfigParseError" with no line number.
 */
import { readFileSync, writeFileSync } from 'node:fs'

/** A TOML table header is a LINE of the form `[name]` — not any bracket. */
const isHeader = (l) => /^\s*\[[^\]]+\]\s*$/.test(l)

/**
 * Force `enabled = false` inside `[name]`, creating the section if absent.
 *
 * Matching section extent on any "[" (rather than on header LINES) cuts the
 * section short at a comment containing brackets, or at a value such as
 * `sql_paths = ["./seed.sql"]` — and the rewrite then corrupts the file. It must
 * also rewrite the existing key rather than adding a second one: a duplicate
 * `enabled` under one table is itself a parse error.
 *
 * Returns 'unchanged' | 'updated' | 'inserted' | 'added-section'.
 */
export function setSectionDisabled(text, name) {
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((l) => l.trim() === `[${name}]`)

  if (start === -1) {
    lines.push('', `[${name}]`, 'enabled = false')
    return { text: lines.join('\n'), result: 'added-section' }
  }

  let end = start + 1
  while (end < lines.length && !isHeader(lines[end])) end++

  const offset = lines.slice(start + 1, end).findIndex((l) => /^\s*enabled\s*=/.test(l))
  if (offset === -1) {
    lines.splice(start + 1, 0, 'enabled = false')
    return { text: lines.join('\n'), result: 'inserted' }
  }

  const idx = start + 1 + offset
  if (lines[idx].trim() === 'enabled = false') return { text, result: 'unchanged' }
  lines[idx] = 'enabled = false'
  return { text: lines.join('\n'), result: 'updated' }
}

/** Apply setSectionDisabled to a file on disk. */
export function disableCliSection(configPath, name) {
  const { text, result } = setSectionDisabled(readFileSync(configPath, 'utf8'), name)
  if (result !== 'unchanged') writeFileSync(configPath, text)
  return result
}

/**
 * Structural sanity check: every table appears once and no table declares the
 * same key twice. Cheap stand-in for a TOML parser, aimed at exactly the two
 * ways the earlier regex edits broke this file.
 */
export function findTomlDuplicates(text) {
  const problems = []
  const seenTables = new Map()
  let table = '(root)'
  let keys = new Set()

  text.split(/\r?\n/).forEach((line, i) => {
    if (isHeader(line)) {
      table = line.trim()
      if (seenTables.has(table)) {
        problems.push(`line ${i + 1}: duplicate table ${table} (first at ${seenTables.get(table)})`)
      }
      seenTables.set(table, i + 1)
      keys = new Set()
      return
    }
    const m = line.match(/^\s*([A-Za-z0-9_-]+)\s*=/)
    if (!m) return
    if (keys.has(m[1])) problems.push(`line ${i + 1}: duplicate key "${m[1]}" in ${table}`)
    keys.add(m[1])
  })

  return problems
}
