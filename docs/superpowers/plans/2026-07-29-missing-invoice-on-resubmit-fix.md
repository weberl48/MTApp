# Missing Invoice on Resubmit — Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the P0 billing leak where a session that reaches `submitted`/`approved` by *updating* (draft→submit, or resubmit after Request Revision) never gets an invoice, and add an in-app recovery path for already-stranded sessions.

**Architecture:** Extract the invoice-creation block from `createNewSession()` into a shared, idempotent `ensureSessionInvoices()` (checks for ANY existing invoice or batch line item before creating — fail-safe: never creates when the check errors). Call it from (1) the create path as today, (2) the session-form edit branch when the final status is not `draft`, (3) a server-side loader wrapper `ensureInvoicesForSessionId()` used by a new `createSessionInvoices` server action (manual "Create Invoice" button on the session detail page) and as a backstop inside `approveSession`/`bulkApproveSessions` before auto-send. This is bug-doc option **A + C** plus a server-side approval backstop.

**Tech Stack:** Next.js 16 / React 19 / TypeScript, Supabase (client-side + server actions), Vitest (mock-supabase pattern), Playwright e2e.

**Source spec:** `docs/bugs/2026-07-29-missing-invoice-on-resubmit.md` (mechanism, production proof, fix options).

**No DB changes.** No migration needed. RLS already permits every path: contractors can INSERT invoices for their own sessions (`supabase/migrations/20260610_contractor_invoice_insert_policy.sql`, applied to prod), SELECT invoices for their sessions (schema.sql:606), and SELECT invoice_items for their sessions (20250208 migration). Admin paths use "Admins can manage invoices in org".

**Verified premises (2026-07-29, read from code — do not re-derive):**
- Only 3 invoice INSERT sites exist in `src/`: `create-session.ts:135` + two scholarship batch paths. No `ensureSessionInvoices` exists yet.
- The edit branch (`session-form.tsx:476-586`) never creates invoices; its regen block is gated on `linkedInvoices.length > 0` (line 525), and `linkedInvoices` **excludes paid invoices** (query at line 320-326 uses `.neq('status','paid')`) — so idempotency must be checked in the DB across ALL statuses, never via `linkedInvoices`.
- The form's `status` state is typed `'draft' | 'submitted'` but line 102 casts `existingSession.status`, so it can hold `'approved'` at runtime when editing an approved session → use `status !== 'draft'`, not `status === 'submitted'`.
- `rejectSession` (`actions/sessions.ts:288`) deletes only PENDING invoices then reverts to draft. A session with a SENT/PAID invoice reverted to draft keeps that invoice → the ANY-status idempotency check prevents double-billing on resubmit.
- `sessions` rows store `total_amount`/`mca_cut`/`contractor_pay` but NOT rent; pricing hardcodes `rentAmount = 0` (deprecated). Per-person amount is stored on `session_attendees.individual_cost`.
- `approveSession`/`bulkApproveSessions` only flip submitted→approved (guarded `.eq('status','submitted')`) and auto-send *existing* invoices — a stranded session stays stranded through approval today.
- The session-requests approve route reuses `createNewSession` → already creates invoices; not a leak.
- The `sessions/[id]` detail page already imports `FileText`, `toast`, `startTransition`, `can()`; buttons live in the header flex at lines 285-337.

---

### Task 0: Branch setup

**Files:** none (git only)

- [ ] **Step 1: Create the working branch from up-to-date main**

```bash
git checkout main && git pull && git checkout -b fix/missing-invoice-on-resubmit
```

Expected: `Switched to a new branch 'fix/missing-invoice-on-resubmit'`

---

### Task 1: Core `ensureSessionInvoices()` — shared, idempotent invoice creation

**Files:**
- Create: `src/lib/invoices/ensure-session-invoices.ts`
- Test: `src/lib/invoices/ensure-session-invoices.test.ts`

This module owns the logic currently inlined at `src/lib/session-form/create-session.ts:93-138`, plus the new idempotency pre-check. Behavioral deltas vs. the old inline block (both intentional): a failed `clients` read now sets `invoiceError` instead of silently creating nothing, and the ANY-status invoice / invoice_items pre-check is new.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/invoices/ensure-session-invoices.test.ts`:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { ensureSessionInvoices } from './ensure-session-invoices'

const PRICING = { totalAmount: 90, perPersonCost: 90, mcaCut: 27, contractorPay: 63, rentAmount: 0 }

interface MockOpts {
  existingInvoices?: Array<{ id: string }>
  existingItems?: Array<{ id: string }>
  clients?: Array<{ id: string; payment_method: string; billing_frequency: string | null; square_fee_enabled: boolean | null }>
  insertError?: boolean
  invoicesCheckError?: boolean
}

function makeSupabase(opts: MockOpts) {
  const inserted: any[] = []
  const supabase: any = {
    from(table: string) {
      if (table === 'invoices') {
        return {
          select: () => ({
            eq: () => ({
              limit: async () =>
                opts.invoicesCheckError
                  ? { data: null, error: { message: 'check failed' } }
                  : { data: opts.existingInvoices ?? [], error: null },
            }),
          }),
          insert: async (rows: any[]) => {
            inserted.push(...rows)
            return { error: opts.insertError ? { message: 'insert fail' } : null }
          },
        }
      }
      if (table === 'invoice_items') {
        return {
          select: () => ({
            eq: () => ({
              limit: async () => ({ data: opts.existingItems ?? [], error: null }),
            }),
          }),
        }
      }
      if (table === 'clients') {
        return {
          select: () => ({
            in: async () => ({ data: opts.clients ?? [], error: null }),
          }),
        }
      }
      return {}
    },
  }
  return { supabase, inserted }
}

function baseParams(supabase: any) {
  return {
    supabase,
    sessionId: 's1',
    organizationId: 'o1',
    date: '2026-02-09',
    clientIds: ['c1'],
    isGroup: false,
    pricing: PRICING,
    isScholarshipService: false,
  }
}

const PER_SESSION_CLIENT = { id: 'c1', payment_method: 'group_home', billing_frequency: 'per_session', square_fee_enabled: null }

describe('ensureSessionInvoices', () => {
  it('creates a pending invoice for a per-session client when none exists', async () => {
    const { supabase, inserted } = makeSupabase({ clients: [PER_SESSION_CLIENT] })
    const result = await ensureSessionInvoices(baseParams(supabase))
    expect(result).toEqual({ created: 1, alreadyInvoiced: false, invoiceError: false })
    expect(inserted).toHaveLength(1)
    expect(inserted[0]).toMatchObject({
      session_id: 's1',
      client_id: 'c1',
      amount: 90,
      mca_cut: 27,
      contractor_pay: 63,
      rent_amount: 0,
      payment_method: 'group_home',
      status: 'pending',
      apply_square_fee: null,
      organization_id: 'o1',
    })
    // No dueDays passed → no due_date field
    expect(inserted[0].due_date).toBeUndefined()
  })

  it('computes due_date from the session date + dueDays', async () => {
    const { supabase, inserted } = makeSupabase({ clients: [PER_SESSION_CLIENT] })
    await ensureSessionInvoices({ ...baseParams(supabase), dueDays: 30 })
    // 2026-02-09 + 30 days (Feb 2026 has 28 days) = 2026-03-11
    expect(inserted[0].due_date).toBe('2026-03-11')
  })

  it('no-ops when ANY invoice already exists for the session (even paid)', async () => {
    const { supabase, inserted } = makeSupabase({ existingInvoices: [{ id: 'inv-paid' }], clients: [PER_SESSION_CLIENT] })
    const result = await ensureSessionInvoices(baseParams(supabase))
    expect(result).toEqual({ created: 0, alreadyInvoiced: true, invoiceError: false })
    expect(inserted).toHaveLength(0)
  })

  it('no-ops when the session is on a batch invoice (invoice_items row exists)', async () => {
    const { supabase, inserted } = makeSupabase({ existingItems: [{ id: 'item1' }], clients: [PER_SESSION_CLIENT] })
    const result = await ensureSessionInvoices(baseParams(supabase))
    expect(result).toEqual({ created: 0, alreadyInvoiced: true, invoiceError: false })
    expect(inserted).toHaveLength(0)
  })

  it('fails safe: does NOT create when the idempotency check errors', async () => {
    const { supabase, inserted } = makeSupabase({ invoicesCheckError: true, clients: [PER_SESSION_CLIENT] })
    const result = await ensureSessionInvoices(baseParams(supabase))
    expect(result).toEqual({ created: 0, alreadyInvoiced: false, invoiceError: true })
    expect(inserted).toHaveLength(0)
  })

  it('creates nothing for a scholarship service type', async () => {
    const { supabase, inserted } = makeSupabase({ clients: [PER_SESSION_CLIENT] })
    const result = await ensureSessionInvoices({ ...baseParams(supabase), isScholarshipService: true })
    expect(result).toEqual({ created: 0, alreadyInvoiced: false, invoiceError: false })
    expect(inserted).toHaveLength(0)
  })

  it('skips scholarship-payment and monthly-billed clients, invoicing only eligible ones', async () => {
    const { supabase, inserted } = makeSupabase({
      clients: [
        { id: 'c1', payment_method: 'private_pay', billing_frequency: 'per_session', square_fee_enabled: null },
        { id: 'c2', payment_method: 'scholarship', billing_frequency: 'per_session', square_fee_enabled: null },
        { id: 'c3', payment_method: 'private_pay', billing_frequency: 'monthly', square_fee_enabled: null },
      ],
    })
    const result = await ensureSessionInvoices({ ...baseParams(supabase), clientIds: ['c1', 'c2', 'c3'] })
    expect(result.created).toBe(1)
    expect(inserted).toHaveLength(1)
    expect(inserted[0].client_id).toBe('c1')
    // Shares are split across ELIGIBLE clients only → the single invoice carries the full cut
    expect(inserted[0].mca_cut).toBe(27)
  })

  it('splits mca_cut/contractor_pay across eligible clients so the shares sum exactly', async () => {
    const clients = ['a', 'b', 'c'].map((id) => ({ id, payment_method: 'private_pay', billing_frequency: 'per_session', square_fee_enabled: null }))
    const { supabase, inserted } = makeSupabase({ clients })
    await ensureSessionInvoices({
      ...baseParams(supabase),
      clientIds: ['a', 'b', 'c'],
      pricing: { totalAmount: 100, perPersonCost: 33.33, mcaCut: 10, contractorPay: 90, rentAmount: 0 },
    })
    expect(inserted).toHaveLength(3)
    const mcaSum = inserted.reduce((s, inv) => s + inv.mca_cut, 0)
    const paySum = inserted.reduce((s, inv) => s + inv.contractor_pay, 0)
    expect(Math.round(mcaSum * 100) / 100).toBe(10)
    expect(Math.round(paySum * 100) / 100).toBe(90)
  })

  it('invoices the full session total to the billing client for group sessions', async () => {
    const { supabase, inserted } = makeSupabase({ clients: [{ id: 'agency', payment_method: 'group_home', billing_frequency: 'per_session', square_fee_enabled: null }] })
    await ensureSessionInvoices({
      ...baseParams(supabase),
      clientIds: ['agency'],
      isGroup: true,
      pricing: { totalAmount: 240, perPersonCost: 60, mcaCut: 0, contractorPay: 240, rentAmount: 0 },
    })
    expect(inserted[0].amount).toBe(240)
  })

  it("snapshots the client's Square-fee opt-in", async () => {
    const { supabase, inserted } = makeSupabase({ clients: [{ ...PER_SESSION_CLIENT, square_fee_enabled: true }] })
    await ensureSessionInvoices(baseParams(supabase))
    expect(inserted[0].apply_square_fee).toBe(true)
  })

  it('reports invoiceError when the insert fails', async () => {
    const { supabase } = makeSupabase({ clients: [PER_SESSION_CLIENT], insertError: true })
    const result = await ensureSessionInvoices(baseParams(supabase))
    expect(result).toEqual({ created: 0, alreadyInvoiced: false, invoiceError: true })
  })

  it('no-ops with empty clientIds', async () => {
    const { supabase, inserted } = makeSupabase({})
    const result = await ensureSessionInvoices({ ...baseParams(supabase), clientIds: [] })
    expect(result).toEqual({ created: 0, alreadyInvoiced: false, invoiceError: false })
    expect(inserted).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- --run src/lib/invoices/ensure-session-invoices.test.ts`
Expected: FAIL — `Cannot find module './ensure-session-invoices'` (or equivalent resolve error).

- [ ] **Step 3: Implement the module**

Create `src/lib/invoices/ensure-session-invoices.ts`:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PricingCalculation } from '@/lib/pricing'
import type { OrganizationSettings } from '@/types/database'
import { distributeAmount } from '@/lib/invoices/split'
import { addDays, format } from 'date-fns'
import { parseLocalDate } from '@/lib/dates'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>

export interface EnsureSessionInvoicesParams {
  supabase: AnySupabase
  sessionId: string
  organizationId: string
  /** Session date (yyyy-MM-dd), combined with dueDays for the invoice due date. */
  date: string
  clientIds: string[]
  isGroup: boolean
  pricing: PricingCalculation
  isScholarshipService: boolean
  dueDays?: number
}

export interface EnsureSessionInvoicesResult {
  created: number
  alreadyInvoiced: boolean
  invoiceError: boolean
}

/**
 * Create the per-session invoices for a session if — and only if — none exist yet.
 *
 * The single shared home for per-session invoice creation (bug: sessions submitted from
 * draft were never invoiced — docs/bugs/2026-07-29-missing-invoice-on-resubmit.md).
 * Idempotent: an existing invoice of ANY status (a paid invoice must never be doubled)
 * or a batch line item means the session is already billed. Fails safe: when the
 * existence check itself errors, nothing is created.
 *
 * Scholarship service types create nothing; scholarship-payment and monthly-billed
 * clients are skipped per-client — those sessions are held for the monthly batch flow.
 */
export async function ensureSessionInvoices(
  params: EnsureSessionInvoicesParams
): Promise<EnsureSessionInvoicesResult> {
  const { supabase, sessionId, organizationId, date, clientIds, isGroup, pricing, isScholarshipService, dueDays } = params
  const none: EnsureSessionInvoicesResult = { created: 0, alreadyInvoiced: false, invoiceError: false }

  if (isScholarshipService || clientIds.length === 0) return none

  const { data: existingInvoices, error: invoicesCheckError } = await supabase
    .from('invoices')
    .select('id')
    .eq('session_id', sessionId)
    .limit(1)
  if (invoicesCheckError) return { ...none, invoiceError: true }
  if ((existingInvoices ?? []).length > 0) return { ...none, alreadyInvoiced: true }

  const { data: existingItems, error: itemsCheckError } = await supabase
    .from('invoice_items')
    .select('id')
    .eq('session_id', sessionId)
    .limit(1)
  if (itemsCheckError) return { ...none, invoiceError: true }
  if ((existingItems ?? []).length > 0) return { ...none, alreadyInvoiced: true }

  const { data: clientData, error: clientsError } = await supabase
    .from('clients')
    .select('id, payment_method, billing_frequency, square_fee_enabled')
    .in('id', clientIds)
  if (clientsError) return { ...none, invoiceError: true }

  const eligibleClients = (clientData || []).filter(
    (client) => client.payment_method !== 'scholarship' && client.billing_frequency !== 'monthly'
  )
  const invoiceCount = eligibleClients.length
  if (invoiceCount === 0) return none

  const dueDate = dueDays != null
    ? format(addDays(parseLocalDate(date), dueDays), 'yyyy-MM-dd')
    : undefined

  // Remainder-aware split so the per-client mca_cut / contractor_pay / rent shares sum
  // back to the session total (independent rounding would drift by a cent per split).
  const mcaShares = distributeAmount(pricing.mcaCut, invoiceCount)
  const contractorShares = distributeAmount(pricing.contractorPay, invoiceCount)
  const rentShares = distributeAmount(pricing.rentAmount, invoiceCount)

  const invoices = eligibleClients.map((client, i) => ({
    session_id: sessionId,
    client_id: client.id,
    // Group sessions: invoice the full amount to the billing agency
    amount: isGroup ? pricing.totalAmount : pricing.perPersonCost,
    mca_cut: mcaShares[i],
    contractor_pay: contractorShares[i],
    rent_amount: rentShares[i],
    payment_method: client.payment_method,
    status: 'pending' as const,
    // Snapshot the client's Square-fee opt-in; null = follow org setting.
    apply_square_fee: client.square_fee_enabled ? true : null,
    organization_id: organizationId,
    ...(dueDate && { due_date: dueDate }),
  }))

  const { error: insertError } = await supabase.from('invoices').insert(invoices)
  if (insertError) return { ...none, invoiceError: true }

  return { created: invoices.length, alreadyInvoiced: false, invoiceError: false }
}

interface SessionRowForInvoicing {
  id: string
  date: string
  status: string
  organization_id: string
  total_amount: number | null
  mca_cut: number | null
  contractor_pay: number | null
  group_headcount: number | null
  service_type: { is_scholarship: boolean | null } | Array<{ is_scholarship: boolean | null }> | null
  attendees: Array<{ client_id: string; individual_cost: number | null }> | null
}

/**
 * Server-side entry point: load a session by id and ensure its invoices exist,
 * building the pricing from the session's STORED amounts (the billing truth —
 * re-pricing from the service type could drift from what was approved).
 * Rent is retired (always 0 in current pricing) and was never stored on sessions.
 *
 * Used by the "Create Invoice" recovery action and as a backstop on approval.
 */
export async function ensureInvoicesForSessionId(
  supabase: AnySupabase,
  sessionId: string
): Promise<EnsureSessionInvoicesResult & { error?: string }> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id, date, status, organization_id, total_amount, mca_cut, contractor_pay, group_headcount,
      service_type:service_types(is_scholarship),
      attendees:session_attendees(client_id, individual_cost)
    `)
    .eq('id', sessionId)
    .single()

  if (error || !data) {
    return { created: 0, alreadyInvoiced: false, invoiceError: false, error: 'Session not found' }
  }
  const session = data as unknown as SessionRowForInvoicing

  if (session.status !== 'submitted' && session.status !== 'approved') {
    return { created: 0, alreadyInvoiced: false, invoiceError: false, error: 'Only submitted or approved sessions can be invoiced' }
  }

  const attendees = session.attendees ?? []
  if (attendees.length === 0) {
    return { created: 0, alreadyInvoiced: false, invoiceError: false }
  }

  const serviceType = Array.isArray(session.service_type) ? session.service_type[0] : session.service_type

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', session.organization_id)
    .single()
  const dueDays = (org?.settings as OrganizationSettings | undefined)?.invoice?.due_days

  const isGroup = session.group_headcount != null && session.group_headcount > 0
  const totalAmount = Number(session.total_amount ?? 0)
  const perPersonCost = attendees[0]?.individual_cost != null
    ? Number(attendees[0].individual_cost)
    : totalAmount / attendees.length

  return ensureSessionInvoices({
    supabase,
    sessionId: session.id,
    organizationId: session.organization_id,
    date: session.date,
    clientIds: attendees.map((a) => a.client_id),
    isGroup,
    pricing: {
      totalAmount,
      perPersonCost,
      mcaCut: Number(session.mca_cut ?? 0),
      contractorPay: Number(session.contractor_pay ?? 0),
      rentAmount: 0,
    },
    isScholarshipService: serviceType?.is_scholarship ?? false,
    dueDays,
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- --run src/lib/invoices/ensure-session-invoices.test.ts`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/invoices/ensure-session-invoices.ts src/lib/invoices/ensure-session-invoices.test.ts
git commit -m "feat(invoices): shared idempotent ensureSessionInvoices for per-session billing"
```

---

### Task 2: Tests for `ensureInvoicesForSessionId` (server-side wrapper)

**Files:**
- Modify: `src/lib/invoices/ensure-session-invoices.test.ts` (append a describe block)

- [ ] **Step 1: Write the failing-then-passing wrapper tests**

Append to `src/lib/invoices/ensure-session-invoices.test.ts` (the wrapper already exists from Task 1, so these should pass immediately — they pin the loader's behavior). First, extend the existing import at the top of the file to:

```typescript
import { ensureSessionInvoices, ensureInvoicesForSessionId } from './ensure-session-invoices'
```

Then append:

```typescript
interface WrapperOpts extends MockOpts {
  session?: any
  orgSettings?: any
}

function makeWrapperSupabase(opts: WrapperOpts) {
  const base = makeSupabase(opts)
  const inner = base.supabase.from.bind(base.supabase)
  base.supabase.from = (table: string) => {
    if (table === 'sessions') {
      return {
        select: () => ({
          eq: () => ({
            single: async () => opts.session
              ? { data: opts.session, error: null }
              : { data: null, error: { message: 'not found' } },
          }),
        }),
      }
    }
    if (table === 'organizations') {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { settings: opts.orgSettings ?? {} }, error: null }),
          }),
        }),
      }
    }
    return inner(table)
  }
  return base
}

const STORED_SESSION = {
  id: 's1',
  date: '2026-02-09',
  status: 'submitted',
  organization_id: 'o1',
  total_amount: 90,
  mca_cut: 27,
  contractor_pay: 63,
  group_headcount: null,
  service_type: { is_scholarship: false },
  attendees: [{ client_id: 'c1', individual_cost: 90 }],
}

describe('ensureInvoicesForSessionId', () => {
  it('creates the invoice from the stored session amounts', async () => {
    const { supabase, inserted } = makeWrapperSupabase({
      session: STORED_SESSION,
      clients: [PER_SESSION_CLIENT],
      orgSettings: { invoice: { due_days: 30 } },
    })
    const result = await ensureInvoicesForSessionId(supabase, 's1')
    expect(result.created).toBe(1)
    expect(result.error).toBeUndefined()
    expect(inserted[0]).toMatchObject({
      session_id: 's1',
      amount: 90,
      mca_cut: 27,
      contractor_pay: 63,
      rent_amount: 0,
      due_date: '2026-03-11',
    })
  })

  it('refuses sessions that are not submitted/approved', async () => {
    const { supabase, inserted } = makeWrapperSupabase({
      session: { ...STORED_SESSION, status: 'draft' },
      clients: [PER_SESSION_CLIENT],
    })
    const result = await ensureInvoicesForSessionId(supabase, 's1')
    expect(result.error).toBe('Only submitted or approved sessions can be invoiced')
    expect(inserted).toHaveLength(0)
  })

  it('returns an error for a missing session', async () => {
    const { supabase } = makeWrapperSupabase({})
    const result = await ensureInvoicesForSessionId(supabase, 'nope')
    expect(result.error).toBe('Session not found')
  })

  it('invoices the full total for group sessions', async () => {
    const { supabase, inserted } = makeWrapperSupabase({
      session: {
        ...STORED_SESSION,
        group_headcount: 4,
        total_amount: 240,
        contractor_pay: 240,
        mca_cut: 0,
        attendees: [{ client_id: 'agency', individual_cost: 240 }],
      },
      clients: [{ id: 'agency', payment_method: 'group_home', billing_frequency: 'per_session', square_fee_enabled: null }],
    })
    await ensureInvoicesForSessionId(supabase, 's1')
    expect(inserted[0].amount).toBe(240)
  })

  it('creates nothing for scholarship service types', async () => {
    const { supabase, inserted } = makeWrapperSupabase({
      session: { ...STORED_SESSION, service_type: { is_scholarship: true } },
      clients: [PER_SESSION_CLIENT],
    })
    const result = await ensureInvoicesForSessionId(supabase, 's1')
    expect(result.created).toBe(0)
    expect(inserted).toHaveLength(0)
  })
})
```

Note: `MockOpts`, `makeSupabase`, `PER_SESSION_CLIENT` are already defined at the top of this test file (Task 1).

- [ ] **Step 2: Run the full test file**

Run: `npm run test -- --run src/lib/invoices/ensure-session-invoices.test.ts`
Expected: PASS (17 tests).

- [ ] **Step 3: Commit**

```bash
git add src/lib/invoices/ensure-session-invoices.test.ts
git commit -m "test(invoices): pin ensureInvoicesForSessionId loader behavior"
```

---

### Task 3: Refactor `createNewSession()` to delegate

**Files:**
- Modify: `src/lib/session-form/create-session.ts:93-138`

- [ ] **Step 1: Replace the inline invoice block**

In `src/lib/session-form/create-session.ts`, add the import:

```typescript
import { ensureSessionInvoices } from '@/lib/invoices/ensure-session-invoices'
```

Then replace everything from the comment `// If submitted, create invoices for each per-session-billed client.` (line 93) through the closing brace of `if (invoices.length > 0) {...}` (line 137) with:

```typescript
    // If submitted, create invoices for each per-session-billed client. Scholarship
    // services and scholarship/monthly clients are skipped inside ensureSessionInvoices —
    // those sessions are held for the monthly batch flow instead.
    if (status === 'submitted' || status === 'approved') {
      const result = await ensureSessionInvoices({
        supabase,
        sessionId: session.id,
        organizationId,
        date,
        clientIds,
        isGroup,
        pricing,
        isScholarshipService: isScholarshipService ?? false,
        dueDays,
      })
      invoiceError = result.invoiceError
    }
```

The now-unused imports in `create-session.ts` (`distributeAmount`, `addDays`, `format`, `parseLocalDate`) must be removed — `npm run lint` will flag them.

- [ ] **Step 2: Run the existing create-session test + lint**

Run: `npm run test -- --run src/lib/session-form/create-session.test.ts && npm run lint`
Expected: PASS / no errors. (The existing test exercises the attendee-failure path, which never reaches invoice creation — it must stay green.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/session-form/create-session.ts
git commit -m "refactor(sessions): createNewSession delegates invoice creation to ensureSessionInvoices"
```

---

### Task 4: Session form edit branch — create invoices on draft→submit

**Files:**
- Modify: `src/components/forms/session-form.tsx` (imports; `performSave` edit branch ~line 520; toasts ~line 568)

No component unit test — the logic lives in the Task 1 module (fully unit-tested); this task is wiring, covered by the Task 8 e2e test.

- [ ] **Step 1: Add the import**

In `src/components/forms/session-form.tsx`, next to the existing `createNewSession` import:

```typescript
import { ensureSessionInvoices, type EnsureSessionInvoicesResult } from '@/lib/invoices/ensure-session-invoices'
```

- [ ] **Step 2: Call ensure after the attendees update**

In the edit branch of `performSave`, directly after the attendees insert block ends (after `if (attendeesError) throw attendeesError` and its closing `}`, ~line 520) and BEFORE the `// If the user opted to regenerate...` comment, insert:

```typescript
        // A session can reach 'submitted' by editing a draft — or after Request Revision
        // deleted its pending invoice — so ensure per-session invoices exist for the final
        // status. Idempotent: no-ops when any invoice (any status) or batch line item
        // already covers this session. NOTE: `status` is typed 'draft' | 'submitted' but
        // can hold 'approved' at runtime when editing an approved session (cast at init),
        // hence the !== 'draft' check.
        let ensured: EnsureSessionInvoicesResult | null = null
        if (status !== 'draft' && pricing && editClientIds.length > 0) {
          ensured = await ensureSessionInvoices({
            supabase,
            sessionId: existingSession.id,
            organizationId: organization!.id,
            date,
            clientIds: editClientIds,
            isGroup: !!isGroupService,
            pricing,
            isScholarshipService: selectedServiceType?.is_scholarship ?? false,
            dueDays: settings?.invoice?.due_days,
          })
        }
```

(`editClientIds` is declared a few lines above at ~line 507; `organization`, `settings`, `selectedServiceType` are already in scope — the create branch uses them the same way.)

- [ ] **Step 3: Surface the outcome in the final toasts**

Replace (currently ~lines 568-572):

```typescript
        } else if (linkedInvoices.length > 0) {
          toast.success('Session updated. Invoice was not regenerated.')
        } else {
          toast.success('Session updated successfully!')
        }
```

with:

```typescript
        } else if (linkedInvoices.length > 0) {
          toast.success('Session updated. Invoice was not regenerated.')
        } else if (ensured?.invoiceError) {
          toast.error('Session updated, but the invoice could not be created. Use "Create Invoice" on the session page to retry.')
        } else if (ensured && ensured.created > 0) {
          toast.success(ensured.created > 1 ? 'Session updated and invoices created.' : 'Session updated and invoice created.')
        } else {
          toast.success('Session updated successfully!')
        }
```

- [ ] **Step 4: Type check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/forms/session-form.tsx
git commit -m "fix(sessions): create missing invoices when a session is submitted via edit (P0 draft-resubmit leak)"
```

---

### Task 5: Server action + approval backstop

**Files:**
- Modify: `src/app/actions/sessions.ts` (new action; `approveSession` ~line 94; `bulkApproveSessions` ~line 128)

- [ ] **Step 1: Add the import**

In `src/app/actions/sessions.ts`, with the other `@/lib` imports:

```typescript
import { ensureInvoicesForSessionId } from '@/lib/invoices/ensure-session-invoices'
```

- [ ] **Step 2: Add the `createSessionInvoices` server action**

Add after `rejectSession` (ends ~line 320):

```typescript
/**
 * Manual recovery: create the missing per-session invoices for a submitted/approved
 * session. Backs the "Create Invoice" button on the session detail page and makes the
 * delete-invoice dialog's "you can re-invoice them later" promise true.
 */
export async function createSessionInvoices(sessionId: string) {
  const permErr = await requirePermission('session:approve')
  if (permErr) return permErr

  const supabase = await createClient()
  const result = await ensureInvoicesForSessionId(supabase, sessionId)

  if (result.error) return { error: result.error }
  if (result.invoiceError) return { error: 'Failed to create invoices. Please try again.' }

  revalidateSessionPaths(sessionId)
  return { success: true as const, created: result.created, alreadyInvoiced: result.alreadyInvoiced }
}
```

- [ ] **Step 3: Backstop single approve**

In `approveSession`, between the `if (!approved || approved.length === 0)` early-return (ends ~line 92) and the `// Auto-send via automation settings` block, insert:

```typescript
  // Backstop for the draft→submit gap (docs/bugs/2026-07-29-missing-invoice-on-resubmit.md):
  // a session that reached 'submitted' by editing may have no invoice. Ensure it exists
  // BEFORE auto-send so approval always yields a billable invoice.
  try {
    await ensureInvoicesForSessionId(supabase, sessionId)
  } catch (e) {
    logger.error('Ensure invoices on approve failed', e)
  }
```

- [ ] **Step 4: Backstop bulk approve**

In `bulkApproveSessions`, directly before the `const autoSendResults = await Promise.allSettled(` line (~line 130), insert:

```typescript
  // Backstop for the draft→submit gap (see approveSession): ensure invoices exist for the
  // sessions actually approved here BEFORE auto-send.
  await Promise.allSettled(approvedIds.map((id) => ensureInvoicesForSessionId(supabase, id)))
```

- [ ] **Step 5: Verify existing action tests + types**

Run: `npm run test -- --run src/app/actions && npx tsc --noEmit`
Expected: PASS (markpaid/noshow/session-requests suites unaffected), no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/actions/sessions.ts
git commit -m "feat(sessions): createSessionInvoices recovery action + ensure-invoices backstop on approve"
```

---

### Task 6: "Create Invoice" button on the session detail page

**Files:**
- Modify: `src/app/(dashboard)/sessions/[id]/page.tsx`

- [ ] **Step 1: Load invoice existence + is_scholarship**

1. In the `SessionDetails` interface, change the `service_type` line to add `is_scholarship`:

```typescript
  service_type: { id: string; name: string; base_rate: number; per_person_rate: number; mca_percentage: number; is_scholarship: boolean | null } | null
```

2. In the `loadSession` select (line ~103), change the embedded resource to match:

```
service_type:service_types(id, name, base_rate, per_person_rate, mca_percentage, is_scholarship),
```

3. Add state next to the other `useState` calls (~line 66) — default `true` so the button never flashes before the check completes:

```typescript
  const [hasInvoice, setHasInvoice] = useState(true)
```

4. In `loadSession`, after `setSession(sessionData)` and before `setLoading(false)`, insert:

```typescript
      // Existence check for the "Create Invoice" recovery button: a per-session invoice
      // (any status) or a batch line item means this session is billed.
      const [{ data: linkedInvoice }, { data: batchItem }] = await Promise.all([
        supabase.from('invoices').select('id').eq('session_id', sessionId).limit(1).maybeSingle(),
        supabase.from('invoice_items').select('id').eq('session_id', sessionId).limit(1).maybeSingle(),
      ])
      setHasInvoice(!!linkedInvoice || !!batchItem)
```

- [ ] **Step 2: Add the import, handler, and gate**

1. Add `createSessionInvoices` to the existing `@/app/actions/sessions` import list (line 17-23).

2. Add the handler after `handleApprove` (~line 154):

```typescript
  const handleCreateInvoice = () => {
    if (!session) return
    startTransition(async () => {
      const result = await createSessionInvoices(session.id)
      if ('error' in result && result.error) {
        toast.error(result.error)
        return
      }
      if ('created' in result && result.created > 0) {
        toast.success(result.created > 1 ? `${result.created} invoices created` : 'Invoice created')
        setHasInvoice(true)
      } else if ('alreadyInvoiced' in result && result.alreadyInvoiced) {
        toast.info('This session is already invoiced.')
        setHasInvoice(true)
      } else {
        toast.info('No per-session invoice needed — the attending clients are billed monthly or by scholarship batch.')
      }
    })
  }
```

3. Add the gate next to the other `canX` computations (~line 252):

```typescript
  const canCreateInvoice =
    can('session:approve') &&
    ['submitted', 'approved'].includes(session.status) &&
    !hasInvoice &&
    !session.service_type?.is_scholarship &&
    (session.attendees?.length ?? 0) > 0
```

- [ ] **Step 3: Render the button**

In the header button group, after the two `{canApprove && ...}` blocks (~line 302), insert:

```tsx
          {canCreateInvoice && (
            <Button onClick={handleCreateInvoice} variant="outline" className="w-full sm:w-auto">
              <FileText className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          )}
```

(`FileText` is already imported on line 11.)

- [ ] **Step 4: Type check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/sessions/[id]/page.tsx"
git commit -m "feat(sessions): Create Invoice recovery button for unbilled submitted/approved sessions"
```

---

### Task 7: Help articles

**Files:**
- Modify: `src/app/(dashboard)/help/_data/help-articles.ts` (articles `logging-a-session` ~line 135, `generating-invoices` ~line 235, `approving-sessions` ~line 725)

Read the file around each anchor before editing — content is markdown inside template strings.

- [ ] **Step 1: `logging-a-session` — draft behavior**

After the step reading `3. Under **Save as**, choose **Submit for approval** or **Save as draft**, then click the button at the bottom (it reads **Submit Session** or **Save Draft** to match your choice).` (~line 158), add a note line:

```markdown
Drafts are not billed — the invoice is created automatically when the session is submitted for approval (whether you submit right away or open the draft later and submit it then).
```

- [ ] **Step 2: `approving-sessions` — revision loop recreates the invoice**

1. In the bullet `- **Request Revision** (called **Revise** on the sessions list) - Sends the session back to draft status with a reason...` (~line 744), append to the bullet:

```markdown
Any pending invoice for the session is removed at this point and recreated automatically when the contractor resubmits.
```

2. In the paragraph ending `...The contractor edits the session and resubmits, at which point it returns to your review queue.` (~line 761), append:

```markdown
Resubmitting also recreates the session's invoice automatically, so nothing goes unbilled.
```

- [ ] **Step 3: `generating-invoices` — document the recovery button**

Add a new section to the `generating-invoices` article content:

```markdown
## Missing an invoice?

If a submitted or approved session has no invoice (for example, after an invoice was deleted), open the session's detail page — admins and owners will see a **Create Invoice** button. Clicking it creates the pending invoice(s) from the session's recorded amounts. Sessions for monthly-billed or scholarship clients don't get per-session invoices — they are billed through the monthly batch instead.
```

- [ ] **Step 4: Type check (help articles are TS objects)**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/help/_data/help-articles.ts"
git commit -m "docs(help): draft submission billing, revision-loop invoice recreation, Create Invoice recovery"
```

---

### Task 8: E2E regression test — draft → submit creates the invoice

**Files:**
- Create: `tests/e2e/session-resubmit-invoice.spec.ts`

Follows the existing pattern in `tests/e2e/session-creation.spec.ts` (self-contained helpers per spec file, skip without `TEST_USER_PASSWORD`).

- [ ] **Step 1: Write the spec**

```typescript
import { test, expect, Page } from '@playwright/test'

// Test credentials - use environment variables in CI
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'weberlucasdev@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || ''

async function login(page: Page) {
  await page.goto('/login/')
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/(dashboard|sessions)/, { timeout: 15000 })
}

/**
 * Helper: Pick the first available individual service type (no headcount field).
 * Same approach as session-creation.spec.ts.
 */
async function selectIndividualServiceType(page: Page): Promise<string | null> {
  const trigger = page.locator('[data-tour="session-form-service-type"] button[role="combobox"]')
  await trigger.click()

  const options = page.getByRole('option')
  const count = await options.count()

  for (let i = 0; i < count; i++) {
    const optionText = await options.nth(i).textContent()
    await options.nth(i).click()

    const headcountField = page.locator('#groupHeadcount')
    const isGroup = await headcountField.isVisible().catch(() => false)
    if (!isGroup) {
      return optionText?.trim() || null
    }
    await trigger.click()
  }
  return null
}

async function selectFirstClient(page: Page) {
  const searchInput = page.getByPlaceholder('Search clients...')
  await searchInput.click()
  const firstClient = page.locator('[role="button"]').filter({ has: page.locator('.truncate') }).first()
  await firstClient.waitFor({ timeout: 5000 })
  await firstClient.click()
}

test.describe('P0 regression: draft submitted later still gets an invoice', () => {
  test.beforeEach(async () => {
    if (!TEST_PASSWORD) {
      test.skip()
    }
  })

  test('save as draft, then submit via edit — invoice is created', async ({ page }) => {
    await login(page)
    await page.goto('/sessions/new/')
    await page.waitForSelector('[data-tour="session-form-service-type"]', { timeout: 10000 })

    await page.fill('#time', '08:15')
    const serviceType = await selectIndividualServiceType(page)
    if (!serviceType) {
      test.skip()
      return
    }
    await selectFirstClient(page)
    await page.waitForTimeout(500)

    // Save as DRAFT
    await page.locator('input[name="status"][value="draft"]').check()
    await page.locator('[data-tour="session-form-submit"]').click()
    await expect(page.getByText('Session Logged!')).toBeVisible({ timeout: 15000 })

    // Open the newest draft from the sessions list (today's date sorts first)
    await page.goto('/sessions/')
    const draftRow = page.locator('a[href*="/sessions/"]').filter({ hasText: /draft/i }).first()
    await draftRow.waitFor({ timeout: 10000 })
    await draftRow.click()
    await page.waitForURL(/\/sessions\/[0-9a-f-]+\//, { timeout: 10000 })

    // Edit → switch to Submit for approval → save
    await page.getByRole('link', { name: /edit/i }).or(page.getByRole('button', { name: /edit/i })).first().click()
    await page.waitForSelector('[data-tour="session-form-service-type"]', { timeout: 10000 })
    await page.locator('input[name="status"][value="submitted"]').check()
    await page.locator('[data-tour="session-form-submit"]').click()

    // The fix's direct signal: the edit path reports invoice creation
    await expect(page.getByText(/session updated and invoice(s)? created/i)).toBeVisible({ timeout: 15000 })

    // Second signal: back on the detail page, no "Create Invoice" recovery button
    await page.waitForURL(/\/sessions\/[0-9a-f-]+\//, { timeout: 10000 })
    await expect(page.getByRole('button', { name: /create invoice/i })).not.toBeVisible()
  })
})
```

Note: if the test org's first client is scholarship/monthly-billed, the toast will read "Session updated successfully!" instead and the assertion fails — if that happens, the fix is to select a per-session-billed client in `selectFirstClient` (search for a known private-pay test client), not to weaken the assertion.

- [ ] **Step 2: Run it (requires TEST_USER_PASSWORD; skips cleanly otherwise)**

Run: `npm run test:e2e -- session-resubmit-invoice`
Expected: 1 passed (or "1 skipped" without the env var — then verify manually per Task 9 Step 2).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/session-resubmit-invoice.spec.ts
git commit -m "test(e2e): draft-then-submit creates invoice (P0 resubmit regression)"
```

---

### Task 9: Full verification + bug doc update

**Files:**
- Modify: `docs/bugs/2026-07-29-missing-invoice-on-resubmit.md` (status header + resolution section)

- [ ] **Step 1: Full local verification suite**

Run: `npm run lint && npx tsc --noEmit && npm run test -- --run && npm run build`
Expected: all pass. Do not claim completion without this output.

- [ ] **Step 2: Manual repro check (dev server)**

Using the repro from the bug doc against `npm run dev`:
1. Log a session for a per-session-billed client; choose **Save as draft** → no invoice (correct).
2. Reopen it, switch to **Submit for approval**, save → toast "Session updated and invoice created."; the invoices list now shows a pending invoice for it.
3. **Request Revision** on that session (invoice is deleted, session → draft), edit + resubmit → invoice re-created.
4. Delete the pending invoice from the invoices page, open the session detail page → **Create Invoice** button appears; click → invoice recreated (the delete-dialog promise at `invoice-actions.tsx:236` is now true — its copy needs no change).

- [ ] **Step 3: Update the bug doc**

In `docs/bugs/2026-07-29-missing-invoice-on-resubmit.md` change:

```markdown
**Status:** Open — confirmed in production
```

to:

```markdown
**Status:** Fixed in code (2026-07-29) — fix options A + C implemented (`ensureSessionInvoices` on edit-submit + approval backstop + manual "Create Invoice" recovery). Production backfill of session `2f95f41a` pending deploy.
```

and append at the end of the file:

```markdown
## Resolution (2026-07-29)

- `src/lib/invoices/ensure-session-invoices.ts` — shared idempotent invoice creation (ANY-status invoice or batch line item = already billed; fails safe on check errors).
- Callers: `createNewSession` (unchanged behavior), session-form edit branch (status !== draft), `approveSession`/`bulkApproveSessions` backstop, `createSessionInvoices` server action behind the session-detail **Create Invoice** button (admins, submitted/approved, no invoice).
- The delete-invoice dialog's "re-invoice them later" promise is now true via the Create Invoice button.
- Backfill: after deploy, open the stranded session's detail page and click **Create Invoice**; verify with the detection query (expect 0 rows).
```

- [ ] **Step 4: Commit**

```bash
git add docs/bugs/2026-07-29-missing-invoice-on-resubmit.md docs/superpowers/plans/2026-07-29-missing-invoice-on-resubmit-fix.md
git commit -m "docs(bugs): mark missing-invoice-on-resubmit fixed in code; add fix plan"
```

---

### Task 10: PR, deploy, production backfill

- [ ] **Step 1: Push and open the PR**

```bash
git push -u origin fix/missing-invoice-on-resubmit
gh pr create --title "Fix P0: sessions submitted from draft are never invoiced" --body "Implements docs/bugs/2026-07-29-missing-invoice-on-resubmit.md fix options A + C: shared idempotent ensureSessionInvoices called from the session-form edit branch, an ensure backstop in approveSession/bulkApproveSessions, and a manual Create Invoice recovery button on the session detail page. No DB migration. Backfill of the one stranded production session (\$90) happens via the new button after deploy."
```

Note: a red `build-and-deploy` PR check is the known preview-deploy quirk (see CLAUDE.md) — non-blocking; `test.yml` must be green.

- [ ] **Step 2: Merge + deploy (user approval), then backfill**

After merge to `main` deploys (Vercel), as an owner/admin on production:
1. Open `/sessions/2f95f41a-a76f-4638-b8f5-646f76f6c970/` (prod URL is in the `deployment-testing` memory).
2. Click **Create Invoice** → expect "Invoice created" and a $90 pending invoice for the group_home client.

- [ ] **Step 3: Verify with the detection query (read-only)**

Run the bug doc's detection query against prod via the Supabase Management API query endpoint (procedure in the `deployment-testing` memory).
Expected: **0 rows**.

- [ ] **Step 4: Post-ship bookkeeping**

- Update the bug doc status line to fully Fixed (backfill done, date).
- Update the `hardening-audit` memory: P0 #1 fixed + shipped (PR link, date).

---

## Not in scope (tracked elsewhere)

- **Six scholarship sessions ($360) waiting for batch invoices since February** — separate finding (scholarship cron gaps, `MCA-Hardening-Audit-2026-07-29.md` finding #8). Surfaced by the same detection query; do not "fix" them with Create Invoice (they are batch-billed by design — the ensure helper correctly refuses).
- Other open P0s from the hardening audit (lockout enforceability, `require_mfa` bypass, UTC paid dates).
- Fix option B (DB trigger) — rejected per bug doc: duplicates pricing/split logic in SQL, drift risk.
