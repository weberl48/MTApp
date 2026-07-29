import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ERROR_MAX_ENTRIES, HISTORY_MAX_POINTS } from '../config.mjs'

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')

function loadJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'))
  } catch {
    return fallback
  }
}

const saveTimers = new Map()
function saveJsonDebounced(file, getData) {
  clearTimeout(saveTimers.get(file))
  saveTimers.set(
    file,
    setTimeout(() => {
      try {
        mkdirSync(DATA_DIR, { recursive: true })
        writeFileSync(join(DATA_DIR, file), JSON.stringify(getData()))
      } catch (err) {
        console.error(`[portal] failed to persist ${file}:`, err.message)
      }
    }, 2000)
  )
}

// ---- Captured errors (ring buffer, newest first) ----

let errors = loadJson('errors.json', [])
let nextErrorId = errors.reduce((max, e) => Math.max(max, e.id || 0), 0) + 1

export function addError(entry) {
  const record = {
    id: nextErrorId++,
    ts: new Date().toISOString(),
    source: entry.source === 'backend' ? 'backend' : 'frontend',
    kind: String(entry.kind || 'error').slice(0, 60),
    message: String(entry.message || '(no message)').slice(0, 2000),
    stack: entry.stack ? String(entry.stack).slice(0, 6000) : undefined,
    url: entry.url ? String(entry.url).slice(0, 500) : undefined,
  }
  errors.unshift(record)
  if (errors.length > ERROR_MAX_ENTRIES) errors = errors.slice(0, ERROR_MAX_ENTRIES)
  saveJsonDebounced('errors.json', () => errors)
  return record
}

export function listErrors() {
  return errors
}

export function clearErrors() {
  errors = []
  saveJsonDebounced('errors.json', () => errors)
}

// ---- Health history per environment ----

// { [envKey]: Array<{ t: epoch-ms, status: string, ms: number|null }> }
let history = loadJson('history.json', {})

export function addHistoryPoint(envKey, status, ms) {
  if (!history[envKey]) history[envKey] = []
  history[envKey].push({ t: Date.now(), status, ms })
  if (history[envKey].length > HISTORY_MAX_POINTS) {
    history[envKey] = history[envKey].slice(-HISTORY_MAX_POINTS)
  }
  saveJsonDebounced('history.json', () => history)
}

export function getHistory() {
  return history
}
