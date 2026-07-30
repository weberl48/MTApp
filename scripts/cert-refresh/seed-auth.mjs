/**
 * Create auth.users rows so cert profiles are actually signable-in.
 *
 * auth.users is NOT in the JSON backups, and public.users has no enforced FK to
 * it — so a naive restore succeeds and silently leaves 11 profiles nobody can
 * log in as. Worse, audit_trigger_function() resolves user_email through
 * auth.users, so profiles without auth rows produce unattributed audit records.
 *
 * Three things make this non-obvious:
 *
 *  1. Rows are created for ALL profiles, not just testers. Testers get a usable
 *     password; everyone else gets 40 random bytes used once and never stored,
 *     so the account exists for referential and audit integrity but nobody can
 *     sign in as it.
 *
 *  2. UPSERT by prod UUID, never delete-and-recreate. auth.mfa_factors FKs to
 *     auth.users(id), so stable ids mean enrolled TOTP factors SURVIVE every
 *     refresh. A tester enrols once, not once per refresh.
 *
 *  3. on_auth_user_created must be disabled around the inserts. Its no-metadata
 *     branch creates a brand-new organization per insert — 11 inserts would
 *     otherwise produce 11 junk orgs.
 *
 * Usage:  node scripts/cert-refresh/seed-auth.mjs [--reset-mfa <email>] [--dry-run]
 */
import './lib/run.mjs'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { randomBytes } from 'crypto'
import { certQuery, envValue } from './lib/api.mjs'
import { assertCert } from './lib/guards.mjs'
import { PATHS, TESTERS, STRAY_DEV_ACCOUNTS } from './config.mjs'

await assertCert()

const dryRun = process.argv.includes('--dry-run')
const resetIdx = process.argv.indexOf('--reset-mfa')

// ------------------------------------------------------------------ reset MFA only
if (resetIdx >= 0) {
  const email = process.argv[resetIdx + 1]
  if (!email) throw new Error('--reset-mfa needs an email')
  const res = await certQuery(`
    delete from auth.mfa_factors
    where user_id = (select id from auth.users where lower(email) = lower('${email.replace(/'/g, "''")}'))
    returning id
  `)
  console.log(`Cleared ${res.length} MFA factor(s) for ${email}. They can re-enrol on next login.`)
  process.exit(0)
}

const testerPw = envValue('CERT_TESTER_PASSWORD')
if (!testerPw) throw new Error('CERT_TESTER_PASSWORD missing from .env.local')
if (TESTERS.length === 0) {
  throw new Error('CERT_TESTERS is empty in .env.local — nobody would be able to sign in to cert.')
}

// ------------------------------------------------------------------ load profiles
const snap = readdirSync(PATHS.dailyBackups).sort().pop()
const usersFile = `${PATHS.dailyBackups}/${snap}/users.json`
if (!existsSync(usersFile)) throw new Error(`No users.json in snapshot ${snap}`)
const profiles = JSON.parse(readFileSync(usersFile, 'utf8'))

console.log(`Seeding auth for ${profiles.length} profiles from snapshot ${snap}`)
console.log(`  testers (real email kept): ${TESTERS.join(', ')}`)

if (dryRun) {
  for (const p of profiles) {
    const isTester = TESTERS.includes(String(p.email).toLowerCase())
    console.log(`  ${isTester ? 'TESTER ' : 'locked '} ${p.email}  ${p.id}`)
  }
  process.exit(0)
}

const q = (s) => String(s ?? '').replace(/'/g, "''")

// auth.users is owned by supabase_auth_admin, so `postgres` cannot
// ALTER TABLE ... DISABLE TRIGGER on it. session_replication_role = replica
// suppresses triggers session-wide without needing ownership — but it only
// holds for the duration of one session, so the suppression, the deletes and
// every insert must travel in ONE statement batch.
{
  const strays = STRAY_DEV_ACCOUNTS.map((e) => `'${q(e)}'`).join(',')
  const statements = [
    `set session_replication_role = replica;`,
    // Remove leftovers from when this project was the MCA-Dev sandbox. This is
    // also what closes the DEV_AUTO_LOGIN hole: that gate signs in as one
    // specific address, and after this it no longer exists.
    `delete from auth.users where lower(email) in (${strays});`,
  ]
  for (const p of profiles) {
    const isTester = TESTERS.includes(String(p.email).toLowerCase())
    const pw = isTester ? testerPw : randomBytes(40).toString('hex')
    statements.push(`
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
      ) values (
        '00000000-0000-0000-0000-000000000000', '${q(p.id)}', 'authenticated', 'authenticated',
        '${q(p.email)}', extensions.crypt('${q(pw)}', extensions.gen_salt('bf')),
        now(), coalesce('${q(p.created_at)}'::timestamptz, now()), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', '${q(p.name)}'),
        false, false
      )
      on conflict (id) do update set
        email = excluded.email,
        encrypted_password = excluded.encrypted_password,
        email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
        updated_at = now();

      insert into auth.identities (
        id, provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), '${q(p.id)}', '${q(p.id)}',
        jsonb_build_object('sub', '${q(p.id)}', 'email', '${q(p.email)}',
                           'email_verified', true, 'phone_verified', false),
        'email', now(), now(), now()
      )
      on conflict (provider_id, provider) do update set
        identity_data = excluded.identity_data, updated_at = now();
    `)
  }
  statements.push(`set session_replication_role = default;`)

  await certQuery(statements.join('\n'))
  console.log(`  upserted ${profiles.length} auth users + identities (triggers suppressed)`)
}

// ------------------------------------------------------------------ assertions
const [{ enabled }] = await certQuery(`
  select (t.tgenabled <> 'D') as enabled from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  where c.oid = 'auth.users'::regclass and t.tgname = 'on_auth_user_created'
`)
if (!enabled) throw new Error('on_auth_user_created is still DISABLED — invite acceptance would break.')

const [{ orgs }] = await certQuery(`select count(*)::int as orgs from public.organizations`)
if (orgs > 1) {
  throw new Error(`${orgs} organizations exist — the auth trigger fired during seeding and created junk orgs.`)
}

const [{ authed }] = await certQuery(`select count(*)::int as authed from auth.users`)
console.log(`\n  auth.users: ${authed}   organizations: ${orgs}   trigger: enabled`)
console.log(`\nTesters sign in with CERT_TESTER_PASSWORD, then enrol TOTP (require_mfa stays on).`)
