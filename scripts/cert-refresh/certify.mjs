/**
 * Make cert *not* prod. This is the only place cert deliberately diverges, so
 * everything that makes it safe is reviewable in one file.
 *
 * What it does NOT do: anonymise. Client names, notes and pricing stay real —
 * full fidelity is the point, and the local part of an address adds no
 * disclosure beyond the name already sitting next to it. The goal of this step
 * is UNDELIVERABILITY, not de-identification. Do not confuse the two.
 *
 * Determinism: output depends only on the original local part and the row's
 * immutable UUID — no random(), no now(). Two refreshes from the same snapshot
 * produce byte-identical addresses, so saved test fixtures keep working.
 *
 * Idempotence: every statement carries `NOT LIKE '%@' || sink`, so re-running is
 * a zero-row update and addresses never compound into sarah@sink@sink.
 *
 * Usage:  node scripts/cert-refresh/certify.mjs [--dry-run]
 */
import './lib/run.mjs'
import { certQuery } from './lib/api.mjs'
import { assertCert } from './lib/guards.mjs'
import { SINK_DOMAIN, TESTERS } from './config.mjs'

await assertCert()

const dryRun = process.argv.includes('--dry-run')
const sink = SINK_DOMAIN.replace(/'/g, "''")
const testerList = TESTERS.length
  ? TESTERS.map((t) => `'${t.replace(/'/g, "''")}'`).join(',')
  : `''`

console.log(`Certifying: sink domain @${SINK_DOMAIN}`)
console.log(`  testers keeping their real address: ${TESTERS.join(', ') || '(none)'}`)

// ------------------------------------------------------------------ what's exposed
const before = await certQuery(`
  select
    (select count(*) from public.clients            where contact_email   is not null and contact_email   not like '%@${sink}') as clients,
    (select count(*) from public.session_reminders  where recipient_email not like '%@${sink}')                                  as reminders,
    (select count(*) from public.user_invites       where invited_email   not like '%@${sink}')                                  as invites,
    (select count(*) from public.users              where lower(email) not in (${testerList}) and email not like '%@${sink}')    as users,
    (select count(*) from auth.users                where lower(email) not in (${testerList}) and email not like '%@${sink}')    as auth_users
`)
console.log(`  real addresses present:`, JSON.stringify(before[0]))

if (dryRun) {
  console.log('\n(dry run — nothing written)')
  process.exit(0)
}

// ------------------------------------------------------------------ rewrite
// clients / reminders / invites: local part preserved, duplicates preserved.
// Two siblings sharing a parent's address collapse to the same sink address,
// exactly as in prod — that collision is real behaviour worth testing.
await certQuery(`
  update public.clients
  set contact_email = split_part(contact_email, '@', 1) || '@${sink}'
  where contact_email is not null and contact_email <> '' and contact_email not like '%@${sink}';

  update public.session_reminders
  set recipient_email = split_part(recipient_email, '@', 1) || '@${sink}'
  where recipient_email not like '%@${sink}';

  update public.user_invites
  set invited_email = split_part(invited_email, '@', 1) || '@${sink}'
  where invited_email not like '%@${sink}';
`)

// users.email is UNIQUE, so disambiguate with the row's own id. Testers keep
// their real address: it's the login they already know, and nothing can send
// to it anyway because Preview has no RESEND_API_KEY.
await certQuery(`
  update public.users
  set email = split_part(email, '@', 1) || '+' || left(replace(id::text,'-',''), 8) || '@${sink}'
  where lower(email) not in (${testerList}) and email not like '%@${sink}';
`)

// auth.users must follow public.users: audit_trigger_function() reads
// auth.users.email into audit_logs.user_email, so skipping it would leak a real
// staff address into a table testers will be exporting.
await certQuery(`
  update auth.users a
  set email = u.email
  from public.users u
  where a.id = u.id and a.email is distinct from u.email;

  update auth.identities i
  set identity_data = jsonb_set(i.identity_data, '{email}', to_jsonb(u.email))
  from public.users u
  where i.user_id = u.id and i.provider = 'email'
    and i.identity_data->>'email' is distinct from u.email;
`)

// ------------------------------------------------------------------ cert marker
// A visible tell so nobody mistakes a cert tab for prod.
await certQuery(`
  update public.organizations
  set name = '[CERT] ' || name
  where name not like '[CERT]%';
`)

// ------------------------------------------------------------------ verify
const after = await certQuery(`
  select
    (select count(*) from public.clients            where contact_email   is not null and contact_email   not like '%@${sink}') as clients,
    (select count(*) from public.session_reminders  where recipient_email not like '%@${sink}')                                  as reminders,
    (select count(*) from public.user_invites       where invited_email   not like '%@${sink}')                                  as invites,
    (select count(*) from public.users              where lower(email) not in (${testerList}) and email not like '%@${sink}')    as users,
    (select count(*) from auth.users                where lower(email) not in (${testerList}) and email not like '%@${sink}')    as auth_users
`)

const leaked = Object.entries(after[0]).filter(([, v]) => Number(v) > 0)
if (leaked.length) {
  throw new Error(`Addresses still outside the sink: ${JSON.stringify(after[0])}`)
}

const [{ mfa }] = await certQuery(`
  select settings->'security'->>'require_mfa' as mfa from public.organizations limit 1
`)
if (mfa !== 'true') {
  console.warn(`  WARNING: require_mfa is "${mfa}" — expected true (restored from prod).`)
}

console.log(`  rewritten. remaining real addresses:`, JSON.stringify(after[0]))
console.log(`  require_mfa: ${mfa}`)
console.log('\nCertified. Run verify-cert.mts to confirm PHI decrypts.')
