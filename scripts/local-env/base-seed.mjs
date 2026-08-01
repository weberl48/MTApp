/**
 * The base seed the dev-seed scenario dataset assumes already exists.
 *
 * scripts/dev-seed/generate.mjs hard-codes the org, the two dev users, seven
 * service types and four clients by UUID (see its header: "Existing seed rows
 * (org, users, service types)"), then layers ~300 sessions on top. Those base
 * rows used to live in the old MCA-Dev sandbox, which the cert rebuild deleted —
 * so without this file dev-seed fails on foreign keys against a missing org.
 *
 * Every UUID here is copied from generate.mjs and MUST stay in sync with it.
 */

/** Fixed identifiers — must match scripts/dev-seed/generate.mjs exactly. */
export const IDS = {
  org: 'a0000000-0000-0000-0000-000000000001',
  owner: 'f20d1c84-29b5-438a-865c-c8a4bbe1db5f',
  contractor: '8dcc04b8-fb6b-4fbb-9ffb-ce3a8c525e84',
}

/**
 * Service types, with the rates generate.mjs prices its sessions against.
 * `mca_percentage` is 0 on every row because that mirrors production: the owner's
 * own tracker has no percentage anywhere, and contractor pay is a lookup in
 * contractor_rates rather than a formula. See the pay-config decision record.
 */
const SERVICES = [
  { id: '83f28c35-3366-43f8-93a2-ae55026a27c8', name: 'Musical Expressions',            cat: 'music_individual', loc: 'in_home',     rate: 60,  pay: 38.5, per: 0 },
  { id: 'c528cc96-b368-47e4-9922-a12056c2d7d6', name: 'Adaptive Lesson',                cat: 'music_individual', loc: 'matts_music', rate: 45,  pay: 29.5, per: 0 },
  { id: 'd0b7bb76-ab52-4c4b-831c-97e9db033389', name: 'Creative Remedies',              cat: 'art_individual',   loc: 'in_home',     rate: 50,  pay: 50,   per: 0 },
  { id: 'bfda7114-408c-4f79-a162-31c2d002fafc', name: 'In-school group session',        cat: 'music_group',      loc: 'other',       rate: 105, pay: 73,   per: 0 },
  { id: 'f12ce1d4-d43e-4976-9626-e7dcb60ebc41', name: 'Music Expressions Group',        cat: 'music_group',      loc: 'other',       rate: 50,  pay: 50,   per: 20 },
  { id: '80979ad5-a36a-43b7-8699-4f5eb7c084eb', name: 'Scholarship Individual Session', cat: 'music_individual', loc: 'in_home',     rate: 60,  pay: 40,   per: 0, scholarship: true },
  { id: '64c0f857-fd9c-429c-8b77-35efca722e55', name: 'Late Cancellation Fee',          cat: 'music_individual', loc: 'other',       rate: 50,  pay: 50,   per: 0 },
]

/** The four clients generate.mjs builds history on top of. */
const CLIENTS = [
  { id: 'da9b2437-22a8-4835-9a85-8f7b4da7f4cf', name: 'Test Private Pay',     pm: 'private_pay', billing: 'square', freq: 'per_session' },
  { id: '57a9d0cb-59ef-4890-9791-cf9f5ec930a7', name: 'Test Group Home',      pm: 'group_home',  billing: 'email',  freq: 'per_session' },
  { id: 'ce7d3e8f-e599-4762-bb7b-89aa2852202e', name: 'Test Monthly Billing', pm: 'private_pay', billing: 'square', freq: 'monthly' },
  { id: 'e6b1d020-5eab-4c2e-bc21-f6f8389c7802', name: 'Test Scholarship',     pm: 'scholarship', billing: 'other',  freq: 'per_session' },
]

const q = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)

/**
 * Local org settings. `require_mfa` is false so the e2e suite can sign in —
 * this is exactly the property cert cannot have (it mirrors prod, where MFA is on).
 */
const SETTINGS = {
  security: { require_mfa: false, session_timeout_minutes: 30, max_login_attempts: 5, lockout_duration_minutes: 15 },
  features: { client_portal: true, ai_help: true },
  session: { default_duration: 30, duration_options: [30, 45, 60, 90], send_reminders: true, reminder_hours: 24 },
  invoice: { due_days: 30, send_reminders: true, reminder_days: [7, 1] },
  pricing: { no_show_fee: 60, duration_base_minutes: 30 },
}

/**
 * Auth rows + profile rows + org + services + clients, as ONE statement batch.
 *
 * `session_replication_role = replica` is required and must travel in the same
 * batch as the inserts: auth.users is owned by supabase_auth_admin so `postgres`
 * cannot DISABLE TRIGGER on it, and the setting only holds for one session.
 * Without it, on_auth_user_created fires per insert and mints a junk organization
 * for every account created.
 */
export function baseSeedSql(password) {
  if (!password) throw new Error('baseSeedSql needs a password (TEST_USER_PASSWORD)')

  const users = [
    { id: IDS.owner, email: 'dev-owner@maycreativearts.test', name: 'Dev Owner', role: 'developer' },
    { id: IDS.contractor, email: 'dev-contractor@maycreativearts.test', name: 'Dev Contractor', role: 'contractor' },
  ]

  const authRows = users
    .map(
      (u) => `(
      '00000000-0000-0000-0000-000000000000', ${q(u.id)}, 'authenticated', 'authenticated',
      ${q(u.email)}, crypt(${q(password)}, gen_salt('bf')), now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      '', '', '', '')`
    )
    .join(',\n')

  const profileRows = users
    .map((u) => `(${q(u.id)}, ${q(u.email)}, ${q(u.name)}, ${q(u.role)}::user_role, ${q(IDS.org)})`)
    .join(',\n')

  const serviceRows = SERVICES.map(
    (s) =>
      `(${q(s.id)}, ${q(s.name)}, ${q(s.cat)}::service_category, ${q(s.loc)}::location_type, ${s.rate}, ${s.per}, 0, ` +
      `${s.scholarship ? 'true' : 'false'}, ${s.scholarship ? s.rate : 'NULL'}, ${q(IDS.org)}, true, ` +
      `'${JSON.stringify({ 30: s.pay, 45: s.pay * 1.5, 60: s.pay * 2, 90: s.pay * 3 })}'::jsonb)`
  ).join(',\n')

  const clientRows = CLIENTS.map(
    (c) =>
      `(${q(c.id)}, ${q(c.name)}, ${q(c.pm)}::payment_method, ${q(c.billing)}, ${q(c.freq)}, ${q(IDS.org)})`
  ).join(',\n')

  const rateRows = SERVICES.map(
    (s) => `(${q(IDS.contractor)}, ${q(s.id)}, ${s.pay})`
  ).join(',\n')

  return `
begin;
set local session_replication_role = replica;

create extension if not exists pgcrypto;

insert into organizations (id, name, slug, settings, timezone, currency)
values (${q(IDS.org)}, 'May Creative Arts (LOCAL)', 'mca-local', '${JSON.stringify(SETTINGS)}'::jsonb, 'America/New_York', 'USD')
on conflict (id) do update set settings = excluded.settings, name = excluded.name;

-- confirmation_token / recovery_token / email_change_token_new / email_change have
-- NO column default and MUST be '' rather than NULL. GoTrue scans them into Go
-- strings, so a NULL makes every sign-in fail with HTTP 500 "Database error
-- querying schema" — which reads like a schema problem, not a seeding one. The
-- three other token columns already default to '' and need nothing.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change)
values
${authRows}
on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  confirmation_token = excluded.confirmation_token,
  recovery_token = excluded.recovery_token,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change;

insert into public.users (id, email, name, role, organization_id)
values
${profileRows}
on conflict (id) do update set role = excluded.role, organization_id = excluded.organization_id;

insert into service_types (
  id, name, category, location, base_rate, per_person_rate, mca_percentage,
  is_scholarship, scholarship_rate, organization_id, is_active, contractor_pay_schedule)
values
${serviceRows}
on conflict (id) do update set base_rate = excluded.base_rate, contractor_pay_schedule = excluded.contractor_pay_schedule;

insert into clients (id, name, payment_method, billing_method, billing_frequency, organization_id)
values
${clientRows}
on conflict (id) do update set payment_method = excluded.payment_method;

insert into contractor_rates (contractor_id, service_type_id, contractor_pay)
values
${rateRows}
on conflict do nothing;

-- Session-location flag for "In-school group session". No-op until the
-- 20260731_location_requirement_flags migration is present in the local schema.
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'service_types' and column_name = 'requires_classroom') then
    update service_types set requires_classroom = true
      where id = 'bfda7114-408c-4f79-a162-31c2d002fafc'; -- In-school group session
  end if;
end $$;

commit;
`
}
