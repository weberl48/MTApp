import { ENDPOINTS } from '../config.mjs'

async function timedFetch(url, options = {}, timeoutMs = 15000) {
  const start = Date.now()
  try {
    const res = await fetch(url, {
      ...options,
      // manual: a Vercel-SSO redirect must be recognised, not silently followed
      // to a login page that then answers 200 and looks like a healthy app.
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'cache-control': 'no-cache', ...options.headers },
    })
    if (isSsoRedirect(res)) return { protected: true, ms: Date.now() - start }
    // Follow ordinary redirects (e.g. trailingSlash) the way we used to.
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (loc) {
        const followed = await fetch(new URL(loc, url), {
          ...options,
          redirect: 'follow',
          signal: AbortSignal.timeout(timeoutMs),
          headers: { 'cache-control': 'no-cache', ...options.headers },
        })
        if (isSsoRedirect(followed)) return { protected: true, ms: Date.now() - start }
        return { res: followed, ms: Date.now() - start }
      }
    }
    return { res, ms: Date.now() - start }
  } catch (err) {
    return { error: err.cause?.code || err.name || 'fetch failed', ms: Date.now() - start }
  }
}

/** Vercel Deployment Protection bounces unauthenticated requests to its SSO. */
function isSsoRedirect(res) {
  if (res.status < 300 || res.status >= 400) return false
  const loc = res.headers.get('location') || ''
  return loc.includes('vercel.com/sso') || loc.includes('/.well-known/vercel/sso')
}

/** Header that lets automation past Deployment Protection, when configured. */
function bypassHeaders(env) {
  return env.bypassSecret ? { 'x-vercel-protection-bypass': env.bypassSecret } : {}
}

/**
 * Full health picture for one environment: liveness, readiness, and the
 * aggregate /api/health report (per-check detail appears when the app trusts
 * us — always in local dev, only with CRON_SECRET against production).
 */
export async function checkEnvironmentHealth(env, cronSecret) {
  // Environments with no pinned URL (cert, whose Preview host is per-deployment)
  // have nothing to probe. Report that honestly rather than as a failure — a
  // permanently-red card teaches people to ignore the dashboard.
  if (!env.baseUrl) {
    return {
      env: env.key,
      checkedAt: new Date().toISOString(),
      status: 'not-probed',
      live: null,
      ready: null,
      latencyMs: null,
      version: null,
      checks: null,
      detailHidden: false,
      note: 'No fixed URL — see the Cert panel for database health.',
    }
  }

  const bypass = bypassHeaders(env)
  const headers = { ...bypass, ...(cronSecret ? { authorization: `Bearer ${cronSecret}` } : {}) }

  const [live, ready, health] = await Promise.all([
    timedFetch(`${env.baseUrl}/api/health/live/`, { headers: bypass }),
    timedFetch(`${env.baseUrl}/api/health/ready/`, { headers: bypass }),
    timedFetch(`${env.baseUrl}/api/health/`, { headers }),
  ])

  const result = {
    env: env.key,
    checkedAt: new Date().toISOString(),
    live: probeSummary(live),
    ready: probeSummary(ready),
    status: 'down',
    latencyMs: health.ms,
    version: null,
    checks: null,
    detailHidden: false,
  }

  // Behind Vercel SSO with no bypass secret. The deployment is almost certainly
  // fine — we simply are not allowed to ask. Reporting 'down' here would cry
  // wolf every 5 minutes, so say what is actually true.
  if (health.protected) {
    result.status = 'protected'
    result.note =
      'Behind Vercel Deployment Protection. Enable Protection Bypass for Automation and set CERT_BYPASS_SECRET to health-check it.'
    return result
  }

  if (health.error) {
    result.status = 'down'
    result.error = health.error
    return result
  }

  try {
    const body = await health.res.json()
    result.status = body.status || (health.res.ok ? 'healthy' : 'unhealthy')
    result.version = body.version || null
    result.checks = body.checks || null
    result.detailHidden = !body.checks
  } catch {
    result.status = health.res.ok ? 'healthy' : 'unhealthy'
  }
  return result
}

function probeSummary(probe) {
  // Walled off by Deployment Protection: neither reachable nor broken.
  if (probe.protected) return { ok: null, ms: probe.ms, protected: true }
  if (probe.error) return { ok: false, ms: probe.ms, error: probe.error }
  return { ok: probe.res.ok, ms: probe.ms, statusCode: probe.res.status }
}

/**
 * Unauthenticated smoke sweep of the API surface. A protected route answering
 * 401/404 is exactly what we want to see; 5xx or a network error is a failure.
 */
export async function sweepEndpoints(env) {
  if (!env.baseUrl) {
    return {
      env: env.key,
      ranAt: new Date().toISOString(),
      summary: { pass: 0, warn: 0, fail: 0, skip: ENDPOINTS.length },
      note: `${env.name} has no fixed URL to sweep. Set CERT_APP_URL to pin one.`,
      results: ENDPOINTS.map(ep => ({ ...ep, result: 'skip', note: 'no base URL' })),
    }
  }

  const queue = [...ENDPOINTS]
  const results = []

  async function worker() {
    while (queue.length) {
      const ep = queue.shift()
      if (ep.skip) {
        results.push({ ...ep, result: 'skip', note: ep.skip })
        continue
      }
      const options = { method: ep.method, headers: { ...bypassHeaders(env) } }
      if (ep.method === 'POST') {
        options.headers['content-type'] = 'application/json'
        options.body = '{}'
      }
      const expected = ep.expectByEnv?.[env.key] ?? ep.expect
      const { res, error, ms, protected: walled } = await timedFetch(`${env.baseUrl}${ep.path}`, options, 12000)
      if (walled) {
        results.push({ ...ep, result: 'skip', ms, note: 'behind Deployment Protection' })
      } else if (error) {
        results.push({ ...ep, result: 'fail', ms, note: error })
      } else if (expected.includes(res.status)) {
        results.push({ ...ep, result: 'pass', ms, statusCode: res.status })
      } else if (res.status >= 500) {
        results.push({ ...ep, result: 'fail', ms, statusCode: res.status, note: `server error ${res.status}` })
      } else {
        results.push({
          ...ep,
          result: 'warn',
          ms,
          statusCode: res.status,
          note: `expected ${expected.join('/')}, got ${res.status}`,
        })
      }
    }
  }

  // Gentle concurrency — stays well under the app's 60 req/min API rate limit.
  await Promise.all(Array.from({ length: 4 }, worker))

  const order = new Map(ENDPOINTS.map((e, i) => [e.method + e.path, i]))
  results.sort((a, b) => order.get(a.method + a.path) - order.get(b.method + b.path))

  return {
    env: env.key,
    ranAt: new Date().toISOString(),
    summary: {
      pass: results.filter(r => r.result === 'pass').length,
      warn: results.filter(r => r.result === 'warn').length,
      fail: results.filter(r => r.result === 'fail').length,
      skip: results.filter(r => r.result === 'skip').length,
    },
    results,
  }
}
