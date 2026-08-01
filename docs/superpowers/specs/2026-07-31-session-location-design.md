# Session Location, Invoice Location, and Admin-Only Service Types

> **SUPERSEDED (same day, 2026-07-31)** — the location model in §3–§5 (per-client
> picklist config in `custom_lists.locations_by_client`, the `ClientLocationEditor`,
> and the `invoice.show_session_location` toggle) shipped and was replaced hours
> later by two boolean flags: `service_types.requires_classroom` and
> `clients.requires_location` (free text only; prints on invoices whenever present).
> See migration `20260731_location_requirement_flags.sql`. The admin-only service
> types section (§4.5) and the answers in §7 remain current.

**Date:** 2026-07-31
**Branch:** `feat/session-location` (off `main`)
**Origin:** Five verbatim notes from Amara (owner), relayed 2026-07-31.

---

## 1. Background

Amara sent five notes. Discovery against the codebase and both live databases
found that only two describe genuinely missing functionality; two are questions,
and one is a feature that shipped but was never configured.

| # | Note (verbatim) | Finding |
|---|---|---|
| 1 | "if client is people in or old they need a seperate form slot the location the session was held in and a way to mark future clients as needing this options" | Partly built. Per-agency picklist exists; wrong shape for self-directed clients. |
| 2 | "for schools can we add a manatory classroom drop down when filling out a session, the classroom location needs to appear on the invoice as well" | Dropdown built and mandatory; **invoice half does not exist at all**. |
| 3 | "is there a service fee for online pay via square" | Question. Answered in §7. |
| 4 | "how do invoice reminders work right now, do they send via square or the app" | Question. Answered in §7. |
| 5 | "hide admin service type from non admins" | Real gap. Lever exists but is the wrong shape. |

### 1.1 What exists today

`settings.custom_lists.classrooms_by_client: Record<clientId, string[]>` maps a
billed client to a fixed list of classroom names. When a session's billed client
has a list, `session-form.tsx` renders a **required** "Classroom / Program"
`Select` and writes the choice to `sessions.classroom`.

The billed client is resolved at `session-form.tsx:172-174`: for a group service
it is the "Bill To" agency; otherwise it is the single selected client. A list
only applies when exactly one client is selected.

### 1.2 What the data says

Verified 2026-07-31 by direct query against both Supabase projects:

- Prod and cert both have `classrooms_by_client = {}` and `classrooms = []`.
  **The feature has never been configured.**
- **0 of 13** prod sessions have a non-null `classroom`.
- `service_types.Admin` has `allowed_contractor_ids = null` in **both** environments
  — every contractor sees it today.
- `service_types."Late Cancellation Fee"` carries a hand-enumerated allowlist of
  10 contractor UUIDs — proof the existing lever works and that maintaining it
  by hand is the wrong ergonomics for what is really a role rule.

### 1.3 Why a picklist alone is insufficient

Cert's client list contains two populations behind the same "People Inc" label:

| Client shape | `payment_method` | Location behaviour |
|---|---|---|
| `People Inc Day Hab`, `OLV`, `OP Schools (Tracy Brege)` | `group_home` | Stable sites — a picklist fits |
| `Brayden Davis (People Inc SD)` and 7 more | `self_directed` | Session happens wherever the person is that day — a picklist does not fit |

Covering the self-directed individuals with today's mechanism would mean a
separate hand-maintained list per person. Confirmed by screenshot: selecting a
`People Inc SD` individual renders **no location field at all**.

---

## 2. Goals / Non-goals

**Goals**

- One location model that covers fixed picklists, pure free text, and picklist-plus-escape-hatch.
- Owner-manageable entirely from Settings — no code change to onboard a new agency.
- Location appears on client-facing invoices when the owner opts in.
- Admin-only service types hidden from contractors via a role rule, not an allowlist.

**Non-goals**

- Geocoding, addresses-as-structured-data, or a `locations` table. Location stays a
  free string on the session.
- Changing who the billed client is, or how pricing is computed.
- Retrofitting location onto the 13 existing prod sessions.

---

## 3. Data model

### 3.1 Per-client location config (settings JSONB — no DB migration)

```ts
// src/types/database.ts
export interface ClientLocationConfig {
  /** Field label shown on the session form. e.g. "Classroom", "Site", "Location". */
  label: string
  /** Picklist options. May be empty — an empty list plus allow_other is pure free text. */
  options: string[]
  /** Show an "Other…" choice that reveals a free-text input. */
  allow_other: boolean
  /** Block submit when no location is given. */
  required: boolean
}

interface CustomListsSettings {
  // ...existing...
  /** Per-client location config, keyed by the BILLED client's id. */
  locations_by_client: Record<string, ClientLocationConfig>
}
```

Free text is the degenerate case of the same structure, not a second code path:

| Client | `label` | `options` | `allow_other` | `required` | Result |
|---|---|---|---|---|---|
| OP Schools | `Classroom` | Room 101, … | `false` | `true` | Mandatory dropdown (note #2) |
| OLV / People Inc Day Hab | `Site` | Main Chapel, … | `true` | `true` | Dropdown + escape hatch |
| Brayden Davis (People Inc SD) | `Location` | *(empty)* | `true` | `true` | Pure free text (note #1) |
| Any client with no entry | — | — | — | — | No field (unchanged) |

### 3.2 Backward compatibility — read-side only

`mergeOrganizationSettings()` (`src/lib/organization/settings.ts`) upgrades legacy
config on read. No DB write, no migration, old config keeps working:

```ts
// classrooms_by_client entries become locations_by_client entries
{ label: 'Classroom / Program', options: <legacy list>, allow_other: false, required: true }
```

`classrooms_by_client` is **retained in the type as deprecated** and still read by
the merge. `locations_by_client` wins when both name the same client. The global
`custom_lists.classrooms` list (scholarship group sessions) keeps its current
fallback behaviour, expressed as the same config shape.

`DEFAULT_SETTINGS.custom_lists.locations_by_client = {}`.

### 3.3 New columns (migrations, applied to cert first)

`supabase/migrations/20260731_session_location_and_admin_services.sql`:

```sql
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS classroom text;
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS admin_only boolean NOT NULL DEFAULT false;
```

`sessions.classroom` is **reused as-is** — free-text values are just different
strings. No sessions migration.

Per CLAUDE.md, migrations are applied by hand: cert (`gzrukevymmguqxuoynqk`) first,
verify, then prod (`ysmwowzxkgisshaormmf`). Both `Row`, `Insert`, and `Update`
sections of the affected tables in `src/types/database.ts` must be updated.

---

## 4. Behaviour

### 4.1 Resolving a session's location config

New pure module `src/lib/session-location/config.ts`, unit-tested:

```ts
export function resolveLocationConfig(
  settings: OrganizationSettings | null,
  billedClientId: string,
  opts: { isScholarshipGroup: boolean }
): ClientLocationConfig | null
```

Precedence, highest first:

1. `locations_by_client[billedClientId]`
2. legacy `classrooms_by_client[billedClientId]`, upgraded per §3.2
3. global `custom_lists.classrooms` — **only** when `isScholarshipGroup`
4. `null` → no field rendered

A config whose `options` is empty **and** `allow_other` is false resolves to
`null`; it can never render an unfillable required field.

### 4.2 Session form

`session-form.tsx` replaces the `classroomOptions` / `showClassroom` block:

- Render the field when `resolveLocationConfig(...) !== null`.
- Label from `config.label`; append `*` when `config.required`.
- `options.length > 0` → `Select` populated from `options`; append an `Other…`
  item when `allow_other`.
- Choosing `Other…`, or `options.length === 0`, reveals a text `Input`.
- Validation blocks submit only when `config.required` and the resolved value is empty.
- Persist the resolved string to `sessions.classroom` exactly as today.
- The `Select` trigger and the free-text `Input` each carry an `id` matching their
  `<Label htmlFor>` (see §6).

The `id="classroom"` and error-id conventions are preserved so
`scripts/audit-walkthroughs.mts` and existing e2e specs keep passing.

### 4.3 Closing the portal-approval bypass

`src/app/api/session-requests/[id]/approve/route.ts:163` hardcodes `classroom: null`,
bypassing the required rule for portal-originated sessions (which always have a client).

- The approve endpoint accepts an optional `classroom` in its body.
- When the request's client resolves to a `required` config and no value is supplied,
  the route returns **400** rather than silently writing `null`.
- The staff-facing approve UI prompts for the location when the config requires it.

`QuickLogDrawer` is explicitly **out of scope**: it passes `clientIds: []`, so no
billed client exists and no location config can apply.

### 4.4 Location on the invoice

Gated by a new owner setting `settings.invoice.show_session_location` (default `false`,
so behaviour is unchanged until switched on).

The two invoice shapes source the location differently. `invoice_items` rows are
created **only** by the scholarship-batch paths — `src/app/actions/scholarship-invoices.ts:248`
and `src/app/api/cron/scholarship-batches/route.ts:238`. `createNewSession()` and
`ensureSessionInvoices()` do **not** write line items.

- **Single-session invoices** already join the session, so no new column is needed —
  add `classroom` to the existing session select and render it.
- **Batch invoices** read denormalised line items, so `invoice_items.classroom` is
  required and must be populated at insert time in **both** batch paths, mirroring how
  `service_type_name` and `contractor_name` are already snapshotted. Missing either
  path silently blanks the location on monthly statements.
- `InvoicePDF` (`src/components/pdf/invoice-pdf.tsx`): render the location as a
  sub-line under the service in the `col1` cell, alongside the existing
  `Therapist:` / `Duration:` lines — in both the batch (`items[]`) and single-session
  branches. `InvoiceLineItem` and the `session` shape gain the field.
- Square: append the location to the single-session line-item description built at
  `src/app/api/invoices/[id]/square/route.ts:195`, and add `classroom` to the
  `invoice_items` select at :139 so batch descriptions can carry it too.

Location is **not PHI** in the same class as session notes, but it is client-identifying
context. It appears only on that client's own invoice, and only when the owner enables
the toggle. `src/lib/invoices/pdf-notes.ts`'s rule — only `client_notes` may cross to
the client-facing PDF — is untouched.

### 4.5 Admin-only service types

- New `service_types.admin_only` boolean.
- `service-type-form.tsx` gains an **Admin only** checkbox, described as "Hide this
  service from contractors when they log a session".
- `session-form.tsx:85-90` `visibleServiceTypes` adds the rule. Admins/owners keep
  their existing `can('financial:view-details')` bypass, so they still see everything:

```ts
if (showFinancialDetails) return serviceTypes
return serviceTypes.filter((st) =>
  !st.admin_only &&
  (!st.allowed_contractor_ids || st.allowed_contractor_ids.length === 0 ||
   st.allowed_contractor_ids.includes(effectiveContractorId))
)
```

`allowed_contractor_ids` is retained — it still expresses "only these specific
contractors", which `admin_only` does not replace.

**Follow-up for the owner, not code:** after deploy, set `admin_only = true` on the
`Admin` service type in both environments. Until then behaviour is unchanged.

---

## 5. Settings UI (all owner-managed)

| Tab | Control | Backing field |
|---|---|---|
| Sessions | Per-client location editor — add/remove client, label, options, allow-other, required | `custom_lists.locations_by_client` |
| Services | **Admin only** checkbox per service type | `service_types.admin_only` |
| Invoices | **Show session location on invoices** toggle | `invoice.show_session_location` |

`ClassroomsByClientEditor` (`src/components/settings/classrooms-by-client.tsx`) is
replaced by `ClientLocationEditor`. Each row expands from the current single
comma-separated input to: label, options, and two switches. Rows created from legacy
config render with the upgraded defaults from §3.2.

The settings forms mirror settings into local state, so `mergeOrganizationSettings()`
must stay pure and memoized at the call site — an unstable identity wipes unsaved edits.

---

## 6. Accessibility fix (already applied on this branch)

`session-form.tsx` had two `<Label htmlFor>` attributes pointing at `SelectTrigger`
components with no `id`, so the labels were not bound to their controls:

- `htmlFor="duration"` → trigger now has `id="duration"`
- `htmlFor="serviceType"` → trigger now has `id="serviceType"`

Every other control in the form was already bound correctly. Verified in-browser:
`getByLabel('Duration (minutes) *')` and `getByLabel('Service Type *')` both resolve.
New controls added by this spec must follow the same convention.

---

## 7. Answers to Amara's two questions

Verified 2026-07-31 against prod (`ysmwowzxkgisshaormmf`).

### Square service fee

Two distinct fees:

1. **Square's own merchant fee**, deducted from MCA's payout. Not modelled anywhere
   in the app.
2. **An optional pass-through "Online Processing Fee"** the app can add to a Square
   invoice. Prod has `pricing.square_processing_fee_enabled = false` — **nothing is
   being added today.** Three layers, narrowest wins: org toggle → `clients.square_fee_enabled`
   → `invoices.apply_square_fee`.

**Defect (PR 2):** the fee is computed *from* `invoice.amount` and passed to Square as
a separate `serviceCharge`, so `invoices.amount` excludes it. The app's own PDF prints
`Total Due: {invoice.amount}` and the email templates only format `amount`. Enabling
the fee would make the PDF and the Square checkout disagree.

### Invoice reminders

Both systems can send, independently.

| | App cron | Square |
|---|---|---|
| Where | `/api/cron/send-invoice-reminders`, daily 14:00 UTC | Baked in at creation, `src/lib/square/invoices.ts:184` |
| Schedule | `settings.invoice.reminder_days` (default `[7,1]`) + once-ever overdue notice if `0` present | Hardcoded −1, 0, +3 days |
| Configurable | Yes | **No** |
| Scope | Any invoice with `status = 'sent'` | Square invoices only |

**Prod today: `invoice.send_reminders = false`.** The app sends no invoice reminders at
all; the only ones clients receive are Square's. Sending via Square sets the app invoice
to `status = 'sent'` (`square/route.ts:234`), which places it inside the app cron's
filter — so the moment anyone enables `send_reminders`, both systems fire, colliding on
the day before due (app `day = 1` vs Square `relativeScheduledDays = -1`).

---

## 8. Delivery plan

### PR 1 — Amara's asks (this spec's core)

1. Types + `DEFAULT_SETTINGS` + `mergeOrganizationSettings()` legacy upgrade.
2. `src/lib/session-location/config.ts` + colocated unit tests.
3. Session form: config-driven field with free-text support.
4. Migration `20260731_session_location_and_admin_services.sql`; cert first, then prod.
5. `admin_only` column, service-type-form checkbox, `visibleServiceTypes` filter.
6. `invoice_items.classroom` snapshot + PDF + Square description, behind
   `invoice.show_session_location`.
7. Portal-approval bypass closed.
8. `ClientLocationEditor` replacing `ClassroomsByClientEditor`.
9. Help articles: `sessions.ts`, `invoices.ts`, `settings.ts`; add the new settings
   controls to `COVERAGE_MATRIX` in `integrity.test.ts`.

### PR 2 — Billing reconciliations (not asked for; surfaced by §7)

1. `settings.invoice.reminder_source: 'app' | 'square' | 'both' | 'none'` (default
   preserving today's behaviour), honoured by both the cron and
   `createSquareInvoice`; Square's reminder days sourced from `reminder_days`
   instead of the hardcoded triple.
2. Processing fee rendered on the app PDF and invoice email so totals match Square.

### Verification

- `npm run test` (new unit tests for `resolveLocationConfig` and the settings merge)
- `npx tsc --noEmit`, `npm run lint`
- `npm run test:e2e -- --workers=1` (serial; parallel is flaky on shared org data)
- `npx tsx scripts/audit-walkthroughs.mts` — the session form is on tour paths
- Manual cert pass covering each of the four rows in the §3.1 table

### Cert state note

A demo config was written to cert during discovery, via the existing Settings UI:
`custom_lists.classrooms_by_client = { "9054c8bb-…": ["Main Chapel", "Day Hab East",
"Day Hab West", "Residence 3"] }` (the OLV client). It exercises the §3.2 legacy-upgrade
path, so it is useful to keep as a fixture. Clear it if a clean cert is wanted.
**Prod was not modified.**

---

## 9. Open questions

None blocking. Two owner decisions deferred to after deploy, both configuration
rather than code:

- Which clients get which location config (§3.1 is a proposal drawn from cert data,
  not a commitment).
- Whether to enable `invoice.show_session_location` immediately or after a review pass.
