# Contractor Tax Summaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cash-basis annual contractor earnings — per-contractor totals + CSV exports in Payroll Hub for the owner, and a downloadable annual summary PDF on the Earnings page for contractors.

**Architecture:** A pure lib module (`src/lib/payroll/annual-summary.ts`) owns all aggregation and CSV building; two thin API routes (CSV export, PDF render) and two client components (Payroll Hub tab, Earnings card) consume it. No schema changes — everything derives from the existing `contractor_paid_date`/`contractor_paid_amount` snapshots on `sessions`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase, zod, @react-pdf/renderer, shadcn/ui, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-28-contractor-tax-summaries-design.md`

**House rules that apply to every task:**
- Date-only strings are compared as strings — NEVER `new Date(paidDate)` (UTC off-by-one; see `src/lib/invoices/overdue.ts` for the established pattern).
- All route links/fetches use trailing slashes (`trailingSlash: true` in `next.config.ts`): `/api/payroll/tax-summary/?year=...`.
- No PHI anywhere in this feature: no client names, no session notes, in any CSV, PDF, or log.
- Commit messages: plain conventional commits, NO Co-Authored-By trailers.
- Run commands from the repo root `C:\Users\lwebe\Personal\MusicTherapy`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/payroll/annual-summary.ts` | Create | Pure aggregation: year filtering, amount fallback, month/service buckets, per-contractor totals, CSV builders |
| `src/lib/payroll/annual-summary.test.ts` | Create | Unit tests for the above |
| `src/lib/validation/schemas.ts` | Modify | Add `taxYearSchema` |
| `src/lib/validation/schemas.test.ts` | Modify | Tests for `taxYearSchema` |
| `src/app/api/payroll/tax-summary/route.ts` | Create | GET → summary/detail CSV (admin, `payments:view`) |
| `src/components/pdf/annual-earnings-pdf.tsx` | Create | React-PDF document (presentational only) |
| `src/app/api/payroll/annual-summary/pdf/route.ts` | Create | GET → PDF (contractor: own; admin: any in org) |
| `src/components/payroll/tax-summaries-card.tsx` | Create | Owner UI: year picker, totals table, CSV downloads |
| `src/app/(dashboard)/payments/page.tsx` | Modify | Add "Tax Summaries" tab |
| `src/components/earnings/annual-summary-card.tsx` | Create | Contractor UI: year picker, totals, PDF download |
| `src/app/(dashboard)/earnings/page.tsx` | Modify | Render the annual summary card |
| `src/app/(dashboard)/help/_data/help-articles.ts` | Modify | Document the feature in `payroll-and-payments` + `my-earnings` |

---

### Task 1: Annual summary lib module (TDD)

**Files:**
- Create: `src/lib/payroll/annual-summary.ts`
- Test: `src/lib/payroll/annual-summary.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/payroll/annual-summary.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  taxYearRange,
  isPaidInYear,
  paidAmountForSession,
  summarizeContractorYear,
  summarizeByContractor,
  availableTaxYears,
  buildSummaryCsv,
  buildDetailCsv,
  type PaidSessionInput,
  type ContractorPaidSessionInput,
} from './annual-summary'

const paid = (over: Partial<PaidSessionInput> = {}): PaidSessionInput => ({
  date: '2025-06-10',
  contractor_paid_date: '2025-06-15',
  contractor_paid_amount: 40,
  contractor_pay: 38,
  duration_minutes: 30,
  service_type_name: 'Music Therapy',
  ...over,
})

const cpaid = (
  id: string,
  name: string,
  over: Partial<PaidSessionInput> = {}
): ContractorPaidSessionInput => ({
  ...paid(over),
  contractor_id: id,
  contractor_name: name,
})

describe('taxYearRange / isPaidInYear (cash basis, string compare)', () => {
  it('spans Jan 1 through Dec 31', () => {
    expect(taxYearRange(2025)).toEqual({ start: '2025-01-01', end: '2025-12-31' })
  })

  it('includes both boundary dates and excludes neighbors', () => {
    expect(isPaidInYear('2025-01-01', 2025)).toBe(true)
    expect(isPaidInYear('2025-12-31', 2025)).toBe(true)
    expect(isPaidInYear('2024-12-31', 2025)).toBe(false)
    expect(isPaidInYear('2026-01-01', 2025)).toBe(false)
  })

  it('treats null as not paid', () => {
    expect(isPaidInYear(null, 2025)).toBe(false)
  })

  it('tolerates timestamp-shaped strings by comparing the date part only', () => {
    expect(isPaidInYear('2025-12-31T23:00:00', 2025)).toBe(true)
  })
})

describe('paidAmountForSession (snapshot → contractor_pay → 0 fallback)', () => {
  it('prefers the paid snapshot', () => {
    expect(paidAmountForSession(paid())).toBe(40)
  })

  it('falls back to contractor_pay for legacy rows without a snapshot', () => {
    expect(paidAmountForSession(paid({ contractor_paid_amount: null }))).toBe(38)
  })

  it('counts rows with neither amount as 0', () => {
    expect(
      paidAmountForSession(paid({ contractor_paid_amount: null, contractor_pay: null }))
    ).toBe(0)
  })

  it('does not treat a legitimate $0 snapshot as missing', () => {
    expect(paidAmountForSession(paid({ contractor_paid_amount: 0 }))).toBe(0)
  })
})

describe('summarizeContractorYear', () => {
  it('filters to the requested year and totals amounts', () => {
    const s = summarizeContractorYear(
      [paid(), paid({ contractor_paid_date: '2024-06-15' })],
      2025
    )
    expect(s.year).toBe(2025)
    expect(s.totalPaid).toBe(40)
    expect(s.sessionCount).toBe(1)
  })

  it('buckets by payment month (not session month), chronologically', () => {
    const s = summarizeContractorYear(
      [
        paid({ date: '2025-01-20', contractor_paid_date: '2025-02-01', contractor_paid_amount: 10 }),
        paid({ contractor_paid_date: '2025-02-14', contractor_paid_amount: 20 }),
        paid({ contractor_paid_date: '2025-11-30', contractor_paid_amount: 5 }),
      ],
      2025
    )
    expect(s.monthly).toEqual([
      { month: 2, label: 'February', amount: 30, sessions: 2 },
      { month: 11, label: 'November', amount: 5, sessions: 1 },
    ])
  })

  it('groups by service type, largest first, with a fallback bucket', () => {
    const s = summarizeContractorYear(
      [
        paid({ contractor_paid_amount: 10, service_type_name: 'Art Therapy' }),
        paid({ contractor_paid_amount: 50 }),
        paid({ contractor_paid_amount: 7, service_type_name: null }),
      ],
      2025
    )
    expect(s.byServiceType).toEqual([
      { name: 'Music Therapy', amount: 50, sessions: 1 },
      { name: 'Art Therapy', amount: 10, sessions: 1 },
      { name: 'Other', amount: 7, sessions: 1 },
    ])
  })

  it('returns an empty summary for a year with no data', () => {
    const s = summarizeContractorYear([], 2025)
    expect(s).toEqual({ year: 2025, totalPaid: 0, sessionCount: 0, monthly: [], byServiceType: [] })
  })
})

describe('summarizeByContractor', () => {
  it('totals per contractor, sorted by name', () => {
    const out = summarizeByContractor(
      [
        cpaid('c2', 'Zoe', { contractor_paid_amount: 30 }),
        cpaid('c1', 'Amy', { contractor_paid_amount: 10 }),
        cpaid('c1', 'Amy', { contractor_paid_amount: 15 }),
        cpaid('c1', 'Amy', { contractor_paid_date: '2024-01-01' }), // other year — excluded
      ],
      2025
    )
    expect(out).toEqual([
      { contractorId: 'c1', contractorName: 'Amy', sessionCount: 2, totalPaid: 25 },
      { contractorId: 'c2', contractorName: 'Zoe', sessionCount: 1, totalPaid: 30 },
    ])
  })
})

describe('availableTaxYears', () => {
  it('collects distinct years, descending, always including the current year', () => {
    expect(availableTaxYears(['2024-03-01', '2024-12-31', '2022-01-05', null], 2026)).toEqual([
      2026, 2024, 2022,
    ])
  })

  it('returns just the current year when there is no data', () => {
    expect(availableTaxYears([], 2026)).toEqual([2026])
  })
})

describe('CSV builders', () => {
  it('builds the summary CSV with quoted names and 2-decimal amounts', () => {
    const csv = buildSummaryCsv(
      [{ contractorId: 'c1', contractorName: 'Amy "AJ" Jones', sessionCount: 2, totalPaid: 25.5 }],
      2025
    )
    expect(csv.split('\n')).toEqual([
      'Contractor,Sessions Paid,Total Paid,Tax Year',
      '"Amy ""AJ"" Jones",2,25.50,2025',
    ])
  })

  it('builds the detail CSV with one row per paid session in the year', () => {
    const csv = buildDetailCsv(
      [
        cpaid('c1', 'Amy', { contractor_paid_date: '2025-06-15' }),
        cpaid('c1', 'Amy', { contractor_paid_date: '2024-06-15' }), // excluded
      ],
      2025
    )
    expect(csv.split('\n')).toEqual([
      'Contractor,Paid Date,Session Date,Service Type,Duration (min),Amount',
      '"Amy",2025-06-15,2025-06-10,"Music Therapy",30,40.00',
    ])
  })

  it('detail CSV sorts by contractor name then paid date', () => {
    const csv = buildDetailCsv(
      [
        cpaid('c2', 'Zoe', { contractor_paid_date: '2025-01-05' }),
        cpaid('c1', 'Amy', { contractor_paid_date: '2025-03-01' }),
        cpaid('c1', 'Amy', { contractor_paid_date: '2025-01-10' }),
      ],
      2025
    )
    const names = csv.split('\n').slice(1).map((r) => r.split(',')[0] + ' ' + r.split(',')[1])
    expect(names).toEqual(['"Amy" 2025-01-10', '"Amy" 2025-03-01', '"Zoe" 2025-01-05'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/lib/payroll/annual-summary.test.ts`
Expected: FAIL — `Cannot find module './annual-summary'` (or equivalent resolve error).

- [ ] **Step 3: Write the implementation**

Create `src/lib/payroll/annual-summary.ts`:

```typescript
/**
 * Cash-basis annual contractor earnings ("tax summaries").
 *
 * A session counts toward tax year Y iff its `contractor_paid_date` falls within
 * Y-01-01..Y-12-31, compared as date-only STRINGS — never parsed through Date/UTC
 * (same discipline as `isInvoiceOverdue()` in src/lib/invoices/overdue.ts).
 * Amounts prefer the `contractor_paid_amount` snapshot written by
 * `mark_sessions_paid`, falling back to `contractor_pay` for legacy rows paid
 * before snapshotting existed; rows with neither count as $0.
 *
 * Outputs (CSVs, summaries) intentionally contain no client names and no notes —
 * a tax summary needs dates, service, duration, and amounts only (zero PHI).
 */

export interface PaidSessionInput {
  /** Session date (YYYY-MM-DD) — shown in the detail CSV only */
  date?: string | null
  contractor_paid_date: string | null
  contractor_paid_amount: number | null
  contractor_pay: number | null
  duration_minutes?: number | null
  service_type_name?: string | null
}

export interface ContractorPaidSessionInput extends PaidSessionInput {
  contractor_id: string
  contractor_name: string
}

export interface MonthBucket {
  month: number
  label: string
  amount: number
  sessions: number
}

export interface ServiceTypeBucket {
  name: string
  amount: number
  sessions: number
}

export interface AnnualSummary {
  year: number
  totalPaid: number
  sessionCount: number
  /** Only months with activity, chronological */
  monthly: MonthBucket[]
  /** Descending by amount */
  byServiceType: ServiceTypeBucket[]
}

export interface ContractorYearTotal {
  contractorId: string
  contractorName: string
  sessionCount: number
  totalPaid: number
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function taxYearRange(year: number): { start: string; end: string } {
  return { start: `${year}-01-01`, end: `${year}-12-31` }
}

export function isPaidInYear(paidDate: string | null, year: number): boolean {
  if (!paidDate) return false
  const { start, end } = taxYearRange(year)
  const dateOnly = paidDate.slice(0, 10)
  return dateOnly >= start && dateOnly <= end
}

export function paidAmountForSession(session: PaidSessionInput): number {
  return Number(session.contractor_paid_amount ?? session.contractor_pay ?? 0)
}

export function summarizeContractorYear(
  sessions: PaidSessionInput[],
  year: number
): AnnualSummary {
  const inYear = sessions.filter((s) => isPaidInYear(s.contractor_paid_date, year))
  const months = new Map<number, { amount: number; sessions: number }>()
  const services = new Map<string, { amount: number; sessions: number }>()
  let totalPaid = 0

  for (const session of inYear) {
    const amount = paidAmountForSession(session)
    totalPaid += amount

    const month = Number(session.contractor_paid_date!.slice(5, 7))
    const monthEntry = months.get(month) ?? { amount: 0, sessions: 0 }
    months.set(month, { amount: monthEntry.amount + amount, sessions: monthEntry.sessions + 1 })

    const serviceName = session.service_type_name || 'Other'
    const serviceEntry = services.get(serviceName) ?? { amount: 0, sessions: 0 }
    services.set(serviceName, {
      amount: serviceEntry.amount + amount,
      sessions: serviceEntry.sessions + 1,
    })
  }

  return {
    year,
    totalPaid,
    sessionCount: inYear.length,
    monthly: [...months.entries()]
      .sort(([a], [b]) => a - b)
      .map(([month, v]) => ({ month, label: MONTH_LABELS[month - 1], ...v })),
    byServiceType: [...services.entries()]
      .sort(([, a], [, b]) => b.amount - a.amount)
      .map(([name, v]) => ({ name, ...v })),
  }
}

export function summarizeByContractor(
  sessions: ContractorPaidSessionInput[],
  year: number
): ContractorYearTotal[] {
  const byId = new Map<string, ContractorYearTotal>()
  for (const session of sessions) {
    if (!isPaidInYear(session.contractor_paid_date, year)) continue
    const entry = byId.get(session.contractor_id) ?? {
      contractorId: session.contractor_id,
      contractorName: session.contractor_name,
      sessionCount: 0,
      totalPaid: 0,
    }
    entry.sessionCount += 1
    entry.totalPaid += paidAmountForSession(session)
    byId.set(session.contractor_id, entry)
  }
  return [...byId.values()].sort((a, b) => a.contractorName.localeCompare(b.contractorName))
}

export function availableTaxYears(
  paidDates: (string | null)[],
  currentYear: number
): number[] {
  const years = new Set<number>([currentYear])
  for (const paidDate of paidDates) {
    if (!paidDate) continue
    const year = Number(paidDate.slice(0, 4))
    if (Number.isFinite(year) && year > 1900) years.add(year)
  }
  return [...years].sort((a, b) => b - a)
}

/** Quote a CSV cell (internal quotes doubled). */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function buildSummaryCsv(totals: ContractorYearTotal[], year: number): string {
  return [
    ['Contractor', 'Sessions Paid', 'Total Paid', 'Tax Year'].join(','),
    ...totals.map((t) =>
      [csvCell(t.contractorName), t.sessionCount, t.totalPaid.toFixed(2), year].join(',')
    ),
  ].join('\n')
}

export function buildDetailCsv(
  sessions: ContractorPaidSessionInput[],
  year: number
): string {
  const inYear = sessions
    .filter((s) => isPaidInYear(s.contractor_paid_date, year))
    .sort(
      (a, b) =>
        a.contractor_name.localeCompare(b.contractor_name) ||
        (a.contractor_paid_date ?? '').localeCompare(b.contractor_paid_date ?? '')
    )
  return [
    ['Contractor', 'Paid Date', 'Session Date', 'Service Type', 'Duration (min)', 'Amount'].join(','),
    ...inYear.map((s) =>
      [
        csvCell(s.contractor_name),
        s.contractor_paid_date ?? '',
        s.date ?? '',
        csvCell(s.service_type_name || ''),
        s.duration_minutes ?? '',
        paidAmountForSession(s).toFixed(2),
      ].join(',')
    ),
  ].join('\n')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/lib/payroll/annual-summary.test.ts`
Expected: PASS (all tests green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/payroll/annual-summary.ts src/lib/payroll/annual-summary.test.ts
git commit -m "feat(payroll): cash-basis annual summary lib (tax summaries)"
```

---

### Task 2: `taxYearSchema` validation (TDD)

**Files:**
- Modify: `src/lib/validation/schemas.ts` (append after `sessionRequestSchema`, before `parseBearer`)
- Test: `src/lib/validation/schemas.test.ts` (append a new `describe` block at the end)

- [ ] **Step 1: Write the failing test**

Append to `src/lib/validation/schemas.test.ts` (keep existing imports; add `taxYearSchema` to the existing `import { ... } from './schemas'` line):

```typescript
describe('taxYearSchema', () => {
  it('coerces a query-string year', () => {
    expect(taxYearSchema.parse('2025')).toBe(2025)
  })

  it('rejects out-of-range and junk values', () => {
    expect(taxYearSchema.safeParse('1999').success).toBe(false)
    expect(taxYearSchema.safeParse('2101').success).toBe(false)
    expect(taxYearSchema.safeParse('abc').success).toBe(false)
    expect(taxYearSchema.safeParse(null).success).toBe(false)
    expect(taxYearSchema.safeParse('2025.5').success).toBe(false)
  })
})
```

Note: `safeParse(null)` must fail — `z.coerce.number()` would turn `null` into `0`, which the `.min(2000)` bound rejects. That's the behavior the route relies on for a missing `year` param.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/lib/validation/schemas.test.ts`
Expected: FAIL — `taxYearSchema` is not exported.

- [ ] **Step 3: Write the implementation**

Append to `src/lib/validation/schemas.ts` after `sessionRequestSchema`:

```typescript
/** Tax year for payroll annual summaries (coerced from a query-string value) */
export const taxYearSchema = z.coerce.number().int().min(2000).max(2100)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/lib/validation/schemas.test.ts`
Expected: PASS (existing tests still green, new block green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation/schemas.ts src/lib/validation/schemas.test.ts
git commit -m "feat(validation): taxYearSchema for payroll summary routes"
```

---

### Task 3: CSV export route

**Files:**
- Create: `src/app/api/payroll/tax-summary/route.ts`

Follows the auth/permission pattern of `src/app/api/sessions/export/route.ts`. Requires `payments:view`. Org-scoped explicitly. Selects no notes and no client joins.

- [ ] **Step 1: Write the route**

Create `src/app/api/payroll/tax-summary/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { can } from '@/lib/auth/permissions'
import { taxYearSchema } from '@/lib/validation/schemas'
import {
  taxYearRange,
  summarizeByContractor,
  buildSummaryCsv,
  buildDetailCsv,
  type ContractorPaidSessionInput,
} from '@/lib/payroll/annual-summary'
import type { UserRole } from '@/types/database'

interface NameJoin {
  name: string
}

interface ContractorJoin {
  id: string
  name: string
}

interface PaidSessionRow {
  date: string
  duration_minutes: number
  contractor_paid_date: string | null
  contractor_paid_amount: number | null
  contractor_pay: number | null
  contractor: ContractorJoin | ContractorJoin[] | null
  service_type: NameJoin | NameJoin[] | null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single<{ role: string; organization_id: string }>()

    if (!userProfile || !can(userProfile.role as UserRole, 'payments:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const yearParse = taxYearSchema.safeParse(request.nextUrl.searchParams.get('year'))
    if (!yearParse.success) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }
    const year = yearParse.data
    const detail = request.nextUrl.searchParams.get('detail') === '1'

    // gte on contractor_paid_date also excludes null (never-paid) rows.
    const { start, end } = taxYearRange(year)
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        date,
        duration_minutes,
        contractor_paid_date,
        contractor_paid_amount,
        contractor_pay,
        contractor:users(id, name),
        service_type:service_types(name)
      `)
      .eq('organization_id', userProfile.organization_id)
      .gte('contractor_paid_date', start)
      .lte('contractor_paid_date', end)
      .order('contractor_paid_date', { ascending: true })

    if (error) {
      console.error('[MCA] Tax summary export failed')
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    const inputs: ContractorPaidSessionInput[] = ((sessions as unknown as PaidSessionRow[]) || [])
      .map((session) => {
        const contractor = Array.isArray(session.contractor)
          ? session.contractor[0]
          : session.contractor
        const serviceType = Array.isArray(session.service_type)
          ? session.service_type[0]
          : session.service_type
        return {
          date: session.date,
          duration_minutes: session.duration_minutes,
          contractor_paid_date: session.contractor_paid_date,
          contractor_paid_amount: session.contractor_paid_amount,
          contractor_pay: session.contractor_pay,
          contractor_id: contractor?.id ?? '',
          contractor_name: contractor?.name ?? 'Unknown',
          service_type_name: serviceType?.name ?? null,
        }
      })
      .filter((session) => session.contractor_id)

    const csv = detail
      ? buildDetailCsv(inputs, year)
      : buildSummaryCsv(summarizeByContractor(inputs, year), year)

    const filename = detail
      ? `contractor-payments-detail-${year}.csv`
      : `contractor-tax-summary-${year}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    console.error('[MCA] Tax summary export failed')
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/payroll/tax-summary/route.ts
git commit -m "feat(payroll): tax summary CSV export route"
```

---

### Task 4: Annual earnings PDF component

**Files:**
- Create: `src/components/pdf/annual-earnings-pdf.tsx`

Presentational only — all math happens in the lib/route. Styling mirrors `src/components/pdf/invoice-pdf.tsx`. Deliberately plain: it must NOT resemble an IRS form, and the disclaimer is prominent.

- [ ] **Step 1: Write the component**

Create `src/components/pdf/annual-earnings-pdf.tsx`:

```tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/pricing'
import type { AnnualSummary } from '@/lib/payroll/annual-summary'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  orgName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    maxWidth: 220,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right' as const,
  },
  docSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right' as const,
  },
  disclaimer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    fontSize: 9,
    color: '#374151',
  },
  totalsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  totalBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 12,
  },
  totalBoxFirst: {
    marginRight: 16,
  },
  totalLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  colName: { width: '50%' },
  colSessions: { width: '20%', textAlign: 'center' as const },
  colAmount: { width: '30%', textAlign: 'right' as const },
  totalLine: {
    flexDirection: 'row',
    padding: 8,
  },
  totalLineName: { width: '50%', fontWeight: 'bold' },
  totalLineSessions: { width: '20%', textAlign: 'center' as const, fontWeight: 'bold' },
  totalLineAmount: {
    width: '30%',
    textAlign: 'right' as const,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center' as const,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
})

export interface AnnualEarningsPDFProps {
  organizationName: string
  contractorName: string
  summary: AnnualSummary
  /** Pre-formatted display date, e.g. "July 28, 2026" */
  generatedOn: string
}

export function AnnualEarningsPDF({
  organizationName,
  contractorName,
  summary,
  generatedOn,
}: AnnualEarningsPDFProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>{organizationName}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Annual Earnings Summary</Text>
            <Text style={styles.docSubtitle}>
              {contractorName} — Tax Year {summary.year}
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Informal earnings summary — not an official tax document (not a 1099). Reflects
          contractor payments recorded in this system during calendar year {summary.year},
          on a cash basis (grouped by payment date, not session date).
        </Text>

        <View style={styles.totalsRow}>
          <View style={[styles.totalBox, styles.totalBoxFirst]}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>{formatCurrency(summary.totalPaid)}</Text>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Sessions Paid</Text>
            <Text style={styles.totalValue}>{summary.sessionCount}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>By Month</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colName, styles.tableHeaderText]}>Month</Text>
            <Text style={[styles.colSessions, styles.tableHeaderText]}>Sessions</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText]}>Amount</Text>
          </View>
          {summary.monthly.map((month) => (
            <View key={month.month} style={styles.tableRow}>
              <Text style={styles.colName}>{month.label}</Text>
              <Text style={styles.colSessions}>{month.sessions}</Text>
              <Text style={styles.colAmount}>{formatCurrency(month.amount)}</Text>
            </View>
          ))}
          <View style={styles.totalLine}>
            <Text style={styles.totalLineName}>Total</Text>
            <Text style={styles.totalLineSessions}>{summary.sessionCount}</Text>
            <Text style={styles.totalLineAmount}>{formatCurrency(summary.totalPaid)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>By Service Type</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colName, styles.tableHeaderText]}>Service</Text>
            <Text style={[styles.colSessions, styles.tableHeaderText]}>Sessions</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText]}>Amount</Text>
          </View>
          {summary.byServiceType.map((service) => (
            <View key={service.name} style={styles.tableRow}>
              <Text style={styles.colName}>{service.name}</Text>
              <Text style={styles.colSessions}>{service.sessions}</Text>
              <Text style={styles.colAmount}>{formatCurrency(service.amount)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated on {generatedOn} • {organizationName} • Not an official tax document
        </Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pdf/annual-earnings-pdf.tsx
git commit -m "feat(payroll): annual earnings summary PDF template"
```

---

### Task 5: PDF route

**Files:**
- Create: `src/app/api/payroll/annual-summary/pdf/route.ts`

Auth model (from the spec): contractor → always their own data, `contractorId` param ignored; admin/owner with `payments:view` → any contractor in their org (`contractorId` required); developer → any org. Cross-org lookups by non-developers return 404 (no existence leak). Mirrors the render pattern of `src/app/api/invoices/[id]/pdf/route.ts`.

- [ ] **Step 1: Write the route**

Create `src/app/api/payroll/annual-summary/pdf/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { createElement, ReactElement } from 'react'
import { format } from 'date-fns'
import { can } from '@/lib/auth/permissions'
import { taxYearSchema, uuidSchema } from '@/lib/validation/schemas'
import {
  taxYearRange,
  summarizeContractorYear,
  type PaidSessionInput,
} from '@/lib/payroll/annual-summary'
import { AnnualEarningsPDF } from '@/components/pdf/annual-earnings-pdf'
import type { UserRole } from '@/types/database'

interface NameJoin {
  name: string
}

interface PaidSessionRow {
  contractor_paid_date: string | null
  contractor_paid_amount: number | null
  contractor_pay: number | null
  service_type: NameJoin | NameJoin[] | null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single<{ role: string; organization_id: string }>()

    if (!userProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const role = userProfile.role as UserRole

    const yearParse = taxYearSchema.safeParse(request.nextUrl.searchParams.get('year'))
    if (!yearParse.success) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }
    const year = yearParse.data

    // Contractors always get their own summary — the param is deliberately
    // ignored for them (never a 403, no ID probing). Admins must name a target.
    let targetContractorId: string
    if (role === 'contractor') {
      targetContractorId = user.id
    } else if (can(role, 'payments:view')) {
      const param = request.nextUrl.searchParams.get('contractorId')
      if (!param || !uuidSchema.safeParse(param).success) {
        return NextResponse.json({ error: 'contractorId is required' }, { status: 400 })
      }
      targetContractorId = param
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: contractor } = await supabase
      .from('users')
      .select('id, name, organization_id')
      .eq('id', targetContractorId)
      .single<{ id: string; name: string | null; organization_id: string }>()

    if (!contractor) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    // Cross-org access is developer-only; others see 404, not 403 (no existence leak).
    if (role !== 'developer' && contractor.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', contractor.organization_id)
      .single<{ name: string }>()

    const { start, end } = taxYearRange(year)
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        contractor_paid_date,
        contractor_paid_amount,
        contractor_pay,
        service_type:service_types(name)
      `)
      .eq('contractor_id', contractor.id)
      .eq('organization_id', contractor.organization_id)
      .gte('contractor_paid_date', start)
      .lte('contractor_paid_date', end)

    if (error) {
      console.error('[MCA] Annual summary PDF query failed')
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    const inputs: PaidSessionInput[] = ((sessions as unknown as PaidSessionRow[]) || []).map(
      (session) => {
        const serviceType = Array.isArray(session.service_type)
          ? session.service_type[0]
          : session.service_type
        return {
          contractor_paid_date: session.contractor_paid_date,
          contractor_paid_amount: session.contractor_paid_amount,
          contractor_pay: session.contractor_pay,
          service_type_name: serviceType?.name ?? null,
        }
      }
    )

    // A zero-activity year still renders — a "$0 paid" record is legitimate.
    const summary = summarizeContractorYear(inputs, year)
    const contractorName = contractor.name || 'Contractor'

    const pdfBuffer = await renderToBuffer(
      createElement(AnnualEarningsPDF, {
        organizationName: organization?.name || 'Organization',
        contractorName,
        summary,
        generatedOn: format(new Date(), 'MMMM d, yyyy'),
      }) as ReactElement<DocumentProps>
    )

    const nameSlug =
      contractorName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'contractor'
    const inline = request.nextUrl.searchParams.get('inline') === '1'

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="earnings-summary-${year}-${nameSlug}.pdf"`,
      },
    })
  } catch {
    console.error('[MCA] Annual summary PDF generation failed')
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/payroll/annual-summary/pdf/route.ts
git commit -m "feat(payroll): annual earnings summary PDF route"
```

---

### Task 6: Payroll Hub "Tax Summaries" tab

**Files:**
- Create: `src/components/payroll/tax-summaries-card.tsx`
- Modify: `src/app/(dashboard)/payments/page.tsx`

The payments page fetches org data client-side under RLS with no explicit org filter (existing pattern on that page) — the new component does the same. Downloads go through the API route (fetch → blob, same pattern as `src/components/sessions/export-dialog.tsx:111`).

- [ ] **Step 1: Write the card component**

Create `src/components/payroll/tax-summaries-card.tsx`:

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/pricing'
import {
  availableTaxYears,
  summarizeByContractor,
  type ContractorPaidSessionInput,
} from '@/lib/payroll/annual-summary'

interface ContractorJoin {
  id: string
  name: string
}

interface NameJoin {
  name: string
}

interface PaidSessionRow {
  date: string
  duration_minutes: number
  contractor_paid_date: string | null
  contractor_paid_amount: number | null
  contractor_pay: number | null
  contractor: ContractorJoin | ContractorJoin[] | null
  service_type: NameJoin | NameJoin[] | null
}

export function TaxSummariesCard() {
  const [rows, setRows] = useState<ContractorPaidSessionInput[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [downloading, setDownloading] = useState<'summary' | 'detail' | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          date,
          duration_minutes,
          contractor_paid_date,
          contractor_paid_amount,
          contractor_pay,
          contractor:users(id, name),
          service_type:service_types(name)
        `)
        .not('contractor_paid_date', 'is', null)
        .order('contractor_paid_date', { ascending: false })

      if (error) {
        toast.error('Failed to load tax summaries')
        setLoading(false)
        return
      }

      const mapped = ((data as unknown as PaidSessionRow[]) || [])
        .map((session) => {
          const contractor = Array.isArray(session.contractor)
            ? session.contractor[0]
            : session.contractor
          const serviceType = Array.isArray(session.service_type)
            ? session.service_type[0]
            : session.service_type
          return {
            date: session.date,
            duration_minutes: session.duration_minutes,
            contractor_paid_date: session.contractor_paid_date,
            contractor_paid_amount: session.contractor_paid_amount,
            contractor_pay: session.contractor_pay,
            contractor_id: contractor?.id ?? '',
            contractor_name: contractor?.name ?? 'Unknown',
            service_type_name: serviceType?.name ?? null,
          }
        })
        .filter((session) => session.contractor_id)

      setRows(mapped)
      setLoading(false)
    }
    void load()
  }, [])

  const years = useMemo(
    () =>
      availableTaxYears(
        rows.map((row) => row.contractor_paid_date),
        new Date().getFullYear()
      ),
    [rows]
  )
  const totals = useMemo(() => summarizeByContractor(rows, year), [rows, year])
  const grandTotal = totals.reduce((sum, t) => sum + t.totalPaid, 0)
  const grandSessions = totals.reduce((sum, t) => sum + t.sessionCount, 0)

  const download = async (kind: 'summary' | 'detail') => {
    setDownloading(kind)
    try {
      const detailParam = kind === 'detail' ? '&detail=1' : ''
      const response = await fetch(`/api/payroll/tax-summary/?year=${year}${detailParam}`)
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download =
        kind === 'detail'
          ? `contractor-payments-detail-${year}.csv`
          : `contractor-tax-summary-${year}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download CSV')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Tax Summaries</CardTitle>
            <CardDescription>
              Cash-basis totals per contractor (grouped by payment date) for 1099 preparation
            </CardDescription>
          </div>
          <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
            <SelectTrigger className="w-[120px]" aria-label="Tax year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : totals.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No contractor payments recorded in {year}.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contractor</TableHead>
                  <TableHead className="text-center">Sessions Paid</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totals.map((total) => (
                  <TableRow key={total.contractorId}>
                    <TableCell className="font-medium">{total.contractorName}</TableCell>
                    <TableCell className="text-center">{total.sessionCount}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(total.totalPaid)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="text-center">{grandSessions}</TableCell>
                  <TableCell className="text-right">{formatCurrency(grandTotal)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            <div className="flex flex-col gap-2 sm:flex-row mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => download('summary')}
                disabled={downloading !== null}
              >
                {downloading === 'summary' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Summary CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => download('detail')}
                disabled={downloading !== null}
              >
                {downloading === 'detail' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Detail CSV
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Wire the tab into the payments page**

Modify `src/app/(dashboard)/payments/page.tsx`:

(a) Extend the lucide import (line 10) — add `FileText`:

```typescript
import { DollarSign, Users, Calendar, Loader2, AlertCircle, Receipt, Filter, FileText } from 'lucide-react'
```

(b) Add the component import after the `PaymentReconciliationTable` import (line 16):

```typescript
import { TaxSummariesCard } from '@/components/payroll/tax-summaries-card'
```

(c) Add a fourth trigger inside `<TabsList>` after the `reconciliation` trigger (after line 341):

```tsx
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Tax Summaries
          </TabsTrigger>
```

(d) Add the tab content after the `reconciliation` `TabsContent` block (after line 443):

```tsx
        <TabsContent value="tax" className="mt-4">
          <TaxSummariesCard />
        </TabsContent>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/payroll/tax-summaries-card.tsx "src/app/(dashboard)/payments/page.tsx"
git commit -m "feat(payroll): Tax Summaries tab with CSV downloads"
```

---

### Task 7: Contractor "Annual Summary" card on Earnings

**Files:**
- Create: `src/components/earnings/annual-summary-card.tsx`
- Modify: `src/app/(dashboard)/earnings/page.tsx`

Uses the page's effective contractor ID so owner "View As" works. The PDF fetch passes `contractorId` — the route ignores it for real contractors and honors it for admins impersonating via View As.

- [ ] **Step 1: Write the card component**

Create `src/components/earnings/annual-summary-card.tsx`:

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/pricing'
import {
  availableTaxYears,
  summarizeContractorYear,
  type PaidSessionInput,
} from '@/lib/payroll/annual-summary'

interface NameJoin {
  name: string
}

interface PaidSessionRow {
  contractor_paid_date: string | null
  contractor_paid_amount: number | null
  contractor_pay: number | null
  service_type: NameJoin | NameJoin[] | null
}

interface AnnualSummaryCardProps {
  contractorId: string
  organizationId: string
}

export function AnnualSummaryCard({ contractorId, organizationId }: AnnualSummaryCardProps) {
  const [rows, setRows] = useState<PaidSessionInput[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          contractor_paid_date,
          contractor_paid_amount,
          contractor_pay,
          service_type:service_types(name)
        `)
        .eq('contractor_id', contractorId)
        .eq('organization_id', organizationId)
        .not('contractor_paid_date', 'is', null)

      if (error) {
        setLoading(false)
        return
      }

      const mapped = ((data as unknown as PaidSessionRow[]) || []).map((session) => {
        const serviceType = Array.isArray(session.service_type)
          ? session.service_type[0]
          : session.service_type
        return {
          contractor_paid_date: session.contractor_paid_date,
          contractor_paid_amount: session.contractor_paid_amount,
          contractor_pay: session.contractor_pay,
          service_type_name: serviceType?.name ?? null,
        }
      })
      setRows(mapped)
      setLoading(false)
    }
    void load()
  }, [contractorId, organizationId])

  const years = useMemo(
    () =>
      availableTaxYears(
        rows.map((row) => row.contractor_paid_date),
        new Date().getFullYear()
      ),
    [rows]
  )
  const summary = useMemo(() => summarizeContractorYear(rows, year), [rows, year])

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      const response = await fetch(
        `/api/payroll/annual-summary/pdf/?year=${year}&contractorId=${contractorId}`
      )
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `earnings-summary-${year}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Annual Summary</CardTitle>
            <CardDescription>
              Payments received per calendar year, for your tax records
            </CardDescription>
          </div>
          <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
            <SelectTrigger className="w-[120px]" aria-label="Tax year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid in {year}</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions Paid</p>
                <p className="text-2xl font-bold">{summary.sessionCount}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadPdf} disabled={downloading}>
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
            <p className="text-xs text-muted-foreground">
              Informal summary of payments recorded in this system — not an official tax
              document (not a 1099).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Wire the card into the earnings page**

Modify `src/app/(dashboard)/earnings/page.tsx`:

(a) Add the import after the `EarningsChart` import (line 14):

```typescript
import { AnnualSummaryCard } from '@/components/earnings/annual-summary-card'
```

(b) At the bottom of the page JSX, immediately after the closing `</Card>` of the "Monthly Breakdown" card (line 320) and before the closing `</div>` of the page, add:

```tsx
      {/* Annual Summary (tax) */}
      {contractorId && organization && (
        <AnnualSummaryCard contractorId={contractorId} organizationId={organization.id} />
      )}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/earnings/annual-summary-card.tsx "src/app/(dashboard)/earnings/page.tsx"
git commit -m "feat(earnings): annual summary card with PDF download"
```

---

### Task 8: Help articles

**Files:**
- Modify: `src/app/(dashboard)/help/_data/help-articles.ts`

Two articles to update. Find each by its `slug` (`'payroll-and-payments'` ~line 880, `'my-earnings'` ~line 1046) and append the new section at the END of that article's `content` template literal (before its closing backtick).

- [ ] **Step 1: Append to the `payroll-and-payments` article content**

```markdown

## Tax Summaries

The **Tax Summaries** tab shows cash-basis annual totals per contractor — everything paid out during a calendar year, grouped by the date the payment was recorded (not the session date). This matches how 1099-NEC amounts are reported.

- Pick a tax year from the dropdown to see each contractor's paid session count and total.
- **Summary CSV** downloads one row per contractor — hand this to your bookkeeper for 1099 preparation.
- **Detail CSV** downloads one row per paid session (paid date, session date, service type, duration, amount) for your records.
- Contractors can download their own annual summary PDF from **My Earnings** — you don't need to send them anything manually.

These exports are informal records to support tax preparation — they are not official tax documents.
```

- [ ] **Step 2: Append to the `my-earnings` article content**

```markdown

## Annual Summary

The **Annual Summary** card shows your total payments received per calendar year — useful at tax time. Pick a year and download a PDF summary of what you were paid, broken down by month and service type.

The summary is cash-basis: a session counts toward the year its payment was recorded, not the year the session happened. It's an informal record, not an official tax document (not a 1099) — your 1099, if applicable, comes from the practice owner.
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (template literals still balanced).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/help/_data/help-articles.ts"
git commit -m "docs(help): document tax summaries and annual earnings PDF"
```

---

### Task 9: Full verification

- [ ] **Step 1: Full unit test suite**

Run: `npm run test -- --run`
Expected: all tests pass (including the two new test files).

- [ ] **Step 2: Type check + lint + build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all clean. The build must show the two new routes: `/api/payroll/tax-summary` and `/api/payroll/annual-summary/pdf`.

- [ ] **Step 3: Manual smoke (dev server)**

1. `npm run dev` (kill any stale process holding port 3000 first).
2. Log in as owner/admin → `/payments/` → "Tax Summaries" tab: year picker works, table shows per-contractor totals, both CSVs download and open with the expected headers.
3. `curl -i "http://localhost:3000/api/payroll/tax-summary/?year=abc"` while unauthenticated → expect 401; with a bad year while authenticated → 400.
4. Use View As (a contractor) → `/earnings/` → Annual Summary card renders; "Download PDF" produces a PDF with the disclaimer, monthly table, and service-type table.

CAUTION: `.env.local` points at the **production** Supabase — read-only checks only; do not mark anything paid to generate test data.

- [ ] **Step 4: Final commit (if any fixups)**

```bash
git status
git add <fixed files>
git commit -m "fix(payroll): tax summary review fixups"
```

---

## Self-Review Notes (already applied)

- **Spec coverage:** every spec section maps to a task — lib (T1), zod (T2), CSV route (T3), PDF component (T4), PDF route (T5), owner UI (T6), contractor UI (T7), help docs (T8), verification (T9). Spec's "contractor param ignored / cross-org 404" rules are implemented in T5.
- **Premises verified against code:** `sessions` columns (`database.ts:440-450`), `contractor:users(...)`/`service_type:service_types(name)` join shapes (payments page), `payments:view` gate (payments page line 105), trailing-slash fetch pattern (`export-dialog.tsx:111`), `renderToBuffer` pattern (invoice PDF route), `TableFooter` exists in `ui/table.tsx`, help slugs at lines 880/1046, `schemas.test.ts` exists.
- **Type consistency:** `PaidSessionInput`/`ContractorPaidSessionInput`/`AnnualSummary` defined once in T1 and imported everywhere else; both routes and both cards normalize Supabase join arrays the same way.
