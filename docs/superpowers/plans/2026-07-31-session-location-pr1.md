# Session Location + Admin-Only Service Types — PR 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every client an owner-configurable session-location field that supports fixed picklists, pure free text, or both; surface that location on client-facing invoices; and hide admin-only service types from contractors via a role rule.

**Architecture:** A single `ClientLocationConfig` per client lives in `organization.settings` JSONB. Free text is the degenerate case (empty `options` + `allow_other`), so there is one render path, not two. Legacy `classrooms_by_client` upgrades on read in `mergeOrganizationSettings()`, so no settings migration runs. The resolved string keeps landing in the existing `sessions.classroom` column. Two new DB columns (`invoice_items.classroom`, `service_types.admin_only`) are applied by hand to cert then prod.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (PostgREST + RLS), Tailwind 4, shadcn/ui, Vitest, react-pdf.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-31-session-location-design.md`. On conflict, the spec wins.
- All route links include trailing slashes (`trailingSlash: true` in `next.config.ts`).
- Migrations are applied BY HAND: cert `gzrukevymmguqxuoynqk` first, verify, then prod `ysmwowzxkgisshaormmf`. Adding a column requires updating **all three** of `Row`, `Insert`, `Update` in `src/types/database.ts`.
- `mergeOrganizationSettings()` must stay pure and memoized at the call site — settings forms mirror it into local state, so an unstable identity wipes unsaved edits.
- Every new `src/lib/` module gets a colocated `*.test.ts`.
- New form controls: `<Label htmlFor="x">` must pair with a control carrying `id="x"` (shadcn `SelectTrigger` accepts `id`).
- Internal `sessions.notes` is staff-only PHI and must never reach a client-facing PDF. Only `client_notes` may. Location is permitted on the client's own invoice, gated by `invoice.show_session_location`.
- Never `console.error` anything that may contain PHI — use `logger` from `@/lib/logger`.
- Verify with `npm run test -- --run`, `npx tsc --noEmit`, `npm run lint`. E2E is serial: `--workers=1`.

---

### Task 1: Location config types, defaults, and legacy upgrade

**Files:**
- Modify: `src/types/database.ts:71-79` (`custom_lists`), `:30-38` (`InvoiceSettings` block in `OrganizationSettings`)
- Modify: `src/lib/organization/settings.ts:48-64` (`DEFAULT_SETTINGS`), `:93-105` (merge)
- Test: `src/lib/organization/settings.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `ClientLocationConfig { label: string; options: string[]; allow_other: boolean; required: boolean }`, exported from `src/types/database.ts`. `custom_lists.locations_by_client: Record<string, ClientLocationConfig>`. `invoice.show_session_location: boolean`.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/organization/settings.test.ts`:

```ts
describe('locations_by_client', () => {
  it('defaults to an empty map', () => {
    const s = mergeOrganizationSettings(null)
    expect(s.custom_lists.locations_by_client).toEqual({})
    expect(s.invoice.show_session_location).toBe(false)
  })

  it('upgrades a legacy classrooms_by_client entry', () => {
    const s = mergeOrganizationSettings({
      custom_lists: { classrooms_by_client: { 'c1': ['Room A', 'Room B'] } },
    })
    expect(s.custom_lists.locations_by_client['c1']).toEqual({
      label: 'Classroom / Program',
      options: ['Room A', 'Room B'],
      allow_other: false,
      required: true,
    })
  })

  it('lets an explicit locations_by_client entry win over the legacy list', () => {
    const s = mergeOrganizationSettings({
      custom_lists: {
        classrooms_by_client: { 'c1': ['Legacy'] },
        locations_by_client: {
          'c1': { label: 'Site', options: ['New'], allow_other: true, required: false },
        },
      },
    })
    expect(s.custom_lists.locations_by_client['c1'].label).toBe('Site')
    expect(s.custom_lists.locations_by_client['c1'].options).toEqual(['New'])
  })

  it('keeps the legacy map readable so nothing silently drops', () => {
    const s = mergeOrganizationSettings({
      custom_lists: { classrooms_by_client: { 'c1': ['Room A'] } },
    })
    expect(s.custom_lists.classrooms_by_client['c1']).toEqual(['Room A'])
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test -- --run src/lib/organization/settings.test.ts`
Expected: FAIL — `locations_by_client` is undefined.

- [ ] **Step 3: Add the types**

In `src/types/database.ts`, above `OrganizationSettings`:

```ts
/** Per-client session-location field config. An empty `options` list with
    `allow_other: true` is pure free text — the same code path, not a special case. */
export interface ClientLocationConfig {
  /** Field label on the session form, e.g. "Classroom", "Site", "Location". */
  label: string
  /** Picklist choices. May be empty. */
  options: string[]
  /** Offer an "Other…" choice that reveals a free-text input. */
  allow_other: boolean
  /** Block submit when no location is supplied. */
  required: boolean
}

export const DEFAULT_LOCATION_LABEL = 'Classroom / Program'
```

In `custom_lists` (after `classrooms_by_client`):

```ts
    /** @deprecated Superseded by `locations_by_client`; still read and upgraded
        on merge so existing org config keeps working. */
    classrooms_by_client: Record<string, string[]>
    /** Per-client location config keyed by the BILLED client's id. */
    locations_by_client: Record<string, ClientLocationConfig>
```

In the `invoice` block of `OrganizationSettings` **and** in the `InvoiceSettings` interface near the file's end, add:

```ts
    show_session_location: boolean
```

- [ ] **Step 4: Add defaults and the merge upgrade**

In `src/lib/organization/settings.ts`, import `DEFAULT_LOCATION_LABEL` and `ClientLocationConfig` from `@/types/database`.

`DEFAULT_SETTINGS.invoice` gains `show_session_location: false`.
`DEFAULT_SETTINGS.custom_lists` gains `locations_by_client: {}`.

Add above `mergeOrganizationSettings`:

```ts
/** Upgrade legacy `classrooms_by_client` string lists into full location configs.
    Explicit `locations_by_client` entries win. Pure — no DB write. */
function mergeLocationConfigs(
  legacy: Record<string, string[]> | undefined,
  explicit: Record<string, ClientLocationConfig> | undefined
): Record<string, ClientLocationConfig> {
  const out: Record<string, ClientLocationConfig> = {}
  for (const [clientId, options] of Object.entries(legacy || {})) {
    out[clientId] = {
      label: DEFAULT_LOCATION_LABEL,
      options: options ?? [],
      allow_other: false,
      required: true,
    }
  }
  for (const [clientId, cfg] of Object.entries(explicit || {})) {
    out[clientId] = {
      label: cfg?.label || DEFAULT_LOCATION_LABEL,
      options: cfg?.options ?? [],
      allow_other: cfg?.allow_other ?? false,
      required: cfg?.required ?? true,
    }
  }
  return out
}
```

In the returned `custom_lists`, after `classrooms_by_client`:

```ts
      locations_by_client: mergeLocationConfigs(
        raw?.custom_lists?.classrooms_by_client,
        raw?.custom_lists?.locations_by_client
      ),
```

- [ ] **Step 5: Run tests**

Run: `npm run test -- --run src/lib/organization/settings.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/database.ts src/lib/organization/settings.ts src/lib/organization/settings.test.ts
git commit -m "feat(settings): per-client location config with legacy classroom upgrade"
```

---

### Task 2: `resolveLocationConfig`

**Files:**
- Create: `src/lib/session-location/config.ts`
- Test: `src/lib/session-location/config.test.ts`

**Interfaces:**
- Consumes: `ClientLocationConfig`, `DEFAULT_LOCATION_LABEL` (Task 1).
- Produces: `resolveLocationConfig(settings, billedClientId, opts): ClientLocationConfig | null` and `isLocationSatisfied(config, value): boolean`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/session-location/config.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveLocationConfig, isLocationSatisfied } from './config'
import { mergeOrganizationSettings } from '@/lib/organization/settings'

const withLists = (custom_lists: Record<string, unknown>) =>
  mergeOrganizationSettings({ custom_lists })

describe('resolveLocationConfig', () => {
  it('returns null when the client has no config and it is not a scholarship group', () => {
    const s = withLists({})
    expect(resolveLocationConfig(s, 'c1', { isScholarshipGroup: false })).toBeNull()
  })

  it('returns the per-client config when present', () => {
    const s = withLists({
      locations_by_client: {
        c1: { label: 'Site', options: ['A'], allow_other: true, required: true },
      },
    })
    expect(resolveLocationConfig(s, 'c1', { isScholarshipGroup: false })?.label).toBe('Site')
  })

  it('falls back to the global classroom list only for scholarship groups', () => {
    const s = withLists({ classrooms: ['Room A', 'Room B'] })
    expect(resolveLocationConfig(s, 'c1', { isScholarshipGroup: false })).toBeNull()
    const g = resolveLocationConfig(s, 'c1', { isScholarshipGroup: true })
    expect(g?.options).toEqual(['Room A', 'Room B'])
    expect(g?.required).toBe(true)
  })

  it('treats an empty-options config with allow_other as free text', () => {
    const s = withLists({
      locations_by_client: {
        c1: { label: 'Location', options: [], allow_other: true, required: true },
      },
    })
    const cfg = resolveLocationConfig(s, 'c1', { isScholarshipGroup: false })
    expect(cfg).not.toBeNull()
    expect(cfg!.options).toEqual([])
    expect(cfg!.allow_other).toBe(true)
  })

  it('returns null for an unfillable config (no options, no free text)', () => {
    const s = withLists({
      locations_by_client: {
        c1: { label: 'Location', options: [], allow_other: false, required: true },
      },
    })
    expect(resolveLocationConfig(s, 'c1', { isScholarshipGroup: false })).toBeNull()
  })

  it('returns null without a billed client', () => {
    const s = withLists({
      locations_by_client: {
        c1: { label: 'Site', options: ['A'], allow_other: false, required: true },
      },
    })
    expect(resolveLocationConfig(s, '', { isScholarshipGroup: false })).toBeNull()
  })
})

describe('isLocationSatisfied', () => {
  const cfg = (required: boolean) => ({
    label: 'L', options: ['A'], allow_other: true, required,
  })

  it('rejects blank and whitespace when required', () => {
    expect(isLocationSatisfied(cfg(true), '')).toBe(false)
    expect(isLocationSatisfied(cfg(true), '   ')).toBe(false)
    expect(isLocationSatisfied(cfg(true), 'A')).toBe(true)
  })

  it('accepts blank when not required', () => {
    expect(isLocationSatisfied(cfg(false), '')).toBe(true)
  })

  it('accepts anything when there is no config', () => {
    expect(isLocationSatisfied(null, '')).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test -- --run src/lib/session-location/config.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/session-location/config.ts`:

```ts
import { DEFAULT_LOCATION_LABEL } from '@/types/database'
import type { ClientLocationConfig, OrganizationSettings } from '@/types/database'

/**
 * Resolve the session-location field config for a session's BILLED client.
 *
 * Precedence, highest first:
 *  1. `custom_lists.locations_by_client[billedClientId]`
 *  2. the global `custom_lists.classrooms` list — scholarship group sessions ONLY
 *  3. null (render no field)
 *
 * Legacy `classrooms_by_client` needs no branch here: `mergeOrganizationSettings()`
 * has already upgraded it into `locations_by_client`.
 *
 * A config that can never be filled — no options and no free text — resolves to
 * null rather than rendering a required field with nothing to pick.
 */
export function resolveLocationConfig(
  settings: OrganizationSettings | null | undefined,
  billedClientId: string,
  opts: { isScholarshipGroup: boolean }
): ClientLocationConfig | null {
  const perClient = billedClientId
    ? settings?.custom_lists?.locations_by_client?.[billedClientId]
    : undefined

  const config: ClientLocationConfig | undefined =
    perClient ??
    (opts.isScholarshipGroup && (settings?.custom_lists?.classrooms?.length ?? 0) > 0
      ? {
          label: DEFAULT_LOCATION_LABEL,
          options: settings!.custom_lists!.classrooms,
          allow_other: false,
          required: true,
        }
      : undefined)

  if (!config) return null
  if (config.options.length === 0 && !config.allow_other) return null
  return config
}

/** Whether a location value satisfies its config. Whitespace is not a value. */
export function isLocationSatisfied(
  config: ClientLocationConfig | null,
  value: string
): boolean {
  if (!config || !config.required) return true
  return value.trim().length > 0
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- --run src/lib/session-location/config.test.ts`
Expected: PASS (all 9).

- [ ] **Step 5: Commit**

```bash
git add src/lib/session-location/
git commit -m "feat(session-location): resolveLocationConfig with free-text and scholarship fallback"
```

---

### Task 3: Migration + DB types for the two new columns

**Files:**
- Create: `supabase/migrations/20260731_session_location_and_admin_services.sql`
- Modify: `src/types/database.ts` — `invoice_items` (`Row`/`Insert`/`Update`, around `:588-620`), `service_types` (`Row`/`Insert`/`Update`, `:355-428`)

**Interfaces:**
- Produces: `invoice_items.classroom: string | null`, `service_types.admin_only: boolean`.

- [ ] **Step 1: Write the migration**

```sql
-- Session location on batch invoice line items + admin-only service types.
-- Spec: docs/superpowers/specs/2026-07-31-session-location-design.md
-- Apply to cert (gzrukevymmguqxuoynqk) first, verify, then prod (ysmwowzxkgisshaormmf).

ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS classroom text;

COMMENT ON COLUMN invoice_items.classroom IS
  'Session location snapshotted at batch-invoice generation, mirroring service_type_name/contractor_name.';

ALTER TABLE service_types ADD COLUMN IF NOT EXISTS admin_only boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN service_types.admin_only IS
  'Hide this service type from contractors in the session form. Admins/owners always see everything.';
```

- [ ] **Step 2: Update the three type sections for each table**

`invoice_items`: add `classroom: string | null` to `Row`, `classroom?: string | null` to `Insert` and `Update`.
`service_types`: add `admin_only: boolean` to `Row`, `admin_only?: boolean` to `Insert` and `Update`.

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Apply to cert and verify**

```bash
TOKEN=$(grep -oE '^SUPABASE_ACCESS_TOKEN=.*' .env.local | cut -d= -f2-)
curl -s -X POST "https://api.supabase.com/v1/projects/gzrukevymmguqxuoynqk/database/query" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(jq -Rs '{query: .}' < supabase/migrations/20260731_session_location_and_admin_services.sql)"
```

Verify:

```sql
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE (table_name='invoice_items' AND column_name='classroom')
   OR (table_name='service_types' AND column_name='admin_only');
```

Expected: two rows; `admin_only` default `false`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/ src/types/database.ts
git commit -m "feat(db): invoice_items.classroom + service_types.admin_only"
```

---

### Task 4: Config-driven location field on the session form

**Files:**
- Modify: `src/components/forms/session-form.tsx` — config block `:166-181`, validation `:411-414`, edit-mode save `:491`, create path `:628`, reset `:677`, render `:1035-1062`

**Interfaces:**
- Consumes: `resolveLocationConfig`, `isLocationSatisfied` (Task 2).
- Produces: no new exports. Writes the resolved string to `sessions.classroom` exactly as before.

- [ ] **Step 1: Replace the config block**

Delete the `isScholarshipGroup` / `agencyClassrooms` / `classroomOptions` / `showClassroom` block at `:166-181` and substitute:

```tsx
  // Scholarship group sessions fall back to the global classroom list
  const isScholarshipGroup = !!(selectedServiceType?.is_scholarship && isGroupService)
  // The billed client drives the location config: the group "Bill To" agency, or
  // the single selected client for an individual session.
  const billedClientId = isGroupService
    ? groupBillingClientId
    : (selectedClients.length === 1 ? selectedClients[0] : '')
  const locationConfig = useMemo(
    () => resolveLocationConfig(settings, billedClientId, { isScholarshipGroup }),
    [settings, billedClientId, isScholarshipGroup]
  )
  const showClassroom = locationConfig !== null
  // "Other…" is a sentinel choice, never a stored value.
  const usingOtherLocation =
    locationConfig?.options.length === 0 || classroomChoice === OTHER_LOCATION
  const resolvedClassroom = usingOtherLocation ? classroomOther.trim() : classroomChoice
```

Add the import and sentinel near the top:

```tsx
import { resolveLocationConfig, isLocationSatisfied } from '@/lib/session-location/config'

const OTHER_LOCATION = '__other__'
```

- [ ] **Step 2: Split the classroom state**

Replace `const [classroom, setClassroom] = useState(existingSession?.classroom || '')` at `:113` with:

```tsx
  // An existing value that isn't in the configured options is a free-text entry.
  const [classroomChoice, setClassroomChoice] = useState('')
  const [classroomOther, setClassroomOther] = useState('')
```

and, after `locationConfig` is available, hydrate once in edit mode:

```tsx
  const didHydrateLocationRef = useRef(false)
  useEffect(() => {
    if (didHydrateLocationRef.current || !locationConfig) return
    const existing = existingSession?.classroom || ''
    if (!existing) { didHydrateLocationRef.current = true; return }
    if (locationConfig.options.includes(existing)) {
      setClassroomChoice(existing)
    } else {
      setClassroomChoice(OTHER_LOCATION)
      setClassroomOther(existing)
    }
    didHydrateLocationRef.current = true
  }, [locationConfig, existingSession?.classroom])
```

- [ ] **Step 3: Update validation**

Replace `:411-414`'s `if (showClassroom && !classroom)` with:

```tsx
      if (showClassroom && !isLocationSatisfied(locationConfig, resolvedClassroom)) {
        setFieldError('classroom', `Please provide a ${locationConfig!.label.toLowerCase()}`)
        hasErrors = true
      }
```

This validation currently lives only inside the group-service branch. Move it **out** of that branch so it also runs for individual sessions — that is the note-#1 fix. Place it immediately after the `if (isGroupService) {...} else if (requiresClient) {...}` chain.

- [ ] **Step 4: Update both save paths and reset**

`:491` and `:628`: replace `classroom: showClassroom ? classroom || null : null` with:

```tsx
            classroom: showClassroom ? (resolvedClassroom || null) : null,
```

`:677`: replace `setClassroom('')` with `setClassroomChoice(''); setClassroomOther('')`.
`:370` form snapshot: replace `classroom` with `classroomChoice, classroomOther`.

- [ ] **Step 5: Replace the render block**

Substitute `:1035-1062` with:

```tsx
          {/* Session location — config-driven per billed client (picklist, free text, or both) */}
          {showClassroom && locationConfig && (
            <div className="space-y-2">
              <Label htmlFor="classroom">
                {locationConfig.label}{locationConfig.required ? ' *' : ''}
              </Label>
              {locationConfig.options.length > 0 && (
                <Select
                  value={classroomChoice}
                  onValueChange={(val) => { setClassroomChoice(val); clearFieldError('classroom') }}
                >
                  <SelectTrigger
                    id="classroom"
                    className={errors.classroom ? 'border-red-500' : ''}
                    aria-invalid={!!errors.classroom}
                    aria-describedby={errors.classroom ? 'classroom-error' : undefined}
                  >
                    <SelectValue placeholder={`Select ${locationConfig.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {locationConfig.options.map((room) => (
                      <SelectItem key={room} value={room}>{room}</SelectItem>
                    ))}
                    {locationConfig.allow_other && (
                      <SelectItem value={OTHER_LOCATION}>Other…</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              {usingOtherLocation && (
                <Input
                  id={locationConfig.options.length > 0 ? 'classroomOther' : 'classroom'}
                  value={classroomOther}
                  onChange={(e) => { setClassroomOther(e.target.value); clearFieldError('classroom') }}
                  placeholder={`Enter ${locationConfig.label.toLowerCase()}`}
                  className={errors.classroom ? 'border-red-500' : ''}
                  aria-invalid={!!errors.classroom}
                  aria-describedby={errors.classroom ? 'classroom-error' : undefined}
                  aria-label={locationConfig.options.length > 0 ? `${locationConfig.label} (other)` : undefined}
                />
              )}
              {errors.classroom && (
                <p id="classroom-error" role="alert" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle aria-hidden="true" className="w-4 h-4" />
                  {errors.classroom}
                </p>
              )}
            </div>
          )}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run test -- --run`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/forms/session-form.tsx
git commit -m "feat(sessions): config-driven location field with free-text support"
```

---

### Task 5: Admin-only service types

**Files:**
- Modify: `src/components/forms/service-type-form.tsx:94`, `:159`, and the restrictions block near `:505`
- Modify: `src/components/forms/session-form.tsx:85-90`

**Interfaces:**
- Consumes: `service_types.admin_only` (Task 3).

- [ ] **Step 1: Filter the picker**

`session-form.tsx:85-90` becomes:

```tsx
  const visibleServiceTypes = useMemo(() => {
    if (showFinancialDetails) return serviceTypes // Admins/owners see all
    return serviceTypes.filter((st) =>
      !st.admin_only &&
      (!st.allowed_contractor_ids || st.allowed_contractor_ids.length === 0 ||
       st.allowed_contractor_ids.includes(effectiveContractorId))
    )
  }, [serviceTypes, effectiveContractorId, showFinancialDetails])
```

- [ ] **Step 2: Add the form field**

`service-type-form.tsx`: `formData` initialiser gains `admin_only: serviceType?.admin_only ?? false`; the submit payload at `:159` gains `admin_only: formData.admin_only`. Immediately above the "Contractor Restrictions" block, add:

```tsx
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="admin_only">Admin Only</Label>
              <p className="text-xs text-gray-500">
                Hide this service from contractors when they log a session. Admins and owners always see it.
              </p>
            </div>
            <Switch
              id="admin_only"
              checked={formData.admin_only}
              onCheckedChange={(checked) => setFormData({ ...formData, admin_only: checked })}
            />
          </div>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/forms/service-type-form.tsx src/components/forms/session-form.tsx
git commit -m "feat(services): admin_only flag hides service types from contractors"
```

---

### Task 6: Location on client-facing invoices

**Files:**
- Modify: `src/lib/invoices/pdf-data.ts` (interfaces `:20-38`, selects `:76-84` and `:101`, return `:116-120`)
- Modify: `src/components/pdf/invoice-pdf.tsx` (`InvoiceLineItem` `:206`, `session` shape `:231`, batch cell `:353`, single cell `:376`)
- Modify: `src/app/actions/scholarship-invoices.ts` (`ItemData` `:154`, push `:188`)
- Modify: `src/app/api/cron/scholarship-batches/route.ts` (`:223` item map, plus its session select)
- Modify: `src/app/api/invoices/[id]/square/route.ts` (`:139` items select, `:148` batch description, `:195` single description, `:63` session select)
- Test: `src/lib/invoices/pdf-data.test.ts`

**Interfaces:**
- Consumes: `invoice_items.classroom` (Task 3), `invoice.show_session_location` (Task 1).
- Produces: `InvoicePdfSession.classroom`, `InvoicePdfLineItem.classroom` — both `string | null`, **already gated**: `fetchInvoicePdfData` blanks them when the setting is off, so the template stays dumb.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/invoices/pdf-data.test.ts`:

```ts
it('includes the session location when show_session_location is on', async () => {
  const invoice = { ...baseInvoice, session: { ...baseInvoice.session, classroom: 'Room 101' } }
  const settings = { invoice: { show_session_location: true } }
  const result = await fetchInvoicePdfData(mockSupabase({ invoice, settings }), 'inv1')
  expect(result!.invoice.session!.classroom).toBe('Room 101')
})

it('blanks the session location when the setting is off', async () => {
  const invoice = { ...baseInvoice, session: { ...baseInvoice.session, classroom: 'Room 101' } }
  const result = await fetchInvoicePdfData(mockSupabase({ invoice, settings: {} }), 'inv1')
  expect(result!.invoice.session!.classroom).toBeNull()
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test -- --run src/lib/invoices/pdf-data.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the gate**

`pdf-data.ts`: add `classroom: string | null` to both `InvoicePdfLineItem` and `InvoicePdfSession`; add `classroom` to the session select and to the `invoice_items` select. After `settings` is read:

```ts
  // Location is client-identifying context, so it only crosses to the client's
  // own invoice when the owner has explicitly opted in.
  const showLocation = settings?.invoice?.show_session_location === true
  if (!showLocation) {
    if (invoice.session) invoice.session.classroom = null
    items = items?.map((i) => ({ ...i, classroom: null }))
  }
```

- [ ] **Step 4: Render it**

`invoice-pdf.tsx`: add `classroom: string | null` to `InvoiceLineItem` and to the `session` shape. In the batch cell after the `Duration:` line:

```tsx
                    {item.classroom && (
                      <Text style={{ fontSize: 9, color: '#6b7280' }}>
                        Location: {item.classroom}
                      </Text>
                    )}
```

and the identical block in the single-session cell using `invoice.session.classroom`.

- [ ] **Step 5: Snapshot into batch line items**

`scholarship-invoices.ts`: `ItemData` gains `classroom: string | null`; the `items.push({...})` gains `classroom: d.session.classroom ?? null`. Ensure the session select feeding it includes `classroom`.
`cron/scholarship-batches/route.ts`: same — add `classroom` to the session select and `classroom: d.session.classroom ?? null` to the item map.

**Both paths are required.** Missing either silently blanks the location on monthly statements.

- [ ] **Step 6: Square descriptions**

`square/route.ts`: add `classroom` to the session select and to the `invoice_items` select. Append to the single-session description at `:195`:

```ts
      const locationSuffix = invoice.session?.classroom ? ` — ${invoice.session.classroom}` : ''
      description = `${invoice.session?.service_type?.name || 'Session'} on ${sessionDate} — ${nameList}${locationSuffix}`
```

- [ ] **Step 7: Verify**

Run: `npm run test -- --run && npx tsc --noEmit && npm run lint`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/invoices/pdf-data.ts src/lib/invoices/pdf-data.test.ts src/components/pdf/invoice-pdf.tsx src/app/actions/scholarship-invoices.ts "src/app/api/cron/scholarship-batches/route.ts" "src/app/api/invoices/[id]/square/route.ts"
git commit -m "feat(invoices): show session location on invoices behind an owner toggle"
```

---

### Task 7: Close the portal-approval bypass

**Files:**
- Modify: `src/app/api/session-requests/[id]/approve/route.ts:163`

**Interfaces:**
- Consumes: `resolveLocationConfig` (Task 2).

- [ ] **Step 1: Accept and validate a location**

Read an optional `classroom` from the request body. Load the org settings and the request's client id, resolve the config, and reject rather than writing `null`:

```ts
  const locationConfig = resolveLocationConfig(settings, clientId, { isScholarshipGroup: false })
  if (locationConfig?.required && !(body.classroom || '').trim()) {
    return NextResponse.json(
      { error: `A ${locationConfig.label.toLowerCase()} is required for this client` },
      { status: 400 }
    )
  }
```

Then pass `classroom: (body.classroom || '').trim() || null` to `createNewSession()` in place of the hardcoded `null` at `:163`.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/session-requests/[id]/approve/route.ts"
git commit -m "fix(session-requests): stop bypassing required session location on approve"
```

---

### Task 8: Owner-facing settings UI

**Files:**
- Create: `src/components/settings/client-location-editor.tsx`
- Delete: `src/components/settings/classrooms-by-client.tsx`
- Modify: `src/app/(dashboard)/settings/business/page.tsx:24` (import), `:615-628` (editor), Invoices tab (new toggle)

**Interfaces:**
- Consumes: `ClientLocationConfig` (Task 1).
- Produces: `<ClientLocationEditor organizationId value onChange />` where `value: Record<string, ClientLocationConfig>`.

- [ ] **Step 1: Build the editor**

Model it on the deleted `ClassroomsByClientEditor` — same client fetch, same add/remove flow — but each row renders: a **Label** text input, an **Options** comma-separated input, and **Allow free text** / **Required** switches. Row header shows the client name with a remove button. Keep the `onBlur`-commits-options behaviour so typing commas doesn't thrash state.

Helper text:

> When a session is billed to one of these clients, contractors are asked for a location. Leave Options empty and turn on "Allow free text" for clients whose location changes every session.

- [ ] **Step 2: Wire it into the Sessions tab**

Replace the `ClassroomsByClientEditor` usage at `:615-628`, writing to `custom_lists.locations_by_client`. Keep the existing global "Classroom Options" input (it still drives the scholarship-group fallback) and relabel its section to "Session Locations".

- [ ] **Step 3: Add the invoice toggle**

In the Invoices tab, alongside the existing switches:

```tsx
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_session_location">Show Session Location on Invoices</Label>
                    <p className="text-xs text-gray-500">
                      Include the classroom, site, or location on client-facing invoices and Square descriptions
                    </p>
                  </div>
                  <Switch
                    id="show_session_location"
                    checked={localSettings.invoice?.show_session_location ?? false}
                    onCheckedChange={(checked) =>
                      setLocalSettings({
                        ...localSettings,
                        invoice: { ...localSettings.invoice, show_session_location: checked },
                      })
                    }
                  />
                </div>
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run test -- --run`
Expected: all pass. Confirm no stale imports of `classrooms-by-client` remain:
`grep -rn "classrooms-by-client\|ClassroomsByClientEditor" src/` → no results.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/ "src/app/(dashboard)/settings/business/page.tsx"
git commit -m "feat(settings): owner-managed per-client location editor + invoice toggle"
```

---

### Task 9: Help content and coverage guard

**Files:**
- Modify: `src/app/(dashboard)/help/_data/articles/sessions.ts`, `articles/invoices.ts`, `articles/settings.ts`
- Modify: `src/app/(dashboard)/help/_data/integrity.test.ts` (`COVERAGE_MATRIX`)

- [ ] **Step 1: Update the articles**

- `sessions.ts`: document the location field — when it appears, that it may be a dropdown, free text, or a dropdown with "Other…", and that it can be required.
- `invoices.ts`: document the **Show Session Location on Invoices** toggle.
- `settings.ts`: document the per-client location editor (label / options / allow free text / required) and the **Admin Only** service-type flag.

Each new/edited article keeps ≥3 lowercase `keywords`. Add synonyms to `SYNONYMS` in `search.ts` so "room", "site", "where", and "location" all reach the right article.

- [ ] **Step 2: Verify the guard**

Run: `npm run test -- --run "src/app/(dashboard)/help/_data/integrity.test.ts"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(dashboard)/help/_data/"
git commit -m "docs(help): session location + admin-only service types"
```

---

### Task 10: Full verification and merge

- [ ] **Step 1: Full local suite**

```bash
npm run test -- --run
npx tsc --noEmit
npm run lint
```
Expected: all green. Record actual output — do not claim success without it.

- [ ] **Step 2: Manual cert pass**

With the dev server against cert, exercise all four rows of spec §3.1:
picklist-only (required), picklist + Other, pure free text, and a client with no config (no field).
Confirm the value round-trips through edit mode, and that a contractor cannot see an `admin_only` service.

- [ ] **Step 3: Apply the migration to prod**

Same Management API call as Task 3 Step 4 against `ysmwowzxkgisshaormmf`; re-run the verification query.

- [ ] **Step 4: Merge and push**

```bash
git checkout main && git merge --no-ff feat/session-location && git push origin main
```

- [ ] **Step 5: Confirm deploy**

```bash
gh api repos/weberl48/MTApp/commits/$(git rev-parse HEAD)/status \
  --jq '.state, (.statuses[]?|select(.context=="Vercel")|.description)'
```
Expected: "Deployment has completed". Ignore a red `build-and-deploy` — that PR-preview check is known-broken and non-blocking.
