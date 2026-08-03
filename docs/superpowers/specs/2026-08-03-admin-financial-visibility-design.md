# Owner-configurable admin financial visibility

**Date:** 2026-08-03
**Goal:** an admin must not see what any contractor earns, anywhere in the app — and the owner
decides, per organization, which financial surfaces admins may see after all.

## The problem

The July 2026 admin-visibility sweep made pay rates, session pricing, invoice margins, payroll and
analytics owner-only. It missed the Team pages, which still show per-contractor **earnings** — the
single most sensitive number, printed next to each person's name:

| Surface | What an admin sees today | Gate |
|---|---|---|
| `/team/` members table | **Total Earnings** and **Pending Pay** columns, per member | none |
| `/team/` summary cards | **Pending Contractor Pay** (org-wide total) | none |
| `/team/[id]/` stat cards | **Total Earnings**, **Paid Out**, **Pending Pay** | none |
| `/team/[id]/` invoices tab | a **Contractor Pay** column, per invoice | none |

Both pages are reachable by any admin (`team:view`). Verified correctly gated already and out of
scope: the pay-rate matrix and Rates tabs (`team:view-rates`), session pricing on the sessions list,
session detail and session form (`financial:view-details`), the invoice Financial Breakdown
(`financial:view-details`), `/payments/` and the payroll APIs (`payments:view`), `/analytics/`
(`analytics:view`). The sessions CSV export contains no money columns at all.

## Design

### 1. Grants layer over the existing permission seams

`can(role, permission)` stays a pure role lookup. Roughly forty of its call sites test permissions
that are not configurable, and they must not have to care.

A second function sits beside it:

```ts
canWithGrants(role, permission, grants) =
  can(role, permission) || (role === 'admin' && isGrantable(permission) && grants[permission] === true)
```

Only `admin` is ever elevated: contractors are untouched, owners and developers already pass the
base check. Only four permissions are grantable, and the list is a closed constant — a typo in
settings cannot invent a new one:

| Permission | What granting it reveals |
|---|---|
| `team:view-rates` | contractor pay rates and the Team-page earnings columns |
| `financial:view-details` | session pricing and invoice margins (MCA cut, contractor pay) |
| `analytics:view` | `/analytics/` and the dashboard revenue strip |
| `payments:view` | `/payments/`, payroll and the payroll APIs |

### 2. Where the switches live

A new `permissions` section in `organization.settings`, four booleans, all defaulting to `false`:

```ts
permissions: {
  admin_view_contractor_pay: boolean   // -> team:view-rates
  admin_view_margins: boolean          // -> financial:view-details
  admin_view_analytics: boolean        // -> analytics:view
  admin_view_payroll: boolean          // -> payments:view
}
```

`ADMIN_WRITABLE_SETTING_SECTIONS` is an allow-list that does not include `permissions`, so
`applySettingsUpdate()` already refuses an admin's write to it. That matters: without it an admin
could grant themselves the very visibility this feature exists to remove. A test pins it.

Defaults-off means **existing organizations see no change** on three of the four switches — admins
never had analytics, payroll or margins. The one live behaviour change is the Team pages going
quiet, which is the bug being fixed.

### 3. Wiring

`OrganizationContext` binds its `can()` to `canWithGrants(effectiveRole, permission, grants)`, with
grants derived from the merged settings. Every client consumer of `can()` from context — 26 files,
including the sidebar — picks this up with no edit.

The pages and routes that call `can()` directly must resolve grants themselves, or the nav would
offer a page the page then refuses: `/analytics/`, `/payments/`, `/team/`, `/team/[id]/`,
`/invoices/[id]/`, both `/api/payroll/*` routes, and `src/lib/help/ai.ts` (which decides whether the
AI assistant may discuss financials). Client components among these switch to the context's `can()`
rather than importing the raw one.

### 4. The Team-page fixes

Gate behind `team:view-rates` — which is now grantable, so an owner can hand it back:

- `/team/`: the Total Earnings and Pending Pay columns (header and cells) and the Pending Contractor
  Pay summary card.
- `/team/[id]/`: the Total Earnings, Paid Out and Pending Pay cards, and the invoice table's
  Contractor Pay column.

Session counts, roles, contact details and every non-financial control stay — admins still run the
team. Columns are removed, not blanked, matching how the Rates tab already disappears.

### 5. Knock-on updates

- `invite-contractor` walkthrough (audience `admin`) step 2 says the summary cards show "pending
  contractor pay". That card is about to vanish for un-granted admins, so the wording must stop
  enumerating it — otherwise the tour describes UI the viewer doesn't have, the exact defect fixed
  in `2026-08-02-walkthrough-role-fidelity-design.md`.
- The Team help article and the settings article need the new switches documented, per the repo's
  help-article rule.

## Non-goals

**This is presentational gating, not data-layer enforcement.** RLS lets admins read the `invoices`
table, so `contractor_pay` still arrives in the JSON their browser receives; an admin who opens
devtools can read it. That is the same trade-off every existing owner-only surface already makes
(`financial:view-details` and friends are all UI-side gates over RLS-readable rows). Closing it
means column-level restriction — a split read or a view, plus a hand-applied migration to cert then
prod — and is deliberately deferred to its own spec so the migration gets proper review.

## Testing

- `permissions.test.ts`: contractors are never elevated; owners unaffected; only the four listed
  permissions are grantable; an unknown key in settings grants nothing.
- `settings.test.ts`: `applySettingsUpdate()` drops an admin's attempt to write `permissions`.
- Component-level assertions that the Team surfaces render the financial columns only when granted.
- Full local sweep: `npm run test`, `npx tsc --noEmit`, `npm run lint`, plus the walkthrough audit
  for the admin audience (`AUDIT_ROLE=admin VIEW_AS=admin`) since a tour step changes.
