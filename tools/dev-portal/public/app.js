/* MCA Dev Portal frontend. Talks only to the portal server (same origin). */

const state = {
  meta: null,
  overview: null,
  history: {},
  supabase: null,
  ci: null,
  errors: [],
  errorFilter: 'all',
  sweeping: false,
  lastSweep: null,
}

const $ = sel => document.querySelector(sel)

async function fetchJson(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json()
}

function esc(text) {
  const div = document.createElement('div')
  div.textContent = text == null ? '' : String(text)
  return div.innerHTML
}

const STATUS_LABEL = { healthy: 'Healthy', degraded: 'Degraded', unhealthy: 'Unhealthy', down: 'Down' }

function fmtTime(iso) {
  const d = new Date(iso)
  const today = new Date().toDateString() === d.toDateString()
  const hms = d.toLocaleTimeString([], { hour12: false })
  return today ? hms : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${hms}`
}

function relTime(iso) {
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`
  return `${Math.round(secs / 86400)}d ago`
}

// ---- Environment cards ----

function renderEnvCards() {
  if (!state.meta) return
  const grid = $('#env-grid')
  grid.innerHTML = state.meta.environments
    .map(env => {
      const health = state.overview?.environments.find(e => e.env === env.key)
      const supabase = state.supabase?.projects?.find(p => p.env === env.key)
      return envCardHtml(env, health, supabase)
    })
    .join('')

  for (const env of state.meta.environments) {
    buildPulseStrip(env.key)
    const restoreBtn = $(`#restore-${env.key}`)
    if (restoreBtn) restoreBtn.addEventListener('click', () => restoreProject(env.supabaseRef, restoreBtn))
  }
}

function envCardHtml(env, health, supabase) {
  const status = health?.status || 'down'
  const points = state.history[env.key] || []
  const upPct = points.length
    ? Math.round((points.filter(p => p.status !== 'down').length / points.length) * 1000) / 10
    : null

  const probes = health
    ? `<div class="probe-row">
        ${probeHtml('live', health.live)}
        ${probeHtml('ready', health.ready)}
        ${health.latencyMs != null && status !== 'down' ? `<span class="probe"><b>${health.latencyMs}ms</b> health</span>` : ''}
      </div>`
    : ''

  let checks = ''
  if (health?.checks) {
    checks = `<ul class="check-list">${Object.entries(health.checks)
      .map(([name, c]) => {
        const cls = c.status === 'pass' ? 'check-pass' : c.status === 'warn' ? 'check-warn' : 'check-fail'
        const mark = c.status === 'pass' ? '✓' : c.status === 'warn' ? '~' : '✗'
        return `<li class="${cls}"><span class="check-mark">${mark}</span><span class="check-name">${esc(name)}</span><span class="check-msg">${esc(c.message)}${c.latency ? ` · ${c.latency}ms` : ''}</span></li>`
      })
      .join('')}</ul>`
  } else if (health && health.detailHidden && status !== 'down') {
    checks = `<p class="lock-note">Per-check detail is locked. Add <span class="mono">CRON_SECRET</span> to <span class="mono">.env.local</span> (matching the Vercel value) to unlock it, then restart the portal.</p>`
  } else if (status === 'down' && env.key === 'local') {
    checks = `<p class="lock-note">Dev server isn't responding — start it with <span class="mono">npm run dev</span>.</p>`
  } else if (status === 'down') {
    checks = `<p class="lock-note">Not reachable${health?.error ? ` — ${esc(health.error)}` : ''}.</p>`
  }

  let supabaseRow = ''
  if (supabase) {
    const s = supabase.status
    const cls = s === 'ACTIVE_HEALTHY' ? 'ok' : s === 'INACTIVE' ? 'paused' : 'moving'
    const label = s === 'ACTIVE_HEALTHY' ? 'active' : s === 'INACTIVE' ? 'paused' : s.toLowerCase().replace(/_/g, ' ')
    supabaseRow = `<div class="supabase-row">
      <span class="label">Supabase · ${esc(supabase.name)}</span>
      <span style="display:flex;align-items:center;gap:10px">
        <span class="supabase-status ${cls}">${esc(label)}</span>
        ${s === 'INACTIVE' ? `<button class="btn btn-accent" id="restore-${env.key}">Restore project</button>` : ''}
      </span>
    </div>`
  } else if (state.supabase?.error) {
    supabaseRow = `<div class="supabase-row"><span class="label">Supabase · ${esc(env.supabaseName)}</span><span class="supabase-status">${esc(state.supabase.error)}</span></div>`
  }

  return `<article class="env-card" aria-label="${esc(env.name)}">
    <div class="env-card-head">
      <div><h2>${esc(env.name)}</h2><p class="sub">${esc(env.subtitle)}</p></div>
      <span class="status-badge status-${status}"><span class="status-dot"></span>${STATUS_LABEL[status] || esc(status)}</span>
    </div>
    ${probes}
    <div class="pulse-strip" id="pulse-${env.key}"></div>
    ${checks}
    ${supabaseRow}
    <div class="card-footer">
      <div class="card-links" style="border-top:0;padding-top:0">
        ${env.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.label)} ↗</a>`).join('')}
      </div>
      <div class="meta-bits">
        ${health?.version ? `<span>v ${esc(health.version)}</span>` : ''}
        ${upPct != null ? `<span>${upPct}% up</span>` : ''}
      </div>
    </div>
  </article>`
}

function probeHtml(name, probe) {
  if (!probe) return ''
  const ok = probe.ok
  return `<span class="probe ${ok ? 'ok' : 'bad'}"><b>${ok ? '✓' : '✗'}</b> ${name}${probe.ms != null ? ` ${probe.ms}ms` : ''}</span>`
}

// The signature element: health history as a waveform-style bar strip.
// Height = latency (sqrt scale), color = status for that sample.
function buildPulseStrip(envKey) {
  const host = $(`#pulse-${envKey}`)
  if (!host) return
  const all = state.history[envKey] || []
  if (!all.length) {
    host.innerHTML = `<p class="muted" style="font-size:12px;margin:0">Collecting history — samples land every ${Math.round((state.meta?.pollIntervalMs || 300000) / 60000)} min while the portal runs.</p>`
    return
  }

  const points = all.slice(-160)
  // Right-align into a fixed timeline so a young history renders as thin bars
  // near "now" instead of stretching to fill the strip.
  const SLOT = 5, BAR = 3, H = 56
  const slots = Math.max(points.length, 60)
  const offset = slots - points.length
  const width = slots * SLOT
  const maxMs = Math.max(...points.map(p => p.ms || 0), 1)
  const colors = { healthy: 'var(--good)', degraded: 'var(--warn)', unhealthy: 'var(--bad)', down: 'var(--down)' }

  const bars = points
    .map((p, i) => {
      const h = p.ms == null ? 3 : Math.max(4, Math.round(Math.sqrt(p.ms / maxMs) * (H - 8)))
      return `<rect x="${(offset + i) * SLOT}" y="${H - h}" width="${BAR}" height="${h}" rx="1.5" fill="${colors[p.status] || 'var(--down)'}" />`
    })
    .join('')

  host.innerHTML = `
    <svg viewBox="0 0 ${width} ${H}" preserveAspectRatio="none" role="img" aria-label="Health history for ${envKey}"></svg>
    <div class="strip-caption"><span>${fmtTime(new Date(points[0].t).toISOString())}</span><span>${points.length} samples</span><span>now</span></div>
    <details><summary>View data</summary>${stripTable(points.slice(-12))}</details>`
  host.querySelector('svg').innerHTML = bars

  const svg = host.querySelector('svg')
  const tooltip = $('#tooltip')
  svg.addEventListener('mousemove', e => {
    const rect = svg.getBoundingClientRect()
    const slot = Math.floor(((e.clientX - rect.left) / rect.width) * slots)
    const idx = Math.min(points.length - 1, slot - offset)
    if (idx < 0) {
      tooltip.hidden = true
      return
    }
    const p = points[idx]
    tooltip.hidden = false
    tooltip.innerHTML = `${fmtTime(new Date(p.t).toISOString())} · ${STATUS_LABEL[p.status] || p.status}${p.ms != null ? ` · ${p.ms}ms` : ''}`
    tooltip.style.left = `${Math.min(e.clientX + 12, window.innerWidth - 200)}px`
    tooltip.style.top = `${e.clientY + 14}px`
  })
  svg.addEventListener('mouseleave', () => { tooltip.hidden = true })
}

function stripTable(points) {
  return `<table><thead><tr><th>time</th><th>status</th><th>latency</th></tr></thead><tbody>
    ${points.map(p => `<tr><td>${fmtTime(new Date(p.t).toISOString())}</td><td>${STATUS_LABEL[p.status] || esc(p.status)}</td><td>${p.ms != null ? `${p.ms}ms` : '—'}</td></tr>`).join('')}
  </tbody></table>`
}

async function restoreProject(ref, btn) {
  btn.disabled = true
  btn.textContent = 'Restoring…'
  try {
    await fetchJson('/api/supabase/restore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ref }),
    })
    btn.textContent = 'Restore requested'
  } catch {
    btn.textContent = 'Restore failed'
    btn.disabled = false
  }
}

// ---- Endpoint sweep ----

function renderSweepActions() {
  $('#sweep-actions').innerHTML = state.meta.environments
    .map(env => `<button class="btn" data-sweep="${env.key}" ${state.sweeping ? 'disabled' : ''}>Sweep ${esc(env.name)}</button>`)
    .join('')
  document.querySelectorAll('[data-sweep]').forEach(btn =>
    btn.addEventListener('click', () => runSweep(btn.dataset.sweep))
  )
}

async function runSweep(envKey) {
  state.sweeping = true
  renderSweepActions()
  $('#sweep-results').innerHTML = `<p class="muted empty">Sweeping ${esc(envKey)} — ${state.meta.endpointCount} endpoints…</p>`
  try {
    state.lastSweep = await fetchJson(`/api/endpoints?env=${envKey}`)
  } catch (err) {
    $('#sweep-results').innerHTML = `<p class="muted empty">Sweep failed: ${esc(err.message)}</p>`
    state.sweeping = false
    renderSweepActions()
    return
  }
  state.sweeping = false
  renderSweepActions()
  renderSweepResults()
}

function renderSweepResults() {
  const sweep = state.lastSweep
  if (!sweep) return
  const envName = state.meta.environments.find(e => e.key === sweep.env)?.name || sweep.env
  const { pass, warn, fail, skip } = sweep.summary
  $('#sweep-results').innerHTML = `
    <div class="sweep-summary">
      <span>${esc(envName)} · ${fmtTime(sweep.ranAt)}</span>
      <span class="pass">${pass} pass</span>
      ${warn ? `<span class="warn">${warn} warn</span>` : ''}
      ${fail ? `<span class="fail">${fail} fail</span>` : ''}
      <span class="skip">${skip} skipped</span>
    </div>
    <div class="data-table-wrap">
      <table class="data">
        <thead><tr><th>Result</th><th>Method</th><th>Endpoint</th><th>Status</th><th>Latency</th><th>Note</th></tr></thead>
        <tbody>
          ${sweep.results
            .map(r => `<tr>
              <td><span class="result-badge result-${r.result}">${r.result.toUpperCase()}</span></td>
              <td class="mono">${r.method}</td>
              <td class="path">${esc(r.path)}</td>
              <td class="num">${r.statusCode ?? '—'}</td>
              <td class="num">${r.ms != null ? `${r.ms}ms` : '—'}</td>
              <td>${esc(r.note || '')}</td>
            </tr>`)
            .join('')}
        </tbody>
      </table>
    </div>`
}

// ---- Error feed ----

function renderErrors() {
  const feed = $('#error-feed')
  const filtered = state.errors.filter(e => state.errorFilter === 'all' || e.source === state.errorFilter)
  if (!filtered.length) {
    feed.innerHTML = `<p class="muted empty">No ${state.errorFilter === 'all' ? '' : state.errorFilter + ' '}errors captured yet.</p>`
    return
  }
  feed.innerHTML = filtered
    .slice(0, 100)
    .map(e => `<div class="error-item source-${e.source}">
      <div class="error-item-head">
        <span class="error-source">${e.source}</span>
        <span class="error-time">${fmtTime(e.ts)}</span>
        <span class="error-kind">${esc(e.kind)}</span>
      </div>
      <p class="error-message">${esc(e.message)}</p>
      ${e.url ? `<p class="error-url">${esc(e.url)}</p>` : ''}
      ${e.stack ? `<details><summary>Stack trace</summary><pre>${esc(e.stack)}</pre></details>` : ''}
    </div>`)
    .join('')
}

function wireErrorControls() {
  document.querySelectorAll('.chip').forEach(chip =>
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c === chip))
      state.errorFilter = chip.dataset.filter
      renderErrors()
    })
  )
  $('#test-error').addEventListener('click', async () => {
    await fetchJson('/api/errors', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'frontend',
        kind: 'test',
        message: 'Test error sent from the dev portal',
        url: location.href,
      }),
    }).catch(() => {})
    refreshErrors()
  })
  $('#clear-errors').addEventListener('click', async () => {
    await fetch('/api/errors', { method: 'DELETE' }).catch(() => {})
    refreshErrors()
  })
}

// ---- CI panel ----

function renderCi() {
  const panel = $('#ci-panel')
  const ci = state.ci
  if (!ci) return
  if (ci.error) {
    panel.innerHTML = `<p class="muted empty">${esc(ci.error)} — CI status needs the <span class="mono">gh</span> CLI authenticated as weberl48.</p>`
    return
  }
  const deploy = ci.deploy
  const deployCls =
    deploy?.state === 'success' ? 'ci-success' : deploy?.state === 'failure' || deploy?.state === 'error' ? 'ci-failure' : 'ci-pending'
  panel.innerHTML = `
    <div class="ci-grid">
      ${deploy ? `<div class="deploy-line">
        <span class="label">Vercel deploy · main @ ${esc(deploy.sha)}</span>
        <span class="ci-conclusion ${deployCls}">${esc(deploy.state)}</span>
        ${deploy.description ? `<span class="muted">${esc(deploy.description)}</span>` : ''}
        ${deploy.url ? `<a class="mono" style="color:var(--accent);text-decoration:none" href="${esc(deploy.url)}" target="_blank" rel="noreferrer">open ↗</a>` : ''}
      </div>` : ''}
      <div class="data-table-wrap">
        <table class="data">
          <thead><tr><th>Workflow</th><th>Result</th><th>Commit</th><th>Started</th><th></th></tr></thead>
          <tbody>
            ${(ci.runs || [])
              .map(r => {
                const cls = r.conclusion === 'success' ? 'ci-success' : r.conclusion === 'failure' ? 'ci-failure' : r.status !== 'completed' ? 'ci-pending' : 'ci-neutral'
                return `<tr>
                  <td>${esc(r.name)}</td>
                  <td><span class="ci-conclusion ${cls}">${esc(r.conclusion || r.status)}</span></td>
                  <td><span class="mono">${esc(r.sha)}</span> ${esc(r.message || '')}</td>
                  <td class="num">${r.startedAt ? relTime(r.startedAt) : '—'}</td>
                  <td><a href="${esc(r.url)}" target="_blank" rel="noreferrer">logs ↗</a></td>
                </tr>`
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </div>`
}

// ---- Refresh loops ----

async function refreshOverview() {
  try {
    const [overview, history] = await Promise.all([fetchJson('/api/overview'), fetchJson('/api/history')])
    state.overview = overview
    state.history = history.history
    renderEnvCards()
    $('#last-refresh').textContent = `checked ${new Date().toLocaleTimeString([], { hour12: false })}`
  } catch {
    $('#last-refresh').textContent = 'portal unreachable'
  }
}

async function refreshErrors() {
  try {
    state.errors = (await fetchJson('/api/errors')).errors
    renderErrors()
  } catch { /* portal restarting — next poll catches up */ }
}

async function refreshExternal() {
  const [supabase, ci] = await Promise.all([
    fetchJson('/api/supabase').catch(() => null),
    fetchJson('/api/ci').catch(() => null),
  ])
  if (supabase) state.supabase = supabase
  if (ci) state.ci = ci
  renderEnvCards()
  renderCi()
}

async function init() {
  state.meta = await fetchJson('/api/meta')
  $('#global-links').innerHTML = state.meta.globalLinks
    .map(l => `<a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.label)}</a>`)
    .join('')
  renderSweepActions()
  wireErrorControls()
  $('#refresh-now').addEventListener('click', () => {
    refreshOverview()
    refreshErrors()
    refreshExternal()
  })

  await Promise.all([refreshOverview(), refreshErrors(), refreshExternal()])

  setInterval(() => { if (!document.hidden) refreshOverview() }, 60000)
  setInterval(() => { if (!document.hidden) refreshErrors() }, 10000)
  setInterval(() => { if (!document.hidden) refreshExternal() }, 5 * 60000)
}

init().catch(err => {
  $('#env-grid').innerHTML = `<p class="muted">Portal failed to load: ${esc(err.message)}</p>`
})
