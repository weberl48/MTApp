/**
 * Cert environment status.
 *
 * Cert has no stable app URL — Vercel Preview deployments are per-PR — so the
 * usual HTTP liveness sweep tells you nothing about it. What IS stable, and what
 * actually matters, is the cert database: how stale it is, which branch overlay
 * is applied, whether its PHI still decrypts, and whether any real email address
 * has crept back in.
 *
 * This mirrors the assertions in scripts/cert-refresh/verify-cert.mts. Keep the
 * two in step: that script is the gate, this is the always-on dashboard view.
 */
import { CERT_REF, CERT_SINK_DOMAIN as SINK_DOMAIN } from '../config.mjs'

async function query(accessToken, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${CERT_REF}/database/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query: sql }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Management API ${res.status}`)
  return res.json()
}

/**
 * Decrypt one PHI value using the same scheme as src/lib/crypto/index.ts:
 * PBKDF2(key, salt, 100k, SHA-256) -> AES-256-GCM, stored as
 * 'enc:' + base64(salt || iv || ciphertext).
 */
async function decrypt(stored, passphrase) {
  const raw = Buffer.from(stored.slice(4), 'base64')
  const salt = raw.subarray(0, 16)
  const iv = raw.subarray(16, 28)
  const ct = raw.subarray(28)
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
  )
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct))
}

export async function certStatus(repoEnv) {
  const token = repoEnv.SUPABASE_ACCESS_TOKEN
  if (!token) return { error: 'SUPABASE_ACCESS_TOKEN not found in .env.local' }

  const out = { ref: CERT_REF, checkedAt: new Date().toISOString(), checks: [] }
  const add = (name, ok, detail) => out.checks.push({ name, ok, detail })

  // ---- marker -------------------------------------------------------------
  let marker
  try {
    const rows = await query(token, `
      select project_ref, label, source_snapshot, overlay, prewipe_overlay,
             last_refreshed_at, bootstrapped_at
      from mca_cert.marker
    `)
    marker = rows?.[0]
  } catch (err) {
    // The single most likely cause is the free-tier project having auto-paused.
    return { ...out, error: `cert unreachable: ${err.message}` }
  }

  if (!marker) return { ...out, error: 'mca_cert.marker missing — cert is not bootstrapped' }

  out.snapshot = marker.source_snapshot
  out.overlay = marker.overlay
  out.prewipeOverlay = marker.prewipe_overlay
  out.lastRefreshedAt = marker.last_refreshed_at
  out.ageHours = marker.last_refreshed_at
    ? (Date.now() - new Date(marker.last_refreshed_at).getTime()) / 3_600_000
    : null

  // ---- volume -------------------------------------------------------------
  try {
    const [counts] = await query(token, `
      select
        (select count(*) from public.clients)         as clients,
        (select count(*) from public.sessions)        as sessions,
        (select count(*) from public.invoices)        as invoices,
        (select count(*) from public.service_rates)   as service_rates,
        (select count(*) from auth.users)             as auth_users,
        (select count(*) from public.organizations)   as orgs
    `).catch(async () => {
      // service_rates only exists while the pay-config overlay is applied.
      return query(token, `
        select
          (select count(*) from public.clients)       as clients,
          (select count(*) from public.sessions)      as sessions,
          (select count(*) from public.invoices)      as invoices,
          null                                        as service_rates,
          (select count(*) from auth.users)           as auth_users,
          (select count(*) from public.organizations) as orgs
      `)
    })
    out.counts = counts
  } catch {
    out.counts = null
  }

  // ---- safety: no real addresses -----------------------------------------
  try {
    const [leak] = await query(token, `
      select
        (select count(*) from public.clients
           where contact_email is not null and contact_email not like '%@${SINK_DOMAIN}') as clients,
        (select count(*) from public.session_reminders
           where recipient_email not like '%@${SINK_DOMAIN}')                              as reminders,
        (select count(*) from public.user_invites
           where invited_email not like '%@${SINK_DOMAIN}')                                as invites
    `)
    const total = Number(leak.clients) + Number(leak.reminders) + Number(leak.invites)
    add('no real addresses', total === 0,
      total === 0 ? `all sunk to @${SINK_DOMAIN}` : `${total} real address(es) present`)
  } catch (err) {
    add('no real addresses', false, `check failed: ${err.message}`)
  }

  // ---- safety: PHI still decrypts ----------------------------------------
  // The reason this is on the dashboard at all: a wrong ENCRYPTION_KEY fails
  // SILENTLY (decryptField swallows it and returns the raw `enc:` string), and
  // /api/health only checks the key is 64 hex chars — it never decrypts. So a
  // broken cert looks perfectly healthy everywhere else.
  const key = repoEnv.CERT_ENCRYPTION_KEY
  if (!key) {
    add('PHI decrypts', null, 'CERT_ENCRYPTION_KEY not available here')
  } else {
    try {
      const rows = await query(token,
        `select notes from public.sessions where notes like 'enc:%' limit 2`)
      if (!rows.length) {
        add('PHI decrypts', null, 'no encrypted rows to probe')
      } else {
        let ok = 0
        for (const r of rows) {
          try {
            const pt = await decrypt(r.notes, key)
            if (pt && !pt.startsWith('enc:')) ok++
          } catch { /* counted as failure */ }
        }
        add('PHI decrypts', ok === rows.length, `${ok}/${rows.length} sampled`)
      }
    } catch (err) {
      add('PHI decrypts', false, `probe failed: ${err.message}`)
    }
  }

  // ---- auth is actually usable -------------------------------------------
  // Every other check here can pass while sign-in is completely broken: GoTrue
  // scans auth.users into non-nullable Go strings, so one NULL token column
  // makes the admin API 500 and nobody can log in to cert at all.
  try {
    const [bad] = await query(token, `
      select count(*)::int as n from auth.users
      where confirmation_token is null or recovery_token is null
         or email_change_token_new is null or email_change is null
         or email_change_token_current is null or phone_change is null
         or phone_change_token is null or reauthentication_token is null
    `)
    add('auth rows well-formed', bad.n === 0,
      bad.n === 0 ? 'no NULL token columns' : `${bad.n} row(s) would break GoTrue sign-in`)
  } catch (err) {
    add('auth rows well-formed', false, `check failed: ${err.message}`)
  }

  // ---- safety: MFA + cert marking ----------------------------------------
  try {
    const [org] = await query(token, `
      select settings->'security'->>'require_mfa' as mfa,
             (name like '[CERT]%') as marked
      from public.organizations limit 1
    `)
    add('require_mfa on', org?.mfa === 'true', String(org?.mfa))
    add('org marked [CERT]', !!org?.marked, org?.marked ? 'yes' : 'NOT marked')
  } catch (err) {
    add('require_mfa on', false, `check failed: ${err.message}`)
  }

  // ---- staleness ----------------------------------------------------------
  // Free-tier cert auto-pauses after ~1 week idle, so a stale cert is also a
  // cert that is about to stop responding.
  if (out.ageHours != null) {
    add('refreshed recently', out.ageHours < 24 * 7,
      out.ageHours < 24
        ? `${out.ageHours.toFixed(1)}h ago`
        : `${(out.ageHours / 24).toFixed(1)} days ago`)
  }

  out.ok = out.checks.every(c => c.ok !== false)
  return out
}
