#!/usr/bin/env node
/**
 * MCA Dev Portal — local developer dashboard for the MCA App.
 *
 * Zero dependencies; requires Node 20+. Run with: npm run portal
 * Serves the dashboard on http://localhost:4321 and polls both environments
 * (local dev server + production) for health/latency history while running.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, dirname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PORT, ENVIRONMENTS, GLOBAL_LINKS, ENDPOINTS, POLL_INTERVAL_MS } from './config.mjs'
import { loadRepoEnv } from './lib/env.mjs'
import { addError, listErrors, clearErrors, addHistoryPoint, getHistory } from './lib/store.mjs'
import { checkEnvironmentHealth, sweepEndpoints } from './lib/checks.mjs'
import { supabaseProjectStatuses, restoreSupabaseProject, ciStatus } from './lib/external.mjs'

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), 'public')
const repoEnv = loadRepoEnv()

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
}

function findEnv(key) {
  return ENVIRONMENTS.find(e => e.key === key)
}

function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': 'http://localhost:3000',
    'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type',
  })
  res.end(payload)
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', chunk => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('payload too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function handleApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`

  if (req.method === 'OPTIONS') {
    json(res, 204, {})
    return
  }

  switch (route) {
    case 'GET /api/meta': {
      // Config for the frontend — no secrets, only shape/links.
      json(res, 200, {
        environments: ENVIRONMENTS.map(({ key, name, subtitle, baseUrl, supabaseRef, supabaseName, links }) => ({
          key, name, subtitle, baseUrl, supabaseRef, supabaseName, links,
        })),
        globalLinks: GLOBAL_LINKS,
        endpointCount: ENDPOINTS.length,
        hasCronSecret: Boolean(repoEnv.CRON_SECRET),
        hasSupabaseToken: Boolean(repoEnv.SUPABASE_ACCESS_TOKEN),
        pollIntervalMs: POLL_INTERVAL_MS,
      })
      return
    }
    case 'GET /api/overview': {
      const results = await Promise.all(
        ENVIRONMENTS.map(env => checkEnvironmentHealth(env, repoEnv.CRON_SECRET))
      )
      json(res, 200, { environments: results })
      return
    }
    case 'GET /api/endpoints': {
      const env = findEnv(url.searchParams.get('env'))
      if (!env) {
        json(res, 400, { error: 'unknown env — use ?env=local or ?env=prod' })
        return
      }
      json(res, 200, await sweepEndpoints(env))
      return
    }
    case 'GET /api/errors': {
      json(res, 200, { errors: listErrors() })
      return
    }
    case 'POST /api/errors': {
      let body
      try {
        body = JSON.parse(await readBody(req))
      } catch {
        json(res, 400, { error: 'invalid JSON' })
        return
      }
      json(res, 200, { ok: true, id: addError(body).id })
      return
    }
    case 'DELETE /api/errors': {
      clearErrors()
      json(res, 200, { ok: true })
      return
    }
    case 'GET /api/history': {
      json(res, 200, { history: getHistory(), pollIntervalMs: POLL_INTERVAL_MS })
      return
    }
    case 'GET /api/supabase': {
      json(res, 200, await supabaseProjectStatuses(repoEnv.SUPABASE_ACCESS_TOKEN))
      return
    }
    case 'POST /api/supabase/restore': {
      let ref
      try {
        ref = JSON.parse(await readBody(req)).ref
      } catch {
        json(res, 400, { error: 'invalid JSON' })
        return
      }
      const result = await restoreSupabaseProject(repoEnv.SUPABASE_ACCESS_TOKEN, ref)
      json(res, result.error ? 502 : 200, result)
      return
    }
    case 'GET /api/ci': {
      json(res, 200, await ciStatus())
      return
    }
    default:
      json(res, 404, { error: 'not found' })
  }
}

async function serveStatic(res, pathname) {
  const rel = pathname === '/' ? 'index.html' : pathname.slice(1)
  const file = normalize(join(PUBLIC_DIR, rel))
  if (!file.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end('forbidden')
    return
  }
  try {
    const content = await readFile(file)
    const ext = file.slice(file.lastIndexOf('.'))
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' })
    res.end(content)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found')
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url)
    } else {
      await serveStatic(res, url.pathname)
    }
  } catch (err) {
    console.error('[portal] request error:', err.message)
    if (!res.headersSent) json(res, 500, { error: 'internal error' })
  }
})

// ---- Background health/latency sampling for the history sparklines ----

async function samplePoint() {
  for (const env of ENVIRONMENTS) {
    try {
      const health = await checkEnvironmentHealth(env, repoEnv.CRON_SECRET)
      addHistoryPoint(env.key, health.status, health.status === 'down' ? null : health.latencyMs)
    } catch {
      addHistoryPoint(env.key, 'down', null)
    }
  }
}

server.listen(PORT, () => {
  console.log(`\n  MCA Dev Portal → http://localhost:${PORT}\n`)
  console.log(`  Watching: ${ENVIRONMENTS.map(e => `${e.name} (${e.baseUrl})`).join(', ')}`)
  console.log(`  Supabase Management API: ${repoEnv.SUPABASE_ACCESS_TOKEN ? 'connected' : 'no token found'}`)
  console.log(`  Prod health detail: ${repoEnv.CRON_SECRET ? 'unlocked via CRON_SECRET' : 'status-only (add CRON_SECRET to .env.local to unlock)'}\n`)
  samplePoint()
  setInterval(samplePoint, POLL_INTERVAL_MS)
})
