import { execFile } from 'node:child_process'
import { GITHUB_REPO, ENVIRONMENTS } from '../config.mjs'

// ---- Supabase Management API (project status + unpause) ----

export async function supabaseProjectStatuses(accessToken) {
  if (!accessToken) return { error: 'SUPABASE_ACCESS_TOKEN not found in .env.local' }
  try {
    const res = await fetch('https://api.supabase.com/v1/projects', {
      headers: { authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return { error: `Management API ${res.status}` }
    const projects = await res.json()
    const byRef = new Map(projects.map(p => [p.id, p]))
    return {
      projects: ENVIRONMENTS.map(env => {
        const p = byRef.get(env.supabaseRef)
        return {
          env: env.key,
          ref: env.supabaseRef,
          name: env.supabaseName,
          status: p ? p.status : 'NOT_FOUND',
          region: p?.region,
        }
      }),
    }
  } catch (err) {
    return { error: err.name === 'TimeoutError' ? 'Management API timeout' : 'Management API unreachable' }
  }
}

export async function restoreSupabaseProject(accessToken, ref) {
  if (!accessToken) return { error: 'SUPABASE_ACCESS_TOKEN not found in .env.local' }
  if (!ENVIRONMENTS.some(e => e.supabaseRef === ref)) return { error: 'unknown project ref' }
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/restore`, {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    })
    if (res.ok) return { status: 'restoring', ref }
    return { error: `restore failed (${res.status}): ${(await res.text()).slice(0, 300)}` }
  } catch {
    return { error: 'Management API unreachable' }
  }
}

// ---- GitHub CI / deploy status via the gh CLI ----

function ghApi(path) {
  return new Promise(resolve => {
    // execFile without a shell: '&' in query strings needs no quoting. On
    // Windows, libuv resolves gh -> gh.exe via PATH.
    execFile('gh', ['api', path], { timeout: 15000, windowsHide: true }, (err, stdout) => {
      if (err) {
        resolve({ error: err.code === 'ENOENT' ? 'gh CLI not installed' : `gh: ${String(err.message).slice(0, 200)}` })
        return
      }
      try {
        resolve({ data: JSON.parse(stdout) })
      } catch {
        resolve({ error: 'gh returned non-JSON output' })
      }
    })
  })
}

let ciCache = { at: 0, value: null }

export async function ciStatus() {
  if (ciCache.value && Date.now() - ciCache.at < 60000) return ciCache.value

  const [runs, commitStatus] = await Promise.all([
    ghApi(`repos/${GITHUB_REPO}/actions/runs?branch=main&per_page=8`),
    ghApi(`repos/${GITHUB_REPO}/commits/main/status`),
  ])

  const value = { fetchedAt: new Date().toISOString() }

  if (runs.error) {
    value.error = runs.error
  } else {
    value.runs = (runs.data.workflow_runs || []).map(r => ({
      name: r.name,
      status: r.status,
      conclusion: r.conclusion,
      sha: r.head_sha?.slice(0, 7),
      message: r.head_commit?.message?.split('\n')[0],
      url: r.html_url,
      startedAt: r.run_started_at,
    }))
  }

  if (!commitStatus.error && commitStatus.data) {
    const vercel = (commitStatus.data.statuses || []).find(s => s.context === 'Vercel')
    value.deploy = {
      sha: commitStatus.data.sha?.slice(0, 7),
      state: vercel?.state || commitStatus.data.state,
      description: vercel?.description,
      url: vercel?.target_url,
    }
  }

  ciCache = { at: Date.now(), value }
  return value
}
