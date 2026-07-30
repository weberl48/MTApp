/**
 * Prove cert is a usable, faithful, safe copy of prod. Read-only.
 *
 * The load-bearing check is the PAIRED decrypt probe. decryptField() catches a
 * wrong-key failure and returns the raw `enc:` string, and /api/health only
 * validates that ENCRYPTION_KEY is 64 hex characters — it never decrypts
 * anything. So a wrong-key cert renders `enc:AAAA...` in every notes field and
 * reports healthy. A positive probe alone proves nothing either: it must be
 * paired with a negative probe under a deliberately wrong key, or you cannot
 * distinguish "decryption works" from "this value was never encrypted".
 *
 * Usage:  npx tsx scripts/cert-refresh/verify-cert.mts [--json]
 */
import './lib/run.mjs'
import { certQuery, envValue } from './lib/api.mjs'
import { assertCert } from './lib/guards.mjs'
import { SINK_DOMAIN, TESTERS } from './config.mjs'

type Check = { name: string; ok: boolean; detail: string }
const checks: Check[] = []
const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail })

await assertCert()

// 1 ---------------------------------------------------------------- marker
const [marker] = await certQuery(
  `select project_ref, source_snapshot, overlay, prewipe_overlay, last_refreshed_at from mca_cert.marker`
)
const age = marker.last_refreshed_at
  ? (Date.now() - new Date(marker.last_refreshed_at).getTime()) / 3_600_000
  : Infinity
add('marker', Number.isFinite(age), `snapshot=${marker.source_snapshot} overlay=${marker.overlay ?? 'none'} age=${age.toFixed(1)}h`)

// 2 ---------------------------------------------------- PHI helper functions
const [{ fns }] = await certQuery(
  `select count(*)::int as fns from pg_proc where proname in ('get_phi_fields','hash_for_audit','sanitize_phi_jsonb')`
)
add('phi helpers present', fns >= 3, `${fns}/3`)

const [{ wired }] = await certQuery(
  `select pg_get_functiondef('audit_trigger_function()'::regprocedure) like '%sanitize_phi_jsonb%' as wired`
)
add('audit trigger sanitizes PHI', !!wired, wired ? 'wired' : 'NOT wired')

// 3 ------------------------------------------------------ no disabled triggers
const [{ disabled }] = await certQuery(`
  select count(*)::int as disabled from pg_trigger t
  join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and not t.tgisinternal and t.tgenabled='D'
`)
add('no triggers left disabled', disabled === 0, `${disabled} disabled`)

// 4 --------------------------------------------------- cross-schema attachments
const [{ authtrg }] = await certQuery(`
  select count(*)::int as authtrg from pg_trigger t join pg_class c on c.oid=t.tgrelid
  where not t.tgisinternal and c.oid='auth.users'::regclass and t.tgname='on_auth_user_created'
`)
add('on_auth_user_created present', authtrg === 1, authtrg ? 'present' : 'MISSING — signup would create profile-less users')

const [{ storagepol }] = await certQuery(
  `select count(*)::int as storagepol from pg_policies where schemaname='storage'`
)
add('storage policies restored', storagepol > 0, `${storagepol} policies`)

// 5 ------------------------------------------------------- profiles are signable
const [{ orphans }] = await certQuery(`
  select count(*)::int as orphans from public.users u
  where not exists (select 1 from auth.users a where a.id = u.id)
`)
add('every profile has an auth row', orphans === 0, `${orphans} orphaned`)

// 6/7 ------------------------------------------------- PAIRED decrypt probes
const certKey = envValue('CERT_ENCRYPTION_KEY') || process.env.ENCRYPTION_KEY
if (!certKey) throw new Error('CERT_ENCRYPTION_KEY missing from .env.local — cannot probe decryption')

const blobs = await certQuery(
  `select notes from public.sessions where notes like 'enc:%' limit 3`
)

async function decrypt(stored: string, passphrase: string): Promise<string> {
  const raw = Buffer.from(stored.slice(4), 'base64')
  const salt = raw.subarray(0, 16), iv = raw.subarray(16, 28), ct = raw.subarray(28)
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    material, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct))
}

if (blobs.length === 0) {
  add('decrypt probe', false, 'no enc: values found — cannot prove the key is right')
} else {
  let good = 0
  for (const b of blobs) {
    try {
      const pt = await decrypt(b.notes, certKey)
      if (pt.length > 0 && !pt.startsWith('enc:')) good++
    } catch { /* counted as failure */ }
  }
  add('PHI decrypts with cert key', good === blobs.length, `${good}/${blobs.length} (positive probe)`)

  // Negative control: the same values under a wrong key MUST fail. Without this
  // the positive probe cannot distinguish real decryption from plaintext.
  let wrongFailed = 0
  const wrongKey = 'f'.repeat(64)
  for (const b of blobs) {
    try { await decrypt(b.notes, wrongKey) } catch { wrongFailed++ }
  }
  add('wrong key is rejected', wrongFailed === blobs.length, `${wrongFailed}/${blobs.length} (negative control)`)
}

// 8 ------------------------------------------- double-encryption detector
const [{ dbl }] = await certQuery(`
  select count(*)::int as dbl from public.sessions
  where notes like 'enc:%' and notes like '%enc:%enc:%'
`)
add('no double-encrypted rows', dbl === 0, `${dbl} suspicious`)

// 9 ----------------------------------------------------------- email sink
const testerList = TESTERS.length ? TESTERS.map((t) => `'${t}'`).join(',') : `''`
const [leak] = await certQuery(`
  select
    (select count(*) from public.clients           where contact_email is not null and contact_email not like '%@${SINK_DOMAIN}') as clients,
    (select count(*) from public.session_reminders where recipient_email not like '%@${SINK_DOMAIN}')                              as reminders,
    (select count(*) from public.user_invites      where invited_email not like '%@${SINK_DOMAIN}')                                as invites,
    (select count(*) from auth.users               where lower(email) not in (${testerList}) and email not like '%@${SINK_DOMAIN}') as auth_users
`)
const totalLeak = Object.values(leak).reduce((a: number, b) => a + Number(b), 0)
add('no real addresses outside sink', totalLeak === 0, JSON.stringify(leak))

// 10 ---------------------------------------------------------- fixed decisions
const [{ mfa }] = await certQuery(
  `select settings->'security'->>'require_mfa' as mfa from public.organizations limit 1`
)
add('require_mfa on', mfa === 'true', String(mfa))

const [{ marked }] = await certQuery(
  `select count(*)::int as marked from public.organizations where name like '[CERT]%'`
)
add('org marked [CERT]', marked > 0, `${marked} org(s)`)

// ------------------------------------------------------------------ report
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ marker, checks }, null, 2))
} else {
  console.log(`\ncert verification — snapshot ${marker.source_snapshot}, overlay ${marker.overlay ?? 'none'}\n`)
  for (const c of checks) {
    console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(34)} ${c.detail}`)
  }
}

const failed = checks.filter((c) => !c.ok)
console.log(`\n${checks.length - failed.length}/${checks.length} passed`)
if (failed.length) {
  console.error(`\nFAILED: ${failed.map((f) => f.name).join(', ')}`)
  process.exit(1)
}
