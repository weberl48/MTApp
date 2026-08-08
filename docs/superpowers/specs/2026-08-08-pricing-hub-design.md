# Pricing Hub — design (2026-08-08)

## Problem

The pricing model — the core "sauce" of the business — is managed across four disconnected
surfaces, and the algorithm that combines them is invisible:

- **Settings > Business Rules > Services tab**: service list + a 568-line dialog mixing client
  billing (base rate, per-person, caps, scholarship rate), contractor pay (pay schedule, group
  pay matrix), and behavior toggles.
- **Settings > Business Rules > Sessions tab**: `pricing.no_show_fee` and
  `pricing.duration_base_minutes` hide under a "Pricing" heading inside session defaults.
- **Settings > Business Rules > Invoices tab**: the Square processing fee block (also
  `settings.pricing.*`).
- **Team > Rates tab**: `PayRateMatrix` — per-contractor × per-service overrides with duration
  tabs and increment back-calculation.

`calculateSessionPricing()` resolves contractor pay through a five-tier priority chain (group
pay matrix → custom rate + explicit increment → custom rate + schedule offset → service pay
schedule → formula `total − MCA%` with cap), then layers duration scaling, total caps, and
scholarship handling on top. No UI ever shows which tier priced a session.

**Known defect fixed by this design:** `mca_percentage` is submitted by the service form but
has no input anywhere in the UI. New services silently save 0% MCA; existing values are only
editable in the database.

## Decision

One new owner-only page — **Settings > Pricing** (`/settings/pricing/`) — becomes the single
editing home for all pricing configuration and makes the algorithm legible.

Chosen layout (from three explored options): **money-flow canvas + live simulator**. The page
reads in the order a dollar flows, with a sticky simulator alongside. Editing model (from three
explored options): **rate tables with edit-in-place cells** — the PayRateMatrix interaction,
applied everywhere. Old locations get pointer notes; nothing pricing-related remains editable
outside the hub (one exception noted in §7).

## 1. Page structure

Route `/settings/pricing/` (trailing slash), client page mirroring
`settings/business/page.tsx` patterns (`useOrganization`, browser Supabase client, sonner
toasts). Self-gates on `can('settings:edit')` — owner/developer only, deliberately not
admin-grantable. Denied users see the same "no permission" message Business Rules uses.

Two-column layout on `lg+`: canvas sections left, sticky simulator right. Below `lg` the
simulator renders as a collapsible card above the sections.

Sections, in order:

### §1 What the client pays
Table: rows = service types (active first, inactive dimmed with badge; ordered by
`display_order`), columns = **Base rate · Per-person rate · Total cap · Scholarship rate**.
Cells are click-to-edit (shared editable-cell component, §5). Header actions: **Add service**
(opens create dialog, §4). Per-row actions: edit (opens the slim service dialog, §4) and
delete (confirm dialog, moved from the old Services tab). Empty caps render "—"; clearing a
cell writes `null`.

### §2 What the contractor earns
Three blocks:
1. **Pay schedule grid** (individual services only, `per_person_rate === 0`): rows = services,
   columns = org duration options (`resolveDurationOptions`), cells =
   `contractor_pay_schedule[duration]`. Empty cells show the formula-derived "auto" value as
   placeholder (same computation the old dialog showed); clearing a cell reverts to auto.
2. **Group pay matrices** (group services, `per_person_rate > 0`): one collapsible grid per
   service — headcount (1–6, last row "6+") × duration — writing `group_contractor_pay`
   (`"{headcount}_{duration}"` keys, only filled cells persisted, matching the old form).
3. **Per-contractor overrides**: the existing `PayRateMatrix` component mounted here with
   `canEdit={true}`. The component stays in `src/components/team/` and keeps its behavior
   (duration tabs, set-all, increment back-calc, reset-to-default).

### §3 What the business keeps
Table: rows = services, columns = **MCA % (editable — fixes the defect) · Contractor cap ·
Margin @ base (read-only preview: `calculateSessionPricing(st, 1, base).mcaCut`)**.
`rent_percentage` is deprecated (engine returns 0 rent) and is not surfaced; stored values are
untouched.

### §4 Policies & fees
Form fields moved verbatim from Business Rules: **No-show fee**, **Base duration for rate
scaling** (from the Sessions tab), and the **Square processing fee** block (from the Invoices
tab: enabled switch, type select, percentage / fixed-cents inputs as they exist today). One
Save button writing `settings.pricing` through `OrganizationContext.updateSettings()`.
A muted note links to Business Rules > Sessions for `duration_options` (session behavior, not
pricing — it stays there but defines the grid columns here).

A header note offers **"Re-price existing sessions"** linking to `/sessions/` — rate changes
affect new sessions only; the existing bulk Recalculate-pricing flow applies them
retroactively.

## 2. Simulator ("Price a session")

Sticky card, always visible while editing. Inputs:
- Service (active services; scholarship services auto-set payment method)
- Contractor (optional — "Default (schedule/formula)" entry)
- Duration (org duration options)
- Headcount (only shown for group services)
- Toggles: **Scholarship pricing** (auto-on and locked for `is_scholarship` services),
  **No-show** (uses `calculateNoShowPricing` with `settings.pricing.no_show_fee`)

Output: Total, per-person, contractor pay, MCA cut, scholarship discount when present — plus a
**"priced by" badge naming which tier of the priority chain produced contractor pay** and
annotations when a contractor cap or total cap clamped the number.

Input assembly lives in a new pure module `src/lib/pricing/simulate.ts` with a colocated test
(per the lib-module rule). It reuses `calculateSessionPricing` directly; it does NOT go through
`price-session.ts` (that module's contract is "mirror the session form for stored sessions" —
the simulator is a what-if tool and must not be coupled to it). Contractor rates are fetched
once client-side (owner RLS permits reading all rows).

## 3. Engine change — pay-source attribution

`calculateSessionPricing()` gains additive optional result fields (no signature change, no
change to existing numbers):

```ts
contractorPaySource?: 'group_matrix' | 'custom_rate_increment' | 'custom_rate_schedule_offset'
                    | 'custom_rate_scaled' | 'pay_schedule' | 'formula'
contractorCapApplied?: boolean
totalCapApplied?: boolean
```

Each branch of the existing priority chain sets its source. `index.test.ts` gains assertions
per branch. `price-session.ts` and all stored pricing are unaffected (fields are additive and
not persisted).

## 4. Slimmed service dialog

`ServiceTypeForm` stops being a pricing form and becomes the **service identity & behavior**
dialog: name, category, location, and the toggles (`is_active`, `is_scholarship`,
`requires_client`, `admin_only`, `requires_classroom`) plus contractor restrictions
(`allowed_contractor_ids`). It moves to the hub (no longer mounted on Business Rules).

**Create mode only** additionally requires three money fields so a new service is born
functional: **Base rate (required), Per-person rate (default 0), MCA % (required)** — the
required MCA % is what closes the silent-0% defect. All other money is edited in the tables
after creation. Edit mode shows no money fields.

## 5. Editable cell component

`src/components/pricing/editable-cell.tsx`: display value → click (owner) → inline number
input with Enter/Escape/check/cancel, save spinner, toast on error — extracted from the
interaction `PayRateMatrix` already implements. Used by §1, §2 grids, §3. Writes go directly to
`service_types` via the browser client (existing owner-RLS pattern used by the old dialog).
Money parsing mirrors the old form: `parseFloat`, empty → `null` for nullable columns; pay
schedule/group cells drop non-positive values.

## 6. Navigation & old surfaces

- **Settings landing**: new card **Pricing** (`ownerOnly`, `DollarSign` icon, href
  `/settings/pricing/`), inserted after Business Rules. Description: "Service rates, contractor
  pay, fees — and a price simulator".
- **Business Rules**: Services tab (trigger + content + dialog mount + tour hold-open effect)
  is removed; owners see a pointer card above the tabs linking to the hub. Default tab becomes
  `invoices` for everyone. The Sessions tab's "Pricing" block and the Invoices tab's Square-fee
  block are each replaced by a one-line muted link to the hub. Page subtitle updated.
- **Team > Rates tab**: stays, for `team:view-rates` holders (incl. granted admins), but the
  matrix mounts with `canEdit={false}` for everyone; owners get an "Edit rates in Settings >
  Pricing" button. Editing has one home.
- **`/team/[id]` Rates tab** (`ContractorRatesForm`): unchanged in v1 — it edits the same
  `contractor_rates` rows under the same RLS; consolidating it is deferred (noted in §10).

## 7. Permissions & write paths

| Surface | Gate | Write path |
|---|---|---|
| Hub page (view + edit) | `settings:edit` (not grantable) | — |
| Service tables / dialog | `settings:edit` | browser client → `service_types` (owner RLS) |
| Contractor override matrix (hub) | `settings:edit` page gate | browser client → `contractor_rates` (owner RLS) |
| Policies & fees | `settings:edit` | `updateSettings()` → `updateOrganizationSettings()` |
| Team Rates tab (read-only) | `team:view-rates` via `canWithGrants` | none |

No RLS changes. No schema changes. No migrations.

## 8. Guided tours

Tour ids are stable (completion tracking, `RECOMMENDED_WALKTHROUGH_ORDER`, article launchers
unchanged):

- **`configure-services`** — retargets to `/settings/pricing/`; highlights the §1 table
  (`data-tour="pricing-billing-table"`) and Add service (`data-tour="pricing-add-service"`).
- **`edit-service-type`** — reworked: tours §1 cells, §2 schedule grid, §3 MCA column, then the
  slim dialog (behavior fields). The `?tour=edit-service` hold-open effect moves to the hub
  page.
- **`contractor-rates`** — retargets to the hub's §2 matrix (`pay-rate-matrix` selector moves
  with the component); route steps change from `/team/` to `/settings/pricing/`.
- **`invite-contractor`** — its owner-scoped "Pay Rate Matrix" step keeps the `team-tab-rates`
  selector (tab still exists) with copy adjusted to "view rates; editing lives in Settings >
  Pricing".
- **`recalculate-pricing`** — unchanged (lives on `/sessions/`); final-step copy mentions the
  hub as where rates are edited.

New `data-tour` attributes on hub elements as listed above. The Playwright walkthrough audit
(`scripts/audit-walkthroughs.mts`) requires a live server + cert credentials and is a follow-up
verification step, called out in the final report.

## 9. Help content

- **New article** `pricing-hub` (category `settings`, `adminOnly: true`, ≥3 lowercase
  keywords): the money-flow model, what each section edits, the simulator, and the five-tier
  priority chain in user language. `PageHelp article="pricing-hub"` in the hub header.
- **Updated articles**: `configuring-services`, `editing-service-types` (new locations +
  slimmed dialog), `pricing-deep-dive` (add "see it live in the simulator"; new related link),
  `managing-contractor-rates` (rates edited in the hub; Team tab is view-only),
  `recalculating-pricing` (rates path reference).
- **FAQs**: `change-no-show-fee` (now Settings > Pricing), `contractor-pay-differs` and
  `rate-change-not-applied` (path touch-ups).
- **Search**: synonyms for "pricing page", "price calculator", "simulator".
- **`COVERAGE_MATRIX`**: replace the `/settings/business/services` row with
  `'/settings/pricing': ['pricing-hub', 'pricing-deep-dive', 'configuring-services',
  'editing-service-types', 'managing-contractor-rates']`. Business Rules' header `PageHelp`
  switches from `pricing-deep-dive` to `generating-invoices` (Invoices is the page's new
  default tab and that article already covers its settings per the coverage matrix).

## 10. Testing & verification

- Engine: branch-per-source assertions in `src/lib/pricing/index.test.ts`.
- New lib module `simulate.ts` gets a colocated test (input assembly incl. group headcount,
  scholarship auto-lock, no-show mode).
- Help integrity suite must pass (coverage row, slugs, keywords, tour launch rules).
- `npm run test`, `npx tsc --noEmit`, `npm run lint` all green before the branch is offered.
- Follow-ups explicitly out of scope: running the live walkthrough audit; consolidating
  `/team/[id]` rates editing; margins analytics; per-client billing controls (stay on client
  pages); simulator FAB on mobile.

## Out of scope

- No schema/RLS/migration changes.
- `rent_percentage` and `scholarship_discount_percentage` remain legacy: readable by the
  engine, absent from the new UI.
- Session form, invoices, payroll, portal: untouched.
