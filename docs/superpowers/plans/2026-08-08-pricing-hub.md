# Pricing Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/settings/pricing/` — the single owner-only home for all pricing config (money-flow canvas + live simulator) — and strip pricing editing from Business Rules and Team.

**Architecture:** Client page mirroring `settings/business/page.tsx` patterns (`useOrganization`, browser Supabase writes under owner RLS, `updateSettings()` for org settings). New pure lib module for simulator input assembly; additive pay-source attribution in the pricing engine. Spec: `docs/superpowers/specs/2026-08-08-pricing-hub-design.md`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, shadcn/ui, Supabase, Vitest.

## Global Constraints

- All route links carry trailing slashes (`trailingSlash: true`).
- Client components use `can()` from `useOrganization()` context, never the raw import.
- Page gate: `can('settings:edit')` — owner/developer only; denial UI copies Business Rules' ("You do not have permission…").
- `service_types` / `contractor_rates` writes: browser client (owner RLS). Org settings writes: ONLY `OrganizationContext.updateSettings()`.
- No schema, RLS, or migration changes. `rent_percentage` and `scholarship_discount_percentage` stay legacy — never surfaced.
- Tour ids, article slugs, and FAQ ids are stable — content/targets change, identifiers never.
- Commits: no Co-Authored-By trailers (user is sole author).
- Duration columns everywhere come from `resolveDurationOptions(settings)` (`src/lib/settings/input.ts`).
- Money display via `formatCurrency` from `@/lib/pricing`.

---

### Task 1: Engine pay-source attribution

**Files:**
- Modify: `src/lib/pricing/index.ts` (PricingCalculation interface; each contractor-pay branch)
- Test: `src/lib/pricing/index.test.ts` (append new describe block)

**Interfaces:**
- Produces: `PricingCalculation.contractorPaySource?: ContractorPaySource`, `contractorCapApplied?: boolean`, `totalCapApplied?: boolean`; exported type `ContractorPaySource = 'group_matrix' | 'custom_rate_increment' | 'custom_rate_schedule_offset' | 'custom_rate_scaled' | 'pay_schedule' | 'formula'`.

- [ ] **Step 1: Write failing tests** — new `describe('contractor pay source attribution')` in `index.test.ts` with one test per branch (service fixtures already exist in the file; follow its fixture style):

```ts
describe('contractor pay source attribution', () => {
  it('group matrix wins for group services', () => {
    const st = makeService({ per_person_rate: 10, group_contractor_pay: { '3_30': 50 } })
    const r = calculateSessionPricing(st, 3, 30)
    expect(r.contractorPaySource).toBe('group_matrix')
  })
  it('custom rate + explicit increment', () => {
    const r = calculateSessionPricing(makeService({}), 1, 45, { customContractorPay: 40, durationIncrement: 5 })
    expect(r.contractorPaySource).toBe('custom_rate_increment')
  })
  it('custom rate at base duration is custom_rate_increment source too', () => {
    const r = calculateSessionPricing(makeService({}), 1, 30, { customContractorPay: 40 })
    expect(r.contractorPaySource).toBe('custom_rate_increment')
  })
  it('custom rate + schedule offset', () => {
    const st = makeService({ contractor_pay_schedule: { '30': 38, '45': 50 } })
    const r = calculateSessionPricing(st, 1, 45, { customContractorPay: 40 })
    expect(r.contractorPaySource).toBe('custom_rate_schedule_offset')
  })
  it('custom rate scaled linearly with no schedule', () => {
    const r = calculateSessionPricing(makeService({}), 1, 60, { customContractorPay: 40 })
    expect(r.contractorPaySource).toBe('custom_rate_scaled')
  })
  it('pay schedule', () => {
    const st = makeService({ contractor_pay_schedule: { '45': 50 } })
    expect(calculateSessionPricing(st, 1, 45).contractorPaySource).toBe('pay_schedule')
  })
  it('formula, with cap flag when clamped', () => {
    const st = makeService({ base_rate: 100, mca_percentage: 20, contractor_cap: 50 })
    const r = calculateSessionPricing(st, 1, 30)
    expect(r.contractorPaySource).toBe('formula')
    expect(r.contractorCapApplied).toBe(true)
  })
  it('total cap flag', () => {
    const st = makeService({ base_rate: 100, total_cap: 80 })
    expect(calculateSessionPricing(st, 1, 30).totalCapApplied).toBe(true)
  })
})
```

Note on the custom-rate branch nuances (must match `index.ts:125-146`): at base duration → `custom_rate_increment`; explicit `durationIncrement` number → `custom_rate_increment`; explicit `durationIncrement` present but resolving null with no schedule → `custom_rate_scaled`; no explicit increment but schedule offset available → `custom_rate_schedule_offset`; neither → `custom_rate_scaled`.

- [ ] **Step 2:** `npm run test -- --run src/lib/pricing/index.test.ts` — new tests FAIL (property undefined).
- [ ] **Step 3:** Implement: add the exported type + three optional fields on `PricingCalculation`; set a `paySource` local in each branch of the priority chain; set `contractorCapApplied` where the cap clamps (formula branch), `totalCapApplied` where `total_cap` clamps; attach to the result object.
- [ ] **Step 4:** Test file passes; full `npm run test -- --run` still green (additive fields must not break `price-session.test.ts` deep-equality — if its assertions use `toEqual` on whole objects, extend expectations there).
- [ ] **Step 5:** Commit `feat(pricing): attribute which rule produced contractor pay`.

### Task 2: Simulator input assembly module

**Files:**
- Create: `src/lib/pricing/simulate.ts`
- Test: `src/lib/pricing/simulate.test.ts`

**Interfaces:**
- Consumes: `calculateSessionPricing`, `calculateNoShowPricing`, `ContractorPricingOverrides`, `PricingCalculation` from `@/lib/pricing`; `OrganizationSettings`, `ServiceType` from `@/types/database`.
- Produces:

```ts
export interface SimulatorState {
  serviceType: ServiceType
  headcount: number            // clamped to >=1; only meaningful for group services
  durationMinutes: number
  contractorOverrides?: ContractorPricingOverrides
  scholarship: boolean         // forced true when serviceType.is_scholarship
  noShow: boolean
}
export interface SimulationResult extends PricingCalculation { appliedNoShowFee?: number }
export function isGroupService(st: ServiceType): boolean            // per_person_rate > 0
export function scholarshipLocked(st: ServiceType): boolean         // is_scholarship
export function simulate(state: SimulatorState, settings: OrganizationSettings | null | undefined): SimulationResult
export const PAY_SOURCE_LABELS: Record<ContractorPaySource, string>
```

- [ ] **Step 1: Failing tests** covering: group service uses headcount, individual forces attendeeCount 1; scholarship flag maps to `paymentMethod: 'scholarship'` and is forced on for `is_scholarship` services even when `state.scholarship` is false; `noShow: true` routes through `calculateNoShowPricing` with `settings.pricing.no_show_fee` (and default 60 when settings absent) and sets `appliedNoShowFee`; `durationBaseMinutes` passed from settings; labels cover every `ContractorPaySource` key (`Object.keys(PAY_SOURCE_LABELS)` length assertion against a literal list).
- [ ] **Step 2:** Run — FAIL (module missing).
- [ ] **Step 3:** Implement. `simulate()`:

```ts
export function simulate(state, settings): SimulationResult {
  const scholarship = state.scholarship || scholarshipLocked(state.serviceType)
  if (state.noShow) {
    const fee = settings?.pricing?.no_show_fee ?? 60
    return { ...calculateNoShowPricing(state.serviceType, state.contractorOverrides, fee), appliedNoShowFee: fee }
  }
  const attendeeCount = isGroupService(state.serviceType) ? Math.max(1, state.headcount) : 1
  return calculateSessionPricing(state.serviceType, attendeeCount, state.durationMinutes, undefined, {
    contractorOverrides: state.contractorOverrides,
    paymentMethod: scholarship ? 'scholarship' : undefined,
    durationBaseMinutes: settings?.pricing?.duration_base_minutes,
  })
}
```

`PAY_SOURCE_LABELS`: `group_matrix: 'Group pay matrix'`, `custom_rate_increment: 'Custom contractor rate'`, `custom_rate_schedule_offset: 'Custom rate + schedule offset'`, `custom_rate_scaled: 'Custom rate (scaled by duration)'`, `pay_schedule: 'Service pay schedule'`, `formula: 'Formula: total − MCA %'`.

- [ ] **Step 4:** Tests pass.
- [ ] **Step 5:** Commit `feat(pricing): pure simulator input assembly`.

### Task 3: Editable cell component

**Files:**
- Create: `src/components/pricing/editable-cell.tsx`

**Interfaces:**
- Produces:

```ts
interface EditableCellProps {
  value: number | null                 // null renders emptyDisplay
  display?: string                     // override rendered text (e.g. formatCurrency or "25%")
  emptyDisplay?: string                // default '—'
  placeholder?: string                 // e.g. the auto value
  canEdit: boolean
  nullable?: boolean                   // empty input saves null (caps); else empty = invalid
  min?: number
  step?: string                        // default '0.50'
  onSave: (value: number | null) => Promise<void>   // caller does the Supabase write + toast
}
export function EditableCell(props: EditableCellProps): JSX.Element
```

- [ ] **Step 1:** Implement, modeled on the `PayRateMatrix` cell interaction (`pay-rate-matrix.tsx:518-614`): display span (+ pencil on hover when `canEdit`) → inline `<Input type="number">` with autoFocus, Enter=save / Escape=cancel, check/X icon buttons, spinner while the `onSave` promise is pending. Parse: `parseFloat`; empty string → `nullable ? null : reject with toast.error('Please enter a valid amount')`; `isNaN || < (min ?? 0)` rejects. No colocated test (interaction component; logic lives in callers and is covered by Task 1/2 + integrity suites — matches existing PayRateMatrix precedent).
- [ ] **Step 2:** `npx tsc --noEmit` clean. Commit `feat(pricing): shared click-to-edit cell`.

### Task 4: Slim service dialog

**Files:**
- Modify: `src/components/forms/service-type-form.tsx`

**Interfaces:**
- Props unchanged (`serviceType`, `isOpen`, `onClose`, `onSaved`) — callers move in Task 8.

- [ ] **Step 1:** Remove from the form UI: contractor cap, total cap, rent percentage, scholarship rate, pay-schedule list, group pay matrix (delete `initPaySchedule`, `initGroupPay`, `GROUP_HEADCOUNTS`, the `calculateSessionPricing` auto-calc import usage). Keep: name, category, location, and all toggles + contractor restrictions.
- [ ] **Step 2:** Create mode only (`!serviceType`): a "Pricing" fieldset with **Base Rate ($) — required**, **Per-Person Rate ($) — default 0**, **MCA Percentage (%) — required, `min=0 max=100`, helper text "The organization's cut. Contractor pay defaults to total minus this."** Edit mode renders a muted note instead: `Rates for this service are edited on the Pricing page.` (no link — the dialog IS on that page).
- [ ] **Step 3:** Submit payload: edit mode sends ONLY identity/behavior fields (name, category, location, toggles, `allowed_contractor_ids`) — never money (prevents clobbering table edits); create mode additionally sends `base_rate`, `per_person_rate`, `mca_percentage`, and `display_order` = (max existing)+1 (pass a new optional prop `nextDisplayOrder?: number` from the hub; default keeps current behavior). Keep the `driver-active` interact-outside guard and `data-tour` attributes on surviving fields (`category-location`, `contractor-restrictions`).
- [ ] **Step 4:** `npx tsc --noEmit`; commit `refactor(services): dialog owns identity & behavior; money moves to pricing hub`.

### Task 5: Rate tables — client-pays (§1) and business-keeps (§3)

**Files:**
- Create: `src/components/pricing/billing-table.tsx`, `src/components/pricing/business-cut-table.tsx`

**Interfaces:**
- Both consume: `EditableCell` (Task 3); props:

```ts
interface RateTableProps {
  serviceTypes: ServiceType[]          // all, display_order asc; inactive rendered dimmed + Badge
  canEdit: boolean
  onUpdate: (id: string, patch: Partial<ServiceType>) => Promise<void>  // page owns the Supabase write
}
// billing-table additionally:
interface BillingTableProps extends RateTableProps {
  onAdd: () => void
  onEdit: (st: ServiceType) => void
  onDelete: (st: ServiceType) => void
}
```

- [ ] **Step 1:** `billing-table.tsx` — Card titled "1 · What the client pays", `data-tour="pricing-billing-table"` on the table wrapper; "Add service" Button `data-tour="pricing-add-service"` in the header. Columns: Service (name + inactive badge + per-row Pencil→`onEdit` / Trash2→`onDelete` icon buttons), Base rate (`nullable:false`), Per-person (`nullable:false`, value 0 displays `$0.00`), Total cap (`nullable:true`), Scholarship rate (`nullable:true`). Cells call `onUpdate(st.id, { base_rate: v })` etc. Horizontal scroll wrapper as in PayRateMatrix (`overflow-x-auto`).
- [ ] **Step 2:** `business-cut-table.tsx` — Card "3 · What the business keeps", `data-tour="pricing-cut-table"`. Columns: Service, **MCA %** (EditableCell, `display: st.mca_percentage + '%'`, `step:'1'`, min 0; reject >100 in the cell via `min`/manual check in onSave wrapper), **Contractor cap** (`nullable:true`), **Margin @ base** read-only: `formatCurrency(calculateSessionPricing(st, 1, base).mcaCut)` where `base = settings.pricing?.duration_base_minutes ?? 30` (pass `durationBase: number` prop).
- [ ] **Step 3:** `npx tsc --noEmit`; commit `feat(pricing): billing + business-cut rate tables`.

### Task 6: Contractor-pay section (§2)

**Files:**
- Create: `src/components/pricing/pay-schedule-grid.tsx`, `src/components/pricing/group-pay-grid.tsx`

**Interfaces:**

```ts
interface PayScheduleGridProps {   // individual services only (per_person_rate === 0)
  serviceTypes: ServiceType[]
  durations: number[]              // resolveDurationOptions(settings)
  canEdit: boolean
  onUpdate: (id: string, schedule: Record<string, number> | null) => Promise<void>
}
interface GroupPayGridProps {      // one collapsible per group service
  serviceType: ServiceType
  durations: number[]
  canEdit: boolean
  onUpdate: (id: string, matrix: Record<string, number> | null) => Promise<void>
}
```

- [ ] **Step 1:** `pay-schedule-grid.tsx` — table rows = individual services, cols = durations; cell value `st.contractor_pay_schedule?.[String(dur)] ?? null`; placeholder = auto value `calculateSessionPricing(st, 1, dur).contractorPay.toFixed(2)` (formula fallback, exactly what the old dialog showed); `nullable:true` — saving null deletes the key, saving a number sets it; onSave builds the next schedule object and calls `onUpdate(st.id, keys.length ? next : null)` (only positive values kept, mirroring the old form's submit filter). `data-tour="pricing-pay-schedule"` on the section wrapper.
- [ ] **Step 2:** `group-pay-grid.tsx` — per service a bordered collapsible (chevron button + service name); grid identical to the old form's matrix: rows headcount 1–6 (6 labeled "6+"), cols = durations, keys `` `${h}_${dur}` ``; empty cell placeholder "—"; same null/positive filtering. `data-tour="pricing-group-pay"` on the wrapper of the list.
- [ ] **Step 3:** `npx tsc --noEmit`; commit `feat(pricing): contractor pay schedule + group matrix grids`.

### Task 7: Policies & fees form (§4) and simulator card

**Files:**
- Create: `src/components/pricing/policies-form.tsx`, `src/components/pricing/simulator.tsx`

**Interfaces:**

```ts
interface PoliciesFormProps { }   // self-contained: uses useOrganization() settings + updateSettings
interface SimulatorProps {
  serviceTypes: ServiceType[]     // active only
  contractors: { id: string; name: string | null }[]
  rates: Map<string, { contractor_pay: number; duration_increment: number | null }>  // key `${contractorId}:${serviceTypeId}`
}
```

- [ ] **Step 1:** `policies-form.tsx` — Card "4 · Policies & fees", `data-tour="pricing-policies"`. Local state mirrors `settings` (same `useEffect` sync pattern as business page). Fields moved VERBATIM (ids, labels, helper text, parse fns) from business page: `#no_show_fee` (business/page.tsx:586-599), `#duration_base_minutes` (:600-613), and the whole Square Processing Fee block (:360-469). One Save button calling `updateSettings(localSettings)` with the same toasts. Muted footer: `Session duration choices are in Business Rules → Sessions; they define the columns in the pay grids above.` (Link to `/settings/business/`.)
- [ ] **Step 2:** `simulator.tsx` — Card "Price a session", `data-tour="pricing-simulator"`. State: serviceTypeId (default first active), contractorId ('' = default), duration (default `settings.session.default_duration ?? 30`), headcount (default 2, shown only when `isGroupService`), scholarship + noShow booleans (Switches; scholarship Switch disabled+on when `scholarshipLocked`). Compute via `simulate()` (Task 2) with overrides from `rates.get(`${contractorId}:${serviceTypeId}`)` mapped to `{ customContractorPay: r.contractor_pay, durationIncrement: r.duration_increment }`. Render rows: Total, Per person, Contractor pay, MCA cut, Scholarship discount (when present), and badges: `PAY_SOURCE_LABELS[result.contractorPaySource]` (Badge variant outline), `Contractor cap applied` / `Total cap applied` when flagged, `No-show fee $X` when `appliedNoShowFee`. Sticky on desktop: page wraps it in `lg:sticky lg:top-4` (Task 8).
- [ ] **Step 3:** `npx tsc --noEmit`; commit `feat(pricing): policies form + live simulator`.

### Task 8: Hub page + settings card

**Files:**
- Create: `src/app/(dashboard)/settings/pricing/page.tsx`
- Modify: `src/app/(dashboard)/settings/page.tsx` (cards array)

**Interfaces:**
- Consumes every component from Tasks 3–7 plus `PayRateMatrix` (`@/components/team/pay-rate-matrix`), `PageHelp`, `ConfirmDialog`/`useConfirmDialog`.

- [ ] **Step 1:** Page (client). Gate: `can('settings:edit')` else the Business-Rules-style denial. Data: one effect loading `service_types` (all, `display_order` asc), `users` (contractors: `role='contractor'`, org-scoped), `contractor_rates` (id, contractor_id, service_type_id, contractor_pay, duration_increment) — org-scoped queries copied from PayRateMatrix's loader. `onUpdate(id, patch)` = `supabase.from('service_types').update(patch).eq('id', id)` + optimistic local state + `toast.success('Saved')`/`toast.error('Failed to save')`; schedule/matrix variants pass `{ contractor_pay_schedule }` / `{ group_contractor_pay }`. Delete uses `useConfirmDialog` with the exact copy from business/page.tsx:110-127. ServiceTypeForm mounted with `key={editing?.id || 'new'}` + `nextDisplayOrder`; keep the `?tour=edit-service` hold-open effect moved from business page (:69-76) — same searchParams/tour logic, targeting this page.
- [ ] **Step 2:** Layout:

```tsx
<div className="flex items-center gap-4">…back link to /settings/… <h1>Pricing</h1> <PageHelp article="pricing-hub" />
  <p className="text-muted-foreground">How a session price becomes contractor pay and business margin</p></div>
<div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm …">Rate changes affect new sessions only. <Link href="/sessions/">Re-price existing sessions →</Link></div>
<div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
  <div className="space-y-6 min-w-0">
    <BillingTable … />
    <Card data-tour="pay-rate-matrix-section">…"2 · What the contractor earns"…
      <PayScheduleGrid … /> {groupServices.map(st => <GroupPayGrid key={st.id} … />)}
      <h3>Per-contractor overrides</h3> <PayRateMatrix organizationId={org.id} canEdit={true} />
    </Card>
    <BusinessCutTable … />
    <PoliciesForm />
  </div>
  <div className="lg:sticky lg:top-4"><Simulator … /></div>
</div>
```

On mobile the simulator div renders FIRST (`order-first lg:order-none` on the sidebar div) so the calculator is reachable without scrolling past every table.
- [ ] **Step 3:** Settings landing: import `DollarSign`, insert after Business Rules: `{ title: 'Pricing', description: 'Service rates, contractor pay, fees — and a price simulator', href: '/settings/pricing/', icon: DollarSign, ownerOnly: true }`.
- [ ] **Step 4:** Manual check: `npx tsc --noEmit && npm run lint`. Commit `feat(pricing): the pricing hub page`.

### Task 9: Strip old surfaces

**Files:**
- Modify: `src/app/(dashboard)/settings/business/page.tsx`, `src/app/(dashboard)/team/page.tsx`

- [ ] **Step 1:** Business page: delete the Services tab trigger (:166-171), TabsContent (:200-265), ServiceTypeForm import/mount, service-type state (`serviceTypes`, `editingServiceType`, `isServiceTypeFormOpen`, `loadData`, `handleDeleteServiceType`), the tour hold-open effect (:63-76), and unused imports (Plus/Pencil/Trash2/Badge/ServiceTypeForm/ServiceType). `Tabs defaultValue="invoices"` unconditionally. Header `PageHelp article="generating-invoices"`; subtitle → `Invoicing, sessions, notifications, and features`.
- [ ] **Step 2:** Owner pointer card above the tabs: `{isOwner && (<Card><CardContent className="flex items-center justify-between …"><div><p className="font-medium">Service pricing has moved</p><p className="text-sm text-muted-foreground">Rates, contractor pay, and fees now live on the Pricing page.</p></div><Link href="/settings/pricing/"><Button variant="outline">Open Pricing</Button></Link></CardContent></Card>)}`.
- [ ] **Step 3:** Sessions tab: replace the `<h3>Pricing</h3>` block (:585-613) with `<p className="text-xs text-muted-foreground">No-show fee and rate scaling moved to <Link href="/settings/pricing/" className="underline">Settings › Pricing</Link>.</p>`. Invoices tab: replace the Square fee block (:360-469) the same way (`Square processing fee settings moved to …`). Keep both Save buttons (they still save their remaining fields).
- [ ] **Step 4:** Team page: `<PayRateMatrix organizationId={…} canEdit={false} />`; above it, owner-only (`canManage` is not the right gate — use `can('settings:edit')` computed like the page's other perms): `<Link href="/settings/pricing/"><Button variant="outline" size="sm">Edit rates in Settings › Pricing</Button></Link>`; description line "Pay rates are view-only here."
- [ ] **Step 5:** `npx tsc --noEmit && npm run lint`; commit `refactor(settings,team): pricing editing moves to the hub; pointers behind`.

### Task 10: Retarget guided tours

**Files:**
- Modify: `src/components/walkthroughs/walkthroughs/index.ts`

- [ ] **Step 1:** `configure-services` (:273-312): every `href` → `/settings/pricing/`; step 1 description "Service pricing lives in Settings > Pricing."; step 2 element `[data-tour="pricing-billing-table"]`, copy describing the client-pays table + pencil/trash row actions; step 3 element `[data-tour="pricing-add-service"]`, copy: create asks name, category, location, base rate and MCA % — everything else is edited in the tables; step 4 unchanged concept (points at the Edit a Service Type tour).
- [ ] **Step 2:** `edit-service-type` (:431-555): rebuild steps against the hub — 1) nav to `/settings/pricing/`; 2) `[data-tour="pricing-billing-table"]` (base/per-person/total-cap/scholarship cells, click-to-edit); 3) `[data-tour="pricing-pay-schedule"]` (reuse the old pay-schedule copy :510); 4) `[data-tour="pricing-group-pay"]` (headcount × duration grids for group services); 5) `[data-tour="pricing-cut-table"]` (MCA % — now editable — contractor cap, margin preview); 6) `href: '/settings/pricing/?tour=edit-service'` steps for the slim dialog: `#name`, `[data-tour="category-location"]`, `#is_scholarship`, `#requires_client`, `[data-tour="contractor-restrictions"]`, `#is_active` — keep each field's existing description text (:453-547) verbatim where the field survived; 7) final step copy: changes affect new sessions; point at Recalculate pricing.
- [ ] **Step 3:** `contractor-rates` (:806-855): steps 1–2 become nav to `/settings/pricing/` (element `nav a[href="/settings/"]`, then `[data-tour="pay-rate-matrix-section"]`); steps 3–4 keep their copy but `href: '/settings/pricing/'` and drop the `preClick`/`team-tab-rates` bits (element `[data-tour="pay-rate-matrix"]`); step 5 unchanged. `invite-contractor`'s owner step (:242-250): copy → "The Rates tab shows every contractor's pay per service — view-only; editing lives in Settings > Pricing."
- [ ] **Step 4:** `recalculate-pricing` final step (:909-913 area): append "Rates themselves are edited in Settings > Pricing." to the step-1 or final description.
- [ ] **Step 5:** `npm run test -- --run src/app/\(dashboard\)/help` (integrity: tours still launch from adminOnly articles, order unchanged) — expect pass; `npx tsc --noEmit`. Commit `feat(walkthroughs): tours follow pricing to the hub`.

### Task 11: Help content

**Files:**
- Modify: `src/app/(dashboard)/help/_data/articles/settings.ts` (new article + 3 updates), `articles/team.ts`, `articles/sessions.ts`, `faqs.ts`, `search.ts`, `integrity.test.ts`

- [ ] **Step 1:** New article in settings.ts — `slug: 'pricing-hub'`, title "The Pricing Page: Rates, Pay, and the Price Simulator", category `settings`, `adminOnly: true`, keywords ≥3 (`['pricing', 'rates', 'simulator', 'pay', 'mca']`), `relatedArticles: ['pricing-deep-dive', 'configuring-services', 'editing-service-types', 'managing-contractor-rates']`, `walkthrough: 'configure-services'`. Content: the money-flow sections (what each table edits), the five-tier pay priority in user language, the simulator + "priced by" badge, the re-price link.
- [ ] **Step 2:** Update copy referencing old locations: `configuring-services` + `editing-service-types` (Settings > Pricing; tables instead of one dialog; MCA % now editable), `pricing-deep-dive` (add "see it live: the simulator names which rule priced the session"; add `pricing-hub` to related), `managing-contractor-rates` in team.ts (matrix edited on Pricing page; Team tab view-only), `recalculating-pricing` in sessions.ts (rates edited at Settings > Pricing).
- [ ] **Step 3:** faqs.ts: `change-no-show-fee` answer → "Settings > Pricing (Policies & fees)"; `contractor-pay-differs` mention the simulator; `rate-change-not-applied` path touch-up. search.ts SYNONYMS: `'simulator': ['pricing', 'calculator']`-style entries for "price calculator", "pricing page", "simulator" mapping into existing vocab (follow the map's actual shape when editing).
- [ ] **Step 4:** integrity.test.ts COVERAGE_MATRIX: replace `'/settings/business/services'` row with `'/settings/pricing': ['pricing-hub', 'pricing-deep-dive', 'configuring-services', 'editing-service-types', 'managing-contractor-rates']`.
- [ ] **Step 5:** `npm run test -- --run src/app` (help integrity + component tests) — pass. Commit `docs(help): pricing hub articles, FAQs, coverage`.

### Task 12: Full verification

- [ ] **Step 1:** `npm run test -- --run` — all green (record counts).
- [ ] **Step 2:** `npx tsc --noEmit` — clean.
- [ ] **Step 3:** `npm run lint` — clean.
- [ ] **Step 4:** `npm run build` — compiles (catches route/link issues `tsc` misses).
- [ ] **Step 5:** Fix anything surfaced, re-run, commit `chore(pricing): verification fixes` if needed. Note in the final report: the live walkthrough audit (`scripts/audit-walkthroughs.mts`) needs a running dev server + cert credentials — flagged as follow-up, not run here.

## Self-review (done at planning time)

- Spec coverage: §1→T5, §2→T6+T8, §3→T5, §4→T7, simulator→T2+T7, engine→T1, dialog→T4, nav/old surfaces→T8+T9, tours→T10, help→T11, verification→T12. Gap check: none.
- Placeholders: none — every step names files, fields, ids, and copy.
- Type consistency: `ContractorPaySource` (T1) is the key type of `PAY_SOURCE_LABELS` (T2) consumed in T7; `RateTableProps.onUpdate` signature matches the page's implementation in T8; `EditableCellProps.onSave` is `Promise<void>` everywhere.
