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

/**
 * One Management API call, retried once on a 5xx.
 *
 * The panel refreshes every 5 minutes and the API is occasionally flaky; a
 * single transient 502 rendering the whole cert panel red is how a dashboard
 * trains people to ignore it. Keep the call count low (see certStatus: two
 * round trips, not seven) and forgive one blip.
 */
async function query(accessToken, sql, attempt = 0) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${CERT_REF}/database/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query: sql }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) {
    if (res.status >= 500 && attempt === 0) {
      await new Promise(r => setTimeout(r, 1200))
      return query(accessToken, sql, 1)
    }
    // Include the body: a bare status hid a real SQL error behind what looked
    // like an upstream outage. 4xx here is almost always our own bad SQL.
    let detail = ''
    try {
      const body = await res.text()
      const m = body.match(/"message"\s*:\s*"([^"]{0,180})"/)
      detail = m ? ` — ${m[1]}` : ''
    } catch { /* body unreadable */ }
    throw new Error(`Management API ${res.status}${detail}`)
  }
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

  // ---- one round trip for everything scalar --------------------------------
  // Deliberately a single query. Seven separate Management API calls per refresh
  // made the panel flap red on transient 502s.
  let row
  try {
    const rows = await query(token, `
      select
        (select to_jsonb(m) from mca_cert.marker m) as marker,
        (select count(*) from public.clients)::int  as clients,
        (select count(*) from public.sessions)::int as sessions,
        (select count(*) from public.invoices)::int as invoices,
        (select count(*) from auth.users)::int      as auth_users,
        (select count(*) from public.organizations)::int as orgs,
        -- Presence only, never a count. service_rates exists solely while the
        -- pay-config overlay is applied, and Postgres parses the ENTIRE
        -- statement before executing it — so a static reference to the table
        -- errors at parse time even inside a CASE guarded by to_regclass.
        (to_regclass('public.service_rates') is not null) as has_service_rates,
        (select count(*) from pg_proc
          where proname in ('get_phi_fields','hash_for_audit','sanitize_phi_jsonb'))::int as helpers,
        (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid
          where not t.tgisinternal and c.oid='auth.users'::regclass
            and t.tgname='on_auth_user_created')::int as auth_trigger,
        (select count(*) from pg_policies where schemaname='storage')::int as storage_policies,
        (select count(*) from pg_trigger t
           join pg_class c on c.oid=t.tgrelid
           join pg_namespace n on n.oid=c.relnamespace
          where n.nspname='public' and not t.tgisinternal and t.tgenabled='D')::int as disabled_triggers,
        (select count(*) from public.users u
          where not exists (select 1 from auth.users a where a.id = u.id))::int as orphans,
        (select count(*) from auth.users
          where confirmation_token is null or recovery_token is null
             or email_change_token_new is null or email_change is null
             or email_change_token_current is null or phone_change is null
             or phone_change_token is null or reauthentication_token is null)::int as null_tokens,
        (select count(*) from public.clients
          where contact_email is not null and contact_email not like '%@${SINK_DOMAIN}')::int as leak_clients,
        (select count(*) from public.session_reminders
          where recipient_email not like '%@${SINK_DOMAIN}')::int as leak_reminders,
        (select count(*) from public.user_invites
          where invited_email not like '%@${SINK_DOMAIN}')::int as leak_invites,
        (select settings->'security'->>'require_mfa' from public.organizations limit 1) as mfa,
        (select count(*) from public.organizations where name like '[CERT]%')::int as marked
    `)
    row = rows?.[0]
  } catch (err) {
    // Most likely the free-tier project auto-paused after a week idle.
    return { ...out, error: `cert unreachable: ${err.message}` }
  }

  const marker = row?.marker
  if (!marker) return { ...out, error: 'mca_cert.marker missing — cert is not bootstrapped' }

  out.snapshot = marker.source_snapshot
  out.overlay = marker.overlay
  out.prewipeOverlay = marker.prewipe_overlay
  out.lastRefreshedAt = marker.last_refreshed_at
  out.ageHours = marker.last_refreshed_at
    ? (Date.now() - new Date(marker.last_refreshed_at).getTime()) / 3_600_000
    : null
  out.counts = {
    clients: row.clients,
    sessions: row.sessions,
    invoices: row.invoices,
    auth_users: row.auth_users,
    orgs: row.orgs,
    service_rates: null,
  }

  // Only safe to reference once we know it exists — see the note in the query.
  if (row.has_service_rates) {
    try {
      const [sr] = await query(token, `select count(*)::int as n from public.service_rates`)
      out.counts.service_rates = sr.n
    } catch { /* non-essential */ }
  }

  // ---- schema integrity ---------------------------------------------------
  // on_auth_user_created and the storage policies live OUTSIDE the public schema,
  // so `DROP SCHEMA public CASCADE` destroys them and a --schema=public restore
  // does not bring them back. Without them signup silently orphans profiles.
  add('PHI helper functions', row.helpers >= 3, `${row.helpers}/3 present`)
  add('on_auth_user_created', row.auth_trigger === 1,
    row.auth_trigger ? 'attached to auth.users' : 'MISSING — signup would orphan profiles')
  add('storage policies', row.storage_policies > 0, `${row.storage_policies} on storage.objects`)
  add('no disabled triggers', row.disabled_triggers === 0,
    row.disabled_triggers === 0 ? 'auditing active' : `${row.disabled_triggers} left disabled`)
  add('every profile signable', row.orphans === 0,
    row.orphans === 0 ? 'no orphaned profiles' : `${row.orphans} without an auth row`)

  // ---- auth is actually usable -------------------------------------------
  // Every other check can pass while sign-in is completely broken: GoTrue scans
  // auth.users into non-nullable Go strings, so one NULL token column makes the
  // admin API 500 and nobody can log in to cert at all.
  add('auth rows well-formed', row.null_tokens === 0,
    row.null_tokens === 0 ? 'no NULL token columns' : `${row.null_tokens} row(s) would break GoTrue sign-in`)

  // ---- safety: no real addresses -----------------------------------------
  const leaked = row.leak_clients + row.leak_reminders + row.leak_invites
  add('no real addresses', leaked === 0,
    leaked === 0 ? `all sunk to @${SINK_DOMAIN}` : `${leaked} real address(es) present`)

  // ---- fixed decisions ----------------------------------------------------
  add('require_mfa on', row.mfa === 'true', String(row.mfa))
  add('org marked [CERT]', row.marked > 0, row.marked > 0 ? 'yes' : 'NOT marked')

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

        // Negative control. Without it the positive probe cannot distinguish
        // "decryption works" from "this value was never encrypted".
        let refused = 0
        for (const r of rows) {
          try { await decrypt(r.notes, 'f'.repeat(64)) } catch { refused++ }
        }
        add('wrong key refused', refused === rows.length, `${refused}/${rows.length} (control)`)
      }
    } catch (err) {
      add('PHI decrypts', false, `probe failed: ${err.message}`)
    }
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
