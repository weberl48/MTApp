# Dev Portal Tests Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Tests card to the local dev portal that runs four suites on demand, including a new smoke suite that asserts real artifacts (a PDF that renders, CSVs with rows, vendors that accept a real call) instead of config presence.

**Architecture:** The portal spawns runners via `execFile` and tracks run state in memory, persisting the last result per suite to `data/tests.json`. `POST /api/tests/run` returns a `runId` immediately; `app.js` polls `GET /api/tests` every second while anything is active. The smoke suite calls a new dev-only `/api/dev/smoke/` route in the Next app, which runs checks in-process against real dev data plus two direct vendor probes.

**Tech Stack:** Node 20+ (portal, zero dependencies), Next.js 16 App Router (the dev-only route), Vitest + jsdom (unit tests), Playwright (e2e).

**Design spec:** `docs/superpowers/specs/2026-07-30-dev-portal-tests-design.md` — read it before starting. It records why each decision was made and which roads were deliberately not taken.

## Global Constraints

- **The portal has zero dependencies.** Node 20+ builtins only, ES modules (`.mjs`). Do not add a package to run anything under `tools/dev-portal/`.
- **Nothing in this plan may be reachable in production.** The new Next route returns `404` when `process.env.NODE_ENV === 'production'`, matching `src/app/api/dev/errors/route.ts`.
- **`error` is a distinct status from `fail`.** `fail` = a test failed (app broken). `error` = tooling broke (runner missing, unparseable output, timeout, killed). Never collapse them.
- **Playwright always runs `--workers=1`.** The suite is only reliably green serially; parallel is flaky from shared dev-org data.
- **Never let a secret reach portal output.** Scrub `re_[A-Za-z0-9_-]+` and `sk-ant-[A-Za-z0-9_-]+` from any captured stderr before it is stored or displayed.
- **Colocated tests.** Every new module under `src/lib/` gets a `*.test.ts` next to it — repo convention.
- **Commit after every task.** Do not batch.

---

### Task 1: Extract the sessions-export CSV builder

`/api/sessions/export/route.ts` builds its CSV inline. The smoke check must exercise the same builder the route uses — if the check re-implements it, the check can pass while the real export is broken.

**Files:**
- Create: `src/lib/sessions/export-csv.ts`
- Create: `src/lib/sessions/export-csv.test.ts`
- Modify: `src/app/api/sessions/export/route.ts` (replace the inline `csvCell` + `headers` + `csvRows` block, roughly lines 190–232)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export interface SessionExportRow { date: string; time: string | null; duration: number; status: string; serviceType: string; contractor: string; clients: string; groupHeadcount: number | null; groupMembers: string; classroom: string; notes: string; clientNotes: string }`
  - `export function buildSessionsExportCsv(rows: SessionExportRow[]): string`

- [ ] **Step 1: Write the failing test**

Create `src/lib/sessions/export-csv.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildSessionsExportCsv, type SessionExportRow } from './export-csv'

const row = (over: Partial<SessionExportRow> = {}): SessionExportRow => ({
  date: '2026-07-30',
  time: '10:00',
  duration: 30,
  status: 'approved',
  serviceType: 'Individual',
  contractor: 'Alex',
  clients: 'Client A',
  groupHeadcount: null,
  groupMembers: '',
  classroom: '',
  notes: '',
  clientNotes: '',
  ...over,
})

describe('buildSessionsExportCsv', () => {
  it('emits a header row followed by one line per session', () => {
    const csv = buildSessionsExportCsv([row(), row({ date: '2026-07-31' })])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('Date')
    expect(lines[0]).toContain('Client Notes')
  })

  it('emits only the header for no rows', () => {
    expect(buildSessionsExportCsv([]).split('\n')).toHaveLength(1)
  })

  it('every row has the same field count as the header', () => {
    const lines = buildSessionsExportCsv([row()]).split('\n')
    const count = (line: string) => line.split(',').length
    expect(count(lines[1])).toBe(count(lines[0]))
  })

  it('escapes embedded quotes by doubling them', () => {
    const csv = buildSessionsExportCsv([row({ clients: 'A "B" C' })])
    expect(csv).toContain('"A ""B"" C"')
  })

  it('neutralizes a leading formula character so spreadsheets treat it as text', () => {
    // CSV/formula-injection hardening carried over from the route.
    for (const lead of ['=', '+', '-', '@']) {
      const csv = buildSessionsExportCsv([row({ contractor: `${lead}cmd()` })])
      expect(csv).toContain(`"'${lead}cmd()"`)
    }
  })

  it('flattens newlines in notes so one session stays one CSV line', () => {
    const csv = buildSessionsExportCsv([row({ notes: 'line one\nline two' })])
    expect(csv.split('\n')).toHaveLength(2)
    expect(csv).toContain('line one line two')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/sessions/export-csv.test.ts`
Expected: FAIL — `Failed to resolve import "./export-csv"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/sessions/export-csv.ts`. This is a lift-and-shift of the route's existing logic — behavior must not change:

```ts
/**
 * CSV serialization for the sessions export.
 *
 * Extracted from `/api/sessions/export` so the dev smoke check can exercise the
 * same builder the route uses. A check that re-implemented this could pass while
 * the real export was broken.
 */

export interface SessionExportRow {
  date: string
  time: string | null
  duration: number
  status: string
  serviceType: string
  contractor: string
  clients: string
  groupHeadcount: number | null
  groupMembers: string
  classroom: string
  notes: string
  clientNotes: string
}

export const SESSION_EXPORT_HEADERS = [
  'Date',
  'Time',
  'Duration (min)',
  'Status',
  'Service Type',
  'Contractor',
  'Clients',
  'Group Headcount',
  'Group Members',
  'Classroom',
  'Internal Notes',
  'Client Notes',
] as const

/**
 * Quote a CSV cell. A leading `=`, `+`, `-`, `@`, tab, or CR gets an apostrophe
 * so spreadsheet apps treat it as text, never a formula (injection hardening).
 */
function csvCell(value: string): string {
  const neutralized = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${neutralized.replace(/"/g, '""')}"`
}

export function buildSessionsExportCsv(rows: SessionExportRow[]): string {
  return [
    SESSION_EXPORT_HEADERS.join(','),
    ...rows.map((row) =>
      [
        row.date,
        row.time || '',
        row.duration,
        row.status,
        csvCell(row.serviceType || ''),
        csvCell(row.contractor || ''),
        csvCell(row.clients || ''),
        row.groupHeadcount || '',
        csvCell(row.groupMembers || ''),
        csvCell(row.classroom || ''),
        csvCell((row.notes || '').replace(/\n/g, ' ')),
        csvCell((row.clientNotes || '').replace(/\n/g, ' ')),
      ].join(',')
    ),
  ].join('\n')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/sessions/export-csv.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Rewire the route to use the builder**

In `src/app/api/sessions/export/route.ts`, add the import alongside the existing ones:

```ts
import { buildSessionsExportCsv } from '@/lib/sessions/export-csv'
```

Then delete the inline `csvCell` function, the `headers` array, and the `csvRows` array, and replace them with a single call. The block that currently starts at the `// Quote a CSV cell;` comment and ends at `const csv = csvRows.join('\n')` becomes:

```ts
    const csv = buildSessionsExportCsv(exportData)
```

`exportData` already has exactly the `SessionExportRow` shape, except `serviceType`/`contractor`/`clients` may be `undefined` where the builder types them `string`. Coerce at the `return` inside the existing `exportData` map: change `serviceType: serviceTypeName || ''` and `contractor: contractorName || ''` and `clients: clientNames || ''` to keep the `|| ''` (they already have it), and change `notes: decryptedNotes || ''` / `clientNotes: decryptedClientNotes || ''` (already present). No other change needed — verify with the type check in the next step.

- [ ] **Step 6: Verify the route still type-checks and the JSON path is untouched**

Run: `npx tsc --noEmit`
Expected: no output (clean).

Run: `npm run lint 2>&1 | tail -3`
Expected: `0 errors` (warning count unchanged from before this task).

- [ ] **Step 7: Commit**

```bash
git add src/lib/sessions/export-csv.ts src/lib/sessions/export-csv.test.ts "src/app/api/sessions/export/route.ts"
git commit -m "refactor(sessions): extract buildSessionsExportCsv from the export route

The dev smoke check needs to exercise the same CSV builder the route uses. A
check that re-implemented the serialization could pass while the real export
was broken, so the logic moves to src/lib/ with a colocated test and the route
calls it. Pure lift-and-shift: header order, quote doubling, formula-character
neutralization, and newline flattening are unchanged."
```

---

### Task 2: Smoke check orchestration and assertions

The pure assertion logic is where the value is — a byte-length floor, a column-count check, a vendor status mapping. Inject every I/O dependency so the whole module is unit-testable.

**Files:**
- Create: `src/lib/dev/smoke-checks.ts`
- Create: `src/lib/dev/smoke-checks.test.ts`

**Interfaces:**
- Consumes: nothing (deps are injected by Task 3).
- Produces:
  - `export type SmokeStatus = 'pass' | 'fail' | 'skip'`
  - `export interface SmokeCheck { name: string; status: SmokeStatus; detail: string; ms: number }`
  - `export interface SmokeDeps { loadInvoicePdf: () => Promise<Uint8Array | null>; loadSessionsCsv: () => Promise<string | null>; loadTaxSummaryCsv: () => Promise<string | null>; probeEmailSender: () => Promise<number | null>; probeAiHelp: () => Promise<number | null> }`
  - `export function assertPdfBytes(bytes: Uint8Array | null): { status: SmokeStatus; detail: string }`
  - `export function assertCsvHasRows(csv: string | null): { status: SmokeStatus; detail: string }`
  - `export function assertCsvColumnsConsistent(csv: string | null): { status: SmokeStatus; detail: string }`
  - `export function assertVendorStatus(status: number | null, vendor: string): { status: SmokeStatus; detail: string }`
  - `export function runSmokeChecks(deps: SmokeDeps): Promise<SmokeCheck[]>`

- [ ] **Step 1: Write the failing test**

Create `src/lib/dev/smoke-checks.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  assertPdfBytes,
  assertCsvHasRows,
  assertCsvColumnsConsistent,
  assertVendorStatus,
  runSmokeChecks,
  type SmokeDeps,
} from './smoke-checks'

const pdf = (size: number) => {
  const bytes = new Uint8Array(size)
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d]) // "%PDF-"
  return bytes
}

describe('assertPdfBytes', () => {
  it('passes a real PDF over the size floor', () => {
    expect(assertPdfBytes(pdf(3000)).status).toBe('pass')
  })

  it('fails bytes that lack the %PDF- magic header', () => {
    const r = assertPdfBytes(new Uint8Array(3000))
    expect(r.status).toBe('fail')
    expect(r.detail).toMatch(/magic/i)
  })

  it('fails a truncated PDF even though the magic header is present', () => {
    // The size floor is load-bearing: an empty or truncated file still
    // begins with %PDF-, so magic alone would report a broken PDF as healthy.
    const r = assertPdfBytes(pdf(200))
    expect(r.status).toBe('fail')
    expect(r.detail).toMatch(/200 bytes/)
  })

  it('skips when there is no invoice fixture', () => {
    expect(assertPdfBytes(null).status).toBe('skip')
  })
})

describe('assertCsvHasRows', () => {
  it('passes a header plus at least one data row', () => {
    expect(assertCsvHasRows('A,B\n1,2').status).toBe('pass')
  })

  it('fails a header with no data rows', () => {
    const r = assertCsvHasRows('A,B')
    expect(r.status).toBe('fail')
    expect(r.detail).toMatch(/no data rows/i)
  })

  it('fails empty output', () => {
    expect(assertCsvHasRows('').status).toBe('fail')
  })

  it('skips when there is no fixture', () => {
    expect(assertCsvHasRows(null).status).toBe('skip')
  })
})

describe('assertCsvColumnsConsistent', () => {
  it('passes when every row matches the header field count', () => {
    expect(assertCsvColumnsConsistent('A,B,C\n1,2,3\n4,5,6').status).toBe('pass')
  })

  it('fails and names the offending row when a row is short', () => {
    const r = assertCsvColumnsConsistent('A,B,C\n1,2,3\n4,5')
    expect(r.status).toBe('fail')
    expect(r.detail).toMatch(/row 2/)
  })

  it('skips when there is no fixture', () => {
    expect(assertCsvColumnsConsistent(null).status).toBe('skip')
  })
})

describe('assertVendorStatus', () => {
  it('passes on 200', () => {
    expect(assertVendorStatus(200, 'resend').status).toBe('pass')
  })

  it('skips when the key is unset rather than reporting a fault', () => {
    // A deliberately absent key is a valid configuration, not a failure.
    const r = assertVendorStatus(null, 'anthropic')
    expect(r.status).toBe('skip')
    expect(r.detail).toMatch(/not configured/i)
  })

  it('fails on any non-200 and reports the status code', () => {
    const r = assertVendorStatus(403, 'resend')
    expect(r.status).toBe('fail')
    expect(r.detail).toContain('403')
  })

  it('fails a 400 from a present-but-unusable credential', () => {
    // The exact shape of the 2026-07-30 Anthropic outage: valid key, no credits.
    expect(assertVendorStatus(400, 'anthropic').status).toBe('fail')
  })
})

const okDeps = (): SmokeDeps => ({
  loadInvoicePdf: async () => pdf(3000),
  loadSessionsCsv: async () => 'A,B\n1,2',
  loadTaxSummaryCsv: async () => 'A,B\n1,2',
  probeEmailSender: async () => 200,
  probeAiHelp: async () => 200,
})

describe('runSmokeChecks', () => {
  it('returns all five checks by name', async () => {
    const checks = await runSmokeChecks(okDeps())
    expect(checks.map((c) => c.name)).toEqual([
      'invoice-pdf',
      'sessions-csv',
      'tax-summary-csv',
      'email-sender',
      'ai-help',
    ])
    expect(checks.every((c) => c.status === 'pass')).toBe(true)
  })

  it('records elapsed milliseconds for each check', async () => {
    const checks = await runSmokeChecks(okDeps())
    expect(checks.every((c) => typeof c.ms === 'number' && c.ms >= 0)).toBe(true)
  })

  it('converts a thrown dependency into a fail rather than propagating', async () => {
    // The route must never 500 because one probe blew up.
    const checks = await runSmokeChecks({
      ...okDeps(),
      loadInvoicePdf: async () => {
        throw new Error('supabase exploded')
      },
    })
    const pdfCheck = checks.find((c) => c.name === 'invoice-pdf')!
    expect(pdfCheck.status).toBe('fail')
    expect(pdfCheck.detail).toContain('supabase exploded')
  })

  it('scrubs secrets out of a thrown error message', async () => {
    const checks = await runSmokeChecks({
      ...okDeps(),
      probeAiHelp: async () => {
        throw new Error('bad key sk-ant-api03-SECRETVALUE here')
      },
    })
    const detail = checks.find((c) => c.name === 'ai-help')!.detail
    expect(detail).not.toContain('SECRETVALUE')
    expect(detail).toContain('sk-ant-***')
  })

  it('keeps going after one check fails', async () => {
    const checks = await runSmokeChecks({ ...okDeps(), probeEmailSender: async () => 403 })
    expect(checks).toHaveLength(5)
    expect(checks.find((c) => c.name === 'email-sender')!.status).toBe('fail')
    expect(checks.find((c) => c.name === 'ai-help')!.status).toBe('pass')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/dev/smoke-checks.test.ts`
Expected: FAIL — `Failed to resolve import "./smoke-checks"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/dev/smoke-checks.ts`:

```ts
/**
 * Functional smoke checks for the dev portal.
 *
 * These assert on ARTIFACTS, not on config. The distinction is the whole point:
 * on 2026-07-29 `/api/health` reported `email: pass` because RESEND_API_KEY
 * existed, while every send had been failing 403 for seven months behind a
 * de-verified sender domain. On 2026-07-30 `GET /v1/models` returned 200 with 11
 * models listed while every Anthropic completion failed 400 for lack of credits.
 * A credential being present, and even authenticating, is not evidence that it
 * can do work.
 *
 * Every dependency is injected so this module is fully unit-testable; the
 * dev-only route supplies the real ones.
 */

export type SmokeStatus = 'pass' | 'fail' | 'skip'

export interface SmokeCheck {
  name: string
  status: SmokeStatus
  detail: string
  ms: number
}

export interface SmokeDeps {
  /** Rendered invoice PDF bytes, or null when no invoice exists to render. */
  loadInvoicePdf: () => Promise<Uint8Array | null>
  /** Sessions export CSV, or null when there are no sessions. */
  loadSessionsCsv: () => Promise<string | null>
  /** Tax-summary CSV, or null when no sessions were paid in the target year. */
  loadTaxSummaryCsv: () => Promise<string | null>
  /** HTTP status from a real Resend send, or null when the key is unset. */
  probeEmailSender: () => Promise<number | null>
  /** HTTP status from a real Anthropic completion, or null when unset. */
  probeAiHelp: () => Promise<number | null>
}

/** A PDF under this many bytes is truncated, not a document. */
const PDF_MIN_BYTES = 1000

const PDF_MAGIC = '%PDF-'

/** Keep credentials out of portal output, however they reach us. */
export function scrubSecrets(text: string): string {
  return text
    .replace(/re_[A-Za-z0-9_-]+/g, 're_***')
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, 'sk-ant-***')
}

export function assertPdfBytes(bytes: Uint8Array | null): { status: SmokeStatus; detail: string } {
  if (bytes === null) return { status: 'skip', detail: 'no invoice in this database' }

  const head = Array.from(bytes.subarray(0, 5))
    .map((b) => String.fromCharCode(b))
    .join('')
  if (head !== PDF_MAGIC) {
    return { status: 'fail', detail: `missing %PDF- magic header (got ${JSON.stringify(head)})` }
  }
  // Checked AFTER the magic header on purpose: a truncated or empty file still
  // starts with %PDF-, so the magic header alone would report it healthy.
  if (bytes.byteLength < PDF_MIN_BYTES) {
    return {
      status: 'fail',
      detail: `truncated PDF — ${bytes.byteLength} bytes, expected at least ${PDF_MIN_BYTES}`,
    }
  }
  return { status: 'pass', detail: `${bytes.byteLength} bytes, valid %PDF- header` }
}

export function assertCsvHasRows(csv: string | null): { status: SmokeStatus; detail: string } {
  if (csv === null) return { status: 'skip', detail: 'no rows in this database' }
  const lines = csv.split('\n').filter((l) => l.length > 0)
  if (lines.length === 0) return { status: 'fail', detail: 'empty output — no header row' }
  if (lines.length === 1) {
    return { status: 'fail', detail: 'header present but no data rows' }
  }
  return { status: 'pass', detail: `${lines.length - 1} data row(s)` }
}

export function assertCsvColumnsConsistent(
  csv: string | null
): { status: SmokeStatus; detail: string } {
  if (csv === null) return { status: 'skip', detail: 'no rows in this database' }
  const lines = csv.split('\n').filter((l) => l.length > 0)
  if (lines.length === 0) return { status: 'fail', detail: 'empty output — no header row' }
  const expected = lines[0].split(',').length
  for (let i = 1; i < lines.length; i++) {
    const got = lines[i].split(',').length
    if (got !== expected) {
      return {
        status: 'fail',
        detail: `row ${i} has ${got} fields, header has ${expected}`,
      }
    }
  }
  return { status: 'pass', detail: `${expected} columns, ${lines.length - 1} row(s) consistent` }
}

export function assertVendorStatus(
  status: number | null,
  vendor: string
): { status: SmokeStatus; detail: string } {
  if (status === null) {
    return { status: 'skip', detail: `${vendor} not configured (key unset)` }
  }
  if (status === 200) return { status: 'pass', detail: `${vendor} accepted a real call (200)` }
  return { status: 'fail', detail: `${vendor} rejected a real call (HTTP ${status})` }
}

async function timed(
  name: string,
  run: () => Promise<{ status: SmokeStatus; detail: string }>
): Promise<SmokeCheck> {
  const started = Date.now()
  try {
    const { status, detail } = await run()
    return { name, status, detail: scrubSecrets(detail), ms: Date.now() - started }
  } catch (err) {
    // A check never throws — a blown-up probe is a failing check, not a 500.
    const message = err instanceof Error ? err.message : String(err)
    return { name, status: 'fail', detail: scrubSecrets(message), ms: Date.now() - started }
  }
}

export async function runSmokeChecks(deps: SmokeDeps): Promise<SmokeCheck[]> {
  return [
    await timed('invoice-pdf', async () => assertPdfBytes(await deps.loadInvoicePdf())),
    await timed('sessions-csv', async () => assertCsvHasRows(await deps.loadSessionsCsv())),
    await timed('tax-summary-csv', async () =>
      assertCsvColumnsConsistent(await deps.loadTaxSummaryCsv())
    ),
    await timed('email-sender', async () =>
      assertVendorStatus(await deps.probeEmailSender(), 'Resend')
    ),
    await timed('ai-help', async () => assertVendorStatus(await deps.probeAiHelp(), 'Anthropic')),
  ]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/dev/smoke-checks.test.ts`
Expected: PASS — 20 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dev/smoke-checks.ts src/lib/dev/smoke-checks.test.ts
git commit -m "feat(dev): smoke check assertions that test artifacts, not config

Five checks with every I/O dependency injected, so the assertion logic is
fully unit-tested. Two assertions are load-bearing and worth naming: the PDF
size floor is checked after the magic header because a truncated file still
starts with %PDF-, and a null probe status reports skip rather than fail
because a deliberately absent key is a valid configuration.

A thrown probe becomes a failing check, never a 500, and every detail string
is scrubbed of re_* and sk-ant-* before it can reach portal output."
```

---

### Task 3: Dev-only smoke route

Wire the real probes to Task 2's orchestration behind a route that does not exist in production.

**Files:**
- Create: `src/app/api/dev/smoke/route.ts`

**Interfaces:**
- Consumes: `runSmokeChecks`, `SmokeDeps`, `SmokeCheck` from `@/lib/dev/smoke-checks`; `buildSessionsExportCsv`, `SessionExportRow` from `@/lib/sessions/export-csv`; `fetchInvoicePdfData` from `@/lib/invoices/pdf-data`; `buildSummaryCsv`, `summarizeByContractor` from `@/lib/payroll/annual-summary`; `createServiceClient` from `@/lib/supabase/service`; `InvoicePDF` from `@/components/pdf/invoice-pdf`.
- Produces: `GET /api/dev/smoke/` → `200 { ranAt: string, checks: SmokeCheck[] }`, or `404` in production.

- [ ] **Step 1: Write the route**

Create `src/app/api/dev/smoke/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { InvoicePDF } from '@/components/pdf/invoice-pdf'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchInvoicePdfData } from '@/lib/invoices/pdf-data'
import { buildSessionsExportCsv, type SessionExportRow } from '@/lib/sessions/export-csv'
import { buildSummaryCsv, summarizeByContractor } from '@/lib/payroll/annual-summary'
import { runSmokeChecks, type SmokeDeps } from '@/lib/dev/smoke-checks'

/**
 * Dev-only functional smoke checks, consumed by the dev portal's Tests card.
 * Hard 404 in production — this surface does not exist there, same as
 * /api/dev/errors.
 *
 * Runs in-process against real dev data so it needs no auth dance and no
 * browser. It therefore verifies generation logic, not the HTTP + auth +
 * client-download chain; that chain is covered by the e2e suite.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 })
  }

  const supabase = createServiceClient()

  const deps: SmokeDeps = {
    async loadInvoicePdf() {
      const { data } = await supabase
        .from('invoices')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
      const id = data?.[0]?.id
      if (!id) return null
      const bundle = await fetchInvoicePdfData(supabase, id)
      if (!bundle) return null
      const buffer = await renderToBuffer(
        createElement(InvoicePDF, {
          invoice: bundle.invoice,
          footerText: bundle.footerText,
          paymentInstructions: bundle.paymentInstructions,
        }) as ReactElement<DocumentProps>
      )
      return new Uint8Array(buffer)
    },

    async loadSessionsCsv() {
      const { data } = await supabase
        .from('sessions')
        .select('date, time, duration_minutes, status, group_headcount, group_member_names, classroom')
        .order('date', { ascending: false })
        .limit(25)
      if (!data || data.length === 0) return null
      // Notes are deliberately omitted: this check proves the serializer
      // produces well-formed rows, and decrypting PHI to do that would be
      // gratuitous. Encryption has its own coverage in src/lib/crypto.
      const rows: SessionExportRow[] = data.map((s) => ({
        date: s.date,
        time: s.time,
        duration: s.duration_minutes,
        status: s.status,
        serviceType: '',
        contractor: '',
        clients: '',
        groupHeadcount: s.group_headcount,
        groupMembers: s.group_member_names || '',
        classroom: s.classroom || '',
        notes: '',
        clientNotes: '',
      }))
      return buildSessionsExportCsv(rows)
    },

    async loadTaxSummaryCsv() {
      const year = new Date().getFullYear()
      const { data } = await supabase
        .from('sessions')
        .select('id, date, contractor_id, contractor_pay, contractor_paid_amount, contractor_paid_date, duration_minutes, contractor:users!sessions_contractor_id_fkey(name)')
        .not('contractor_paid_date', 'is', null)
      if (!data || data.length === 0) return null
      const rows = data.map((s) => {
        const contractor = Array.isArray(s.contractor) ? s.contractor[0] : s.contractor
        return {
          ...s,
          contractor_name: contractor?.name || 'Unknown',
          service_type_name: '',
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totals = summarizeByContractor(rows as any, year)
      if (totals.length === 0) return null
      return buildSummaryCsv(totals, year)
    },

    async probeEmailSender() {
      const key = process.env.RESEND_API_KEY
      if (!key) return null
      const domain = process.env.EMAIL_FROM_DOMAIN || 'rattatata.xyz'
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        // delivered@resend.dev is Resend's simulator — no human receives this,
        // so the check is safe to run as often as you like.
        body: JSON.stringify({
          from: `May Creative Arts <noreply@${domain}>`,
          to: ['delivered@resend.dev'],
          subject: 'MCA smoke check',
          text: 'smoke',
        }),
        signal: AbortSignal.timeout(10000),
      })
      return res.status
    },

    async probeAiHelp() {
      const key = process.env.ANTHROPIC_API_KEY
      if (!key) return null
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        // Must be a real completion. GET /v1/models is authenticated and free,
        // which makes it the obvious probe and the wrong one — it returned 200
        // with 11 models listed throughout the 2026-07-30 credit outage.
        // Read the model the same way src/lib/help/ai.ts does so this follows
        // the app instead of pinning its own. Thinking is disabled because
        // adaptive is the default on Sonnet 5 and would share the 1-token cap.
        body: JSON.stringify({
          model: process.env.HELP_AI_MODEL || 'claude-sonnet-5',
          max_tokens: 1,
          thinking: { type: 'disabled' },
          messages: [{ role: 'user', content: 'hi' }],
        }),
        signal: AbortSignal.timeout(15000),
      })
      return res.status
    },
  }

  const checks = await runSmokeChecks(deps)
  return NextResponse.json({ ranAt: new Date().toISOString(), checks })
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no output. If `summarizeByContractor`'s input type complains, keep the `as any` cast and its eslint-disable — the shape is assembled from a join and the aggregation is what's under test here.

- [ ] **Step 3: Verify the route returns all five checks green**

Start the dev server if it is not already running (`npm run dev`), then:

Run: `curl -s http://localhost:3000/api/dev/smoke/ | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);for(const c of j.checks)console.log(c.status.padEnd(5),c.name.padEnd(16),c.detail)})"`

Expected: five lines, each `pass` (or `skip` for a dependency whose key is unset locally — `email-sender` skips in dev by design, since `RESEND_API_KEY` is deliberately absent there).

- [ ] **Step 4: Verify the route is invisible in a production build**

Run: `NODE_ENV=production npx tsx -e "process.env.NODE_ENV='production'; import('./src/app/api/dev/smoke/route.ts').then(async m => { const r = await m.GET(); console.log('status', r.status) })"`
Expected: `status 404`.

If `tsx` cannot resolve the Next imports in isolation, verify by inspection instead: confirm the first two lines of `GET` are the `NODE_ENV === 'production'` guard returning `404`, matching `src/app/api/dev/errors/route.ts`.

- [ ] **Step 5: Prove each check is non-vacuous**

**This step is required, not optional.** A check that has never failed has not been shown to check anything. For each of the three below, break the subject, confirm the check goes red with the expected detail, then revert.

1. **`invoice-pdf`** — in `src/lib/dev/smoke-checks.ts`, temporarily change `PDF_MIN_BYTES` to `10_000_000`. Re-run the curl from Step 3. Expected: `fail  invoice-pdf  truncated PDF — <n> bytes, expected at least 10000000`. Revert.
2. **`email-sender`** — temporarily set `EMAIL_FROM_DOMAIN=not-a-real-domain.invalid` in `.env.local` **and** temporarily add your `RESEND_API_KEY` there so the check does not skip. Re-run. Expected: `fail  email-sender  Resend rejected a real call (HTTP 403)`. Remove both again — dev must not keep a Resend key.
3. **`ai-help`** — temporarily set `HELP_AI_MODEL=claude-not-a-model` in `.env.local`. Re-run. Expected: `fail  ai-help  Anthropic rejected a real call (HTTP 404)`. Revert.

Record the three observed failure details in the commit message.

- [ ] **Step 6: Commit**

```bash
git add "src/app/api/dev/smoke/route.ts"
git commit -m "feat(dev): dev-only /api/dev/smoke route wiring the real probes

404s in production, same guard as /api/dev/errors. Runs in-process against
real dev data via the service client, so no auth dance and no browser; that
means it covers generation logic and not the HTTP+auth+download chain, which
the e2e suite owns.

The Anthropic probe is a real one-token completion rather than GET /v1/models,
because the models list is authenticated and free and returned 200 with 11
models throughout the 2026-07-30 credit outage. Resend's probe targets its
delivered@resend.dev simulator, so no human receives anything.

Non-vacuity verified — each check observed failing for the right reason:
  invoice-pdf   raised PDF floor  -> 'truncated PDF — N bytes, expected ...'
  email-sender  bogus from-domain -> 'Resend rejected a real call (HTTP 403)'
  ai-help       bogus model id    -> 'Anthropic rejected a real call (HTTP 404)'"
```

---

### Task 4: Portal test runner library

Spawn the runners, parse their JSON reporters, and hold run state. Reporter parsing is the piece most likely to break silently on a runner upgrade, so it gets tests against captured fixtures.

**Files:**
- Create: `tools/dev-portal/lib/tests.mjs`
- Create: `tools/dev-portal/lib/tests.test.mjs`
- Modify: `tests/e2e/invoice-pdf-download.spec.ts:20` (add `@smoke` to the test title)
- Modify: `tests/e2e/app.spec.ts:4` and `tests/e2e/app.spec.ts:35` (add `@smoke` to two titles)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export const SUITES` — object keyed by suite id (`unit`, `smoke`, `e2e-quick`, `e2e-full`), each `{ label, timeoutMs }`
  - `export function parseVitestJson(stdout: string): { passed, failed, total, failures: {name, message}[] }`
  - `export function parsePlaywrightJson(stdout: string): { passed, failed, total, failures: {name, message}[] }`
  - `export function scrubSecrets(text: string): string`
  - `export function isDirtyPorcelain(porcelain: string): boolean`
  - `export function gitState(): Promise<{ sha: string, dirty: boolean }>`
  - `export function startRun(suiteId, { onDone }): { runId } | { error }`
  - `export function getRunStates(): Record<string, object>`
  - `export function isBusy(suiteId): boolean`

- [ ] **Step 1: Tag three e2e tests as `@smoke`**

`e2e-quick` greps for `@smoke`, so the tag must exist or the suite finds nothing and reports a vacuous zero.

In `tests/e2e/invoice-pdf-download.spec.ts`, change the test title:

```ts
  test('@smoke saves with a .pdf filename, not a bare blob UUID', async ({ page }) => {
```

In `tests/e2e/app.spec.ts`, change two titles:

```ts
  test('@smoke login page loads', async ({ page }) => {
```

```ts
  test('@smoke redirects unauthenticated users to login', async ({ page }) => {
```

- [ ] **Step 2: Verify the tag selects exactly three tests**

Run: `npx playwright test --grep @smoke --list`
Expected: three tests listed — the two from `app.spec.ts` and the one from `invoice-pdf-download.spec.ts`.

- [ ] **Step 3: Write the failing parser test**

Create `tools/dev-portal/lib/tests.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import { parseVitestJson, parsePlaywrightJson, scrubSecrets, SUITES } from './tests.mjs'

describe('SUITES', () => {
  it('defines the four suites the portal exposes', () => {
    expect(Object.keys(SUITES)).toEqual(['unit', 'smoke', 'e2e-quick', 'e2e-full'])
  })

  it('gives e2e-full the longest timeout, since it runs serially', () => {
    expect(SUITES['e2e-full'].timeoutMs).toBeGreaterThan(SUITES['e2e-quick'].timeoutMs)
  })
})

describe('parseVitestJson', () => {
  const stdout = JSON.stringify({
    numTotalTests: 3,
    numPassedTests: 2,
    numFailedTests: 1,
    testResults: [
      {
        assertionResults: [
          { fullName: 'a passes', status: 'passed' },
          { fullName: 'b passes', status: 'passed' },
          { fullName: 'c fails', status: 'failed', failureMessages: ['expected 1 to be 2'] },
        ],
      },
    ],
  })

  it('reads the counts', () => {
    expect(parseVitestJson(stdout)).toMatchObject({ passed: 2, failed: 1, total: 3 })
  })

  it('names each failure with its message', () => {
    expect(parseVitestJson(stdout).failures).toEqual([
      { name: 'c fails', message: 'expected 1 to be 2' },
    ])
  })

  it('tolerates a reporter banner printed before the JSON', () => {
    // Runners print human-readable preamble; the JSON starts at the first brace.
    const r = parseVitestJson(`RUN v4.1.10\n${stdout}`)
    expect(r.total).toBe(3)
  })

  it('throws on unparseable output so the caller can report error, not fail', () => {
    expect(() => parseVitestJson('command not found')).toThrow()
  })
})

describe('parsePlaywrightJson', () => {
  const stdout = JSON.stringify({
    suites: [
      {
        specs: [
          { title: '@smoke login page loads', tests: [{ results: [{ status: 'passed' }] }] },
          {
            title: '@smoke redirects',
            tests: [{ results: [{ status: 'failed', error: { message: 'locator timeout' } }] }],
          },
          { title: 'skipped one', tests: [{ results: [{ status: 'skipped' }] }] },
        ],
      },
    ],
  })

  it('counts passes and failures and ignores skips in the pass count', () => {
    expect(parsePlaywrightJson(stdout)).toMatchObject({ passed: 1, failed: 1, total: 3 })
  })

  it('names each failure with its message', () => {
    expect(parsePlaywrightJson(stdout).failures).toEqual([
      { name: '@smoke redirects', message: 'locator timeout' },
    ])
  })

  it('walks nested suites', () => {
    const nested = JSON.stringify({
      suites: [{ suites: [{ specs: [{ title: 'deep', tests: [{ results: [{ status: 'passed' }] }] }] }] }],
    })
    expect(parsePlaywrightJson(nested).passed).toBe(1)
  })

  it('throws on unparseable output', () => {
    expect(() => parsePlaywrightJson('nope')).toThrow()
  })
})

describe('scrubSecrets', () => {
  it('masks Resend and Anthropic keys', () => {
    const out = scrubSecrets('re_abc123DEF and sk-ant-api03-xyz789')
    expect(out).not.toContain('abc123DEF')
    expect(out).not.toContain('xyz789')
    expect(out).toContain('re_***')
    expect(out).toContain('sk-ant-***')
  })
})

describe('isDirtyPorcelain', () => {
  it('treats empty output as a clean tree', () => {
    expect(isDirtyPorcelain('')).toBe(false)
    expect(isDirtyPorcelain('\n')).toBe(false)
  })

  it('treats a modified tracked file as dirty', () => {
    expect(isDirtyPorcelain(' M src/lib/pricing/index.ts\n')).toBe(true)
  })

  it('ignores untracked files — this repo always has many', () => {
    // A results badge should not read "dirty" just because screenshots and
    // scratch notes are sitting in the working directory.
    expect(isDirtyPorcelain('?? screenshot.png\n?? notes.md\n')).toBe(false)
  })

  it('is dirty when tracked changes accompany untracked files', () => {
    expect(isDirtyPorcelain('?? screenshot.png\n M src/app/page.tsx\n')).toBe(true)
  })
})
```

Add `isDirtyPorcelain` to the import at the top of the file:

```js
import { parseVitestJson, parsePlaywrightJson, scrubSecrets, isDirtyPorcelain, SUITES } from './tests.mjs'
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run tools/dev-portal/lib/tests.test.mjs`
Expected: FAIL — cannot resolve `./tests.mjs`.

- [ ] **Step 5: Write the implementation**

Create `tools/dev-portal/lib/tests.mjs`:

```js
/**
 * Test-suite runner for the dev portal.
 *
 * Spawns the real runners via execFile (the same mechanism external.mjs already
 * uses for `gh`) and holds run state in memory. Callers start a run and poll —
 * chosen over SSE because a page reload must not drop an in-flight 4-minute
 * e2e run.
 *
 * Zero dependencies: Node 20+ builtins only.
 */
import { execFile } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

// Playwright always runs --workers=1: the suite is only reliably green serially,
// because the tests share one dev organization's data.
export const SUITES = {
  unit: {
    label: 'Unit',
    timeoutMs: 120_000,
    kind: 'vitest',
    command: 'npx',
    args: ['vitest', 'run', '--reporter=json'],
  },
  smoke: {
    label: 'Smoke',
    timeoutMs: 30_000,
    kind: 'smoke',
  },
  'e2e-quick': {
    label: 'E2E (quick)',
    timeoutMs: 120_000,
    kind: 'playwright',
    command: 'npx',
    args: ['playwright', 'test', '--grep', '@smoke', '--workers=1', '--reporter=json'],
  },
  'e2e-full': {
    label: 'E2E (full)',
    timeoutMs: 600_000,
    kind: 'playwright',
    command: 'npx',
    args: ['playwright', 'test', '--workers=1', '--reporter=json'],
  },
}

export function scrubSecrets(text) {
  return String(text)
    .replace(/re_[A-Za-z0-9_-]+/g, 're_***')
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, 'sk-ant-***')
}

/** Runners print a human-readable banner first; the JSON starts at the first brace. */
function parseJsonPayload(stdout) {
  const start = stdout.indexOf('{')
  if (start === -1) throw new Error('no JSON in runner output')
  return JSON.parse(stdout.slice(start))
}

export function parseVitestJson(stdout) {
  const json = parseJsonPayload(stdout)
  const failures = []
  for (const file of json.testResults || []) {
    for (const a of file.assertionResults || []) {
      if (a.status === 'failed') {
        failures.push({
          name: a.fullName || a.title || 'unknown test',
          message: (a.failureMessages || []).join('\n').split('\n')[0] || 'no message',
        })
      }
    }
  }
  return {
    passed: json.numPassedTests ?? 0,
    failed: json.numFailedTests ?? 0,
    total: json.numTotalTests ?? 0,
    failures: failures.slice(0, 20),
  }
}

export function parsePlaywrightJson(stdout) {
  const json = parseJsonPayload(stdout)
  let passed = 0
  let failed = 0
  let total = 0
  const failures = []

  const walk = (suites) => {
    for (const suite of suites || []) {
      for (const spec of suite.specs || []) {
        total++
        const results = (spec.tests || []).flatMap((t) => t.results || [])
        if (results.some((r) => r.status === 'failed' || r.status === 'timedOut')) {
          failed++
          const err = results.find((r) => r.error)?.error
          failures.push({
            name: spec.title || 'unknown test',
            message: (err?.message || 'no message').split('\n')[0],
          })
        } else if (results.some((r) => r.status === 'passed')) {
          passed++
        }
      }
      walk(suite.suites)
    }
  }
  walk(json.suites)

  return { passed, failed, total, failures: failures.slice(0, 20) }
}

// ---- Git provenance ----

/**
 * Untracked files do NOT count as dirty. This repo permanently carries
 * screenshots and scratch notes in the working directory; counting them would
 * mark every result dirty and make the signal useless.
 */
export function isDirtyPorcelain(porcelain) {
  return porcelain
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .some((line) => !line.startsWith('??'))
}

function git(args) {
  return new Promise((resolve) => {
    execFile('git', args, { cwd: REPO_ROOT, timeout: 5000 }, (err, stdout) =>
      resolve(err ? null : stdout)
    )
  })
}

/**
 * What a result is actually ABOUT. Without this, a green badge from three
 * commits ago reads as reassuring rather than stale.
 */
export async function gitState() {
  const [sha, porcelain] = await Promise.all([
    git(['rev-parse', '--short', 'HEAD']),
    git(['status', '--porcelain']),
  ])
  return {
    sha: sha ? sha.trim() : 'unknown',
    dirty: porcelain === null ? false : isDirtyPorcelain(porcelain),
  }
}

// ---- Run state ----

const runs = Object.fromEntries(
  Object.keys(SUITES).map((id) => [id, { suite: id, status: 'idle' }])
)

export function getRunStates() {
  return runs
}

export function isBusy(suiteId) {
  if (runs[suiteId]?.status === 'running') return true
  // unit and e2e never run together: both hit the dev server and the shared
  // dev org, which is exactly what makes parallel e2e flaky.
  const group = suiteId.startsWith('e2e') || suiteId === 'unit'
  if (!group) return false
  return ['unit', 'e2e-quick', 'e2e-full'].some((id) => runs[id].status === 'running')
}

async function runSmokeSuite(suite) {
  const res = await fetch('http://localhost:3000/api/dev/smoke/', {
    signal: AbortSignal.timeout(suite.timeoutMs),
  })
  if (res.status === 404) {
    return { status: 'skip', passed: 0, failed: 0, total: 0, failures: [], note: 'dev route 404 — is the dev server running?' }
  }
  if (!res.ok) throw new Error(`smoke route returned ${res.status}`)
  const { checks } = await res.json()
  const failures = checks
    .filter((c) => c.status === 'fail')
    .map((c) => ({ name: c.name, message: c.detail }))
  const passed = checks.filter((c) => c.status === 'pass').length
  return {
    status: failures.length ? 'fail' : 'pass',
    passed,
    failed: failures.length,
    total: checks.length,
    failures,
    checks,
  }
}

function runSpawned(suite) {
  return new Promise((resolve, reject) => {
    execFile(
      suite.command,
      suite.args,
      { cwd: REPO_ROOT, timeout: suite.timeoutMs, maxBuffer: 32 * 1024 * 1024, shell: true },
      (err, stdout, stderr) => {
        // A non-zero exit is EXPECTED when tests fail — parse first and only
        // treat it as tooling breakage if the output is unusable.
        try {
          const parsed = suite.kind === 'vitest' ? parseVitestJson(stdout) : parsePlaywrightJson(stdout)
          resolve({ ...parsed, status: parsed.failed > 0 ? 'fail' : 'pass' })
        } catch {
          reject(new Error(scrubSecrets((stderr || err?.message || 'unparseable runner output').slice(-600))))
        }
      }
    )
  })
}

export function startRun(suiteId, { onDone } = {}) {
  const suite = SUITES[suiteId]
  if (!suite) return { error: `unknown suite ${suiteId}` }
  if (isBusy(suiteId)) return { runId: runs[suiteId].runId ?? null, busy: true }

  const runId = `${suiteId}-${Date.now()}`
  runs[suiteId] = { suite: suiteId, status: 'running', runId, startedAt: new Date().toISOString() }

  // Stamp the commit this run is about. Fire-and-forget: provenance must never
  // delay or fail the run itself.
  gitState().then((g) => {
    if (runs[suiteId]?.runId === runId) runs[suiteId] = { ...runs[suiteId], ...g }
  })

  const work = suite.kind === 'smoke' ? runSmokeSuite(suite) : runSpawned(suite)
  work
    .then((result) => {
      runs[suiteId] = { ...runs[suiteId], ...result, finishedAt: new Date().toISOString() }
    })
    .catch((err) => {
      // 'error' means the TOOLING broke, not that a test failed. Collapsing the
      // two is how a red badge becomes something you learn to ignore.
      runs[suiteId] = {
        ...runs[suiteId],
        status: 'error',
        note: scrubSecrets(err.message),
        finishedAt: new Date().toISOString(),
      }
    })
    .finally(() => onDone?.(runs[suiteId]))

  return { runId }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tools/dev-portal/lib/tests.test.mjs`
Expected: PASS — 12 tests.

- [ ] **Step 7: Commit**

```bash
git add tools/dev-portal/lib/tests.mjs tools/dev-portal/lib/tests.test.mjs tests/e2e/invoice-pdf-download.spec.ts tests/e2e/app.spec.ts
git commit -m "feat(portal): test runner library with reporter parsing and run state

Spawns the real runners via execFile — the mechanism external.mjs already uses
for gh — and holds run state in memory for polling. Polling rather than SSE so
a page reload can't drop an in-flight four-minute e2e run.

Reporter parsing gets its own tests against captured fixtures, since that is
the piece most likely to break silently on a runner upgrade. A non-zero exit
is parsed first and only treated as tooling breakage when the output is
unusable, which keeps 'error' distinct from 'fail'.

Tags three fast e2e tests @smoke so e2e-quick selects something; an untagged
grep would have reported a vacuous zero."
```

---

### Task 5: Portal server routes and persistence

**Files:**
- Modify: `tools/dev-portal/lib/store.mjs` (add tests.json persistence at the end of the file)
- Modify: `tools/dev-portal/server.mjs` (import, two new switch cases)

**Interfaces:**
- Consumes: `startRun`, `getRunStates`, `SUITES` from `./lib/tests.mjs`; `saveTestRuns`, `loadTestRuns` from `./lib/store.mjs`.
- Produces: `POST /api/tests/run?suite=<id>` → `{ runId }`; `GET /api/tests` → `{ suites: [{id,label}], runs: {...} }`.

- [ ] **Step 1: Add persistence to the store**

Append to `tools/dev-portal/lib/store.mjs`:

```js
// ---- Test run results (last completed run per suite) ----

let testRuns = loadJson('tests.json', {})

export function loadTestRuns() {
  return testRuns
}

export function saveTestRuns(runs) {
  // Persist only finished runs — a 'running' state is meaningless after a
  // portal restart, and would show a run that no longer exists.
  testRuns = Object.fromEntries(
    Object.entries(runs).filter(([, r]) => r.status !== 'idle' && r.status !== 'running')
  )
  saveJsonDebounced('tests.json', () => testRuns)
}
```

- [ ] **Step 2: Wire the routes**

In `tools/dev-portal/server.mjs`, add to the imports:

```js
import { startRun, getRunStates, SUITES } from './lib/tests.mjs'
import { saveTestRuns, loadTestRuns } from './lib/store.mjs'
```

Merge `loadTestRuns` into the store import line rather than duplicating it — the existing line already imports from `./lib/store.mjs`, so extend it:

```js
import { addError, listErrors, clearErrors, addHistoryPoint, getHistory, saveTestRuns, loadTestRuns } from './lib/store.mjs'
```

Then add two cases to the `switch (route)` in `handleApi`, alongside `case 'GET /api/ci':`:

```js
    case 'GET /api/tests': {
      const live = getRunStates()
      const persisted = loadTestRuns()
      // Fall back to the last persisted result for any suite that hasn't run
      // this session, so a portal restart doesn't look like "never tested".
      const runs = Object.fromEntries(
        Object.entries(live).map(([id, run]) => [
          id,
          run.status === 'idle' && persisted[id] ? { ...persisted[id], stale: true } : run,
        ])
      )
      json(res, 200, {
        suites: Object.entries(SUITES).map(([id, s]) => ({ id, label: s.label, timeoutMs: s.timeoutMs })),
        runs,
      })
      return
    }
    case 'POST /api/tests/run': {
      const suiteId = url.searchParams.get('suite')
      const result = startRun(suiteId, { onDone: () => saveTestRuns(getRunStates()) })
      if (result.error) {
        json(res, 400, result)
        return
      }
      json(res, 202, result)
      return
    }
```

- [ ] **Step 3: Verify the endpoints respond**

Start the portal: `npm run portal` (leave it running in another terminal).

Run: `curl -s http://localhost:4321/api/tests | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('suites:',j.suites.map(x=>x.id).join(', '));console.log('runs:',Object.keys(j.runs).join(', '))})"`
Expected: `suites: unit, smoke, e2e-quick, e2e-full` and the same four run keys.

- [ ] **Step 4: Verify a real run completes and persists**

Run: `curl -s -X POST "http://localhost:4321/api/tests/run?suite=smoke"`
Expected: `{"runId":"smoke-<timestamp>"}`.

Wait ~5 seconds, then run: `curl -s http://localhost:4321/api/tests | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s).runs.smoke;console.log(r.status,r.passed+'/'+r.total)})"`
Expected: `pass 4/5` or `pass 5/5` depending on which keys are set locally.

Run: `curl -s -X POST "http://localhost:4321/api/tests/run?suite=nope"`
Expected: HTTP 400 with `{"error":"unknown suite nope"}`.

- [ ] **Step 5: Verify the concurrency guard**

Run both immediately, one after the other:

```bash
curl -s -X POST "http://localhost:4321/api/tests/run?suite=unit" && curl -s -X POST "http://localhost:4321/api/tests/run?suite=e2e-quick"
```

Expected: the first returns a `runId`; the second returns `"busy":true` rather than starting a second run — unit and e2e must never run together.

- [ ] **Step 6: Commit**

```bash
git add tools/dev-portal/lib/store.mjs tools/dev-portal/server.mjs
git commit -m "feat(portal): GET /api/tests and POST /api/tests/run

Follows the existing section shape — an on-demand endpoint returning JSON that
app.js fetches. The last completed result per suite persists to data/tests.json
(already gitignored via /tools/dev-portal/data/), and a restored result is
marked stale so a portal restart doesn't read as 'never tested'.

Only finished runs persist: a 'running' state is meaningless after a restart
and would advertise a run that no longer exists."
```

---

### Task 6: Portal Tests card

**Files:**
- Modify: `tools/dev-portal/public/index.html` (new section after the sweep section)
- Modify: `tools/dev-portal/public/app.js` (state, render, poll, init wiring)
- Modify: `tools/dev-portal/public/styles.css` (append)
- Modify: `tools/dev-portal/README.md` (document the section)

**Interfaces:**
- Consumes: `GET /api/tests`, `POST /api/tests/run?suite=<id>` from Task 5.
- Produces: no exports — this is the UI leaf.

- [ ] **Step 1: Add the section markup**

In `tools/dev-portal/public/index.html`, insert immediately after the closing `</section>` of the endpoint-sweep section (the one containing `id="sweep-results"`):

```html
    <section class="panel">
      <div class="section-head">
        <p class="eyebrow" id="tests-heading">Tests</p>
        <div class="section-actions" id="tests-actions"></div>
      </div>
      <div id="tests-results"><p class="muted">Loading…</p></div>
    </section>
```

- [ ] **Step 2: Add state, render, and poll logic**

In `tools/dev-portal/public/app.js`, add to the `state` object:

```js
  tests: null,
```

Then add this block immediately before the `// ---- Error feed ----` comment:

```js
// ---- Tests ----

const RUN_LABEL = { idle: 'never run', running: 'running…', pass: 'pass', fail: 'FAIL', error: 'ERROR', skip: 'skipped' }

function renderTestsActions() {
  const suites = state.tests?.suites || []
  const anyRunning = Object.values(state.tests?.runs || {}).some(r => r.status === 'running')
  $('#tests-actions').innerHTML = suites
    .map(s => {
      const secs = Math.round(s.timeoutMs / 1000)
      return `<button class="btn" data-suite="${s.id}" ${anyRunning ? 'disabled' : ''} title="timeout ${secs}s">Run ${esc(s.label)}</button>`
    })
    .join('')
  document.querySelectorAll('[data-suite]').forEach(btn =>
    btn.addEventListener('click', () => runSuite(btn.dataset.suite))
  )
}

async function runSuite(suiteId) {
  try {
    await fetchJson(`/api/tests/run?suite=${encodeURIComponent(suiteId)}`, { method: 'POST' })
  } catch (err) {
    $('#tests-results').innerHTML = `<p class="muted empty">Could not start ${esc(suiteId)}: ${esc(err.message)}</p>`
    return
  }
  await refreshTests()
  pollTests()
}

let testsPollTimer = null
function pollTests() {
  clearTimeout(testsPollTimer)
  testsPollTimer = setTimeout(async () => {
    await refreshTests()
    const anyRunning = Object.values(state.tests?.runs || {}).some(r => r.status === 'running')
    if (anyRunning) pollTests()
  }, 1000)
}

function renderTests() {
  const data = state.tests
  if (!data) return
  const rows = data.suites.map(s => {
    const run = data.runs[s.id] || { status: 'idle' }
    const counts = run.total ? `${run.passed}/${run.total}` : '—'
    const secs = run.startedAt && run.finishedAt
      ? `${((new Date(run.finishedAt) - new Date(run.startedAt)) / 1000).toFixed(1)}s`
      : '—'
    const when = run.finishedAt ? relTime(run.finishedAt) : ''
    // 'error' means the tooling broke, not that a test failed — shown with its
    // own badge so a red row never conflates the two.
    return `<tr>
      <td><span class="result-badge result-${run.status === 'pass' ? 'pass' : run.status === 'fail' ? 'fail' : run.status === 'error' ? 'warn' : 'skip'}">${esc(RUN_LABEL[run.status] || run.status)}</span></td>
      <td>${esc(s.label)}</td>
      <td class="num">${esc(counts)}</td>
      <td class="num">${esc(secs)}</td>
      <td>${esc(when)}${run.stale ? ' <span class="muted">(previous session)</span>' : ''}</td>
      <td class="mono">${run.sha ? esc(run.sha) + (run.dirty ? ' <span class="warn">+dirty</span>' : '') : '—'}</td>
      <td>${esc(run.note || '')}</td>
    </tr>`
  })

  const failures = data.suites.flatMap(s => (data.runs[s.id]?.failures || []).map(f => ({ suite: s.label, ...f })))

  $('#tests-results').innerHTML = `
    <div class="data-table-wrap">
      <table class="data">
        <thead><tr><th>Result</th><th>Suite</th><th>Passed</th><th>Time</th><th>When</th><th>Commit</th><th>Note</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>
    ${failures.length ? `<div class="data-table-wrap"><table class="data">
      <thead><tr><th>Suite</th><th>Failing test</th><th>Message</th></tr></thead>
      <tbody>${failures.map(f => `<tr><td>${esc(f.suite)}</td><td>${esc(f.name)}</td><td class="mono">${esc(f.message)}</td></tr>`).join('')}</tbody>
    </table></div>` : ''}`
}

async function refreshTests() {
  try {
    state.tests = await fetchJson('/api/tests')
  } catch {
    return
  }
  renderTestsActions()
  renderTests()
}
```

- [ ] **Step 3: Wire it into init**

In `async function init()` (near the end of `app.js`), make two edits.

Add `refreshTests()` to the `#refresh-now` click handler:

```js
  $('#refresh-now').addEventListener('click', () => {
    refreshOverview()
    refreshErrors()
    refreshExternal()
    refreshTests()
  })
```

And add it to the initial `Promise.all`:

```js
  await Promise.all([refreshOverview(), refreshErrors(), refreshExternal(), refreshTests()])
```

Do **not** add a `setInterval` for tests. The other sections poll on a timer because they watch external state that changes on its own; test results only change when someone clicks a button, and `pollTests()` already covers the in-flight case. A background timer would just re-render an unchanging table.

- [ ] **Step 4: Add the styles**

Append to `tools/dev-portal/public/styles.css`:

```css
/* Tests card reuses .result-badge / .data from the endpoint sweep; only the
   action row needs to wrap once four buttons are present. */
#tests-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
```

- [ ] **Step 5: Verify the card works end to end in the browser**

With both `npm run dev` and `npm run portal` running, open `http://localhost:4321`.

Confirm:
1. A **Tests** card appears with four buttons: Run Unit, Run Smoke, Run E2E (quick), Run E2E (full).
2. Clicking **Run Smoke** shows `running…`, then settles to `pass` with counts within a few seconds, without a page reload.
3. While a suite runs, all four buttons are disabled.
4. Reloading the page mid-run still shows `running…` — the state lives on the server.
5. Clicking **Run Unit** settles to `pass 412/412` (or the current count).
6. The **Commit** column shows the short SHA the run was made against. Because this repo permanently carries untracked screenshots and notes, confirm it does **not** say `+dirty` on a tree whose only changes are untracked — then `touch` a tracked file (e.g. append a blank line to `src/lib/dates.ts`), re-run Smoke, and confirm `+dirty` appears. Revert the file.

- [ ] **Step 6: Verify a failure surfaces its test name and message**

Temporarily break one unit test — in `src/lib/sessions/export-csv.test.ts`, change the `toHaveLength(3)` assertion to `toHaveLength(99)`.

Click **Run Unit**. Expected: the row shows `FAIL`, and the failures table below names the test and its message. Then revert the test file and re-run to confirm it returns to `pass`.

- [ ] **Step 7: Verify tooling breakage reads as `error`, not `fail`**

Temporarily change `SUITES.unit.args` in `tools/dev-portal/lib/tests.mjs` to `['vitest', 'run', '--reporter=this-reporter-does-not-exist']`. Restart the portal, click **Run Unit**.

Expected: the row shows `ERROR` (not `FAIL`), with a stderr tail in the Note column. Revert the args and restart.

- [ ] **Step 8: Document the section**

In `tools/dev-portal/README.md`, add to the **What it shows** bullet list, after the "Endpoint sweep" bullet:

```markdown
- **Tests** — four suites run on demand: unit (`vitest`), smoke (functional checks via the dev-only `/api/dev/smoke/` route), e2e-quick (`@smoke`-tagged Playwright tests), and e2e-full (all 44, serial). Results show counts, duration, and per-failure test names. A restored result from a previous portal session is marked `(previous session)`. **`ERROR` is distinct from `FAIL`**: `FAIL` means a test failed, `ERROR` means the tooling broke (runner missing, unparseable reporter output, timeout).
- **Smoke checks** — assert on artifacts rather than config: an invoice PDF that really renders (`%PDF-` plus a size floor, since a truncated file still has the magic header), the sessions and tax-summary CSVs really producing rows, and Resend and Anthropic really accepting a call. The vendor probes are why this exists: a present credential that no longer works reports healthy to every presence check in the app. Resend's probe targets its `delivered@resend.dev` simulator and the Anthropic probe is one token, so running it is safe and effectively free.
```

- [ ] **Step 9: Full verification**

Run: `npm run test -- --run 2>&1 | tail -5`
Expected: all test files pass; total is the previous count plus the new tests from Tasks 1, 2, and 4.

Run: `npx tsc --noEmit`
Expected: no output.

Run: `npm run lint 2>&1 | tail -3`
Expected: `0 errors`.

- [ ] **Step 10: Commit**

```bash
git add tools/dev-portal/public/index.html tools/dev-portal/public/app.js tools/dev-portal/public/styles.css tools/dev-portal/README.md
git commit -m "feat(portal): Tests card with four suites and per-failure detail

Follows the endpoint-sweep pattern: an actions row plus a results table,
fetched from the portal server and re-rendered on a 1s poll while anything is
running. Run state lives server-side, so reloading mid-run resumes showing
progress instead of losing it.

A failing suite lists the failing test names and first-line messages, because
a bare count tells you something broke without telling you what. ERROR gets a
different badge from FAIL so tooling breakage never trains you to ignore red."
```

---

## Verification Checklist

Run after all tasks:

- [ ] `npm run test -- --run` — all unit tests pass
- [ ] `npx tsc --noEmit` — clean
- [ ] `npm run lint` — 0 errors
- [ ] `npm run build` — succeeds (proves the dev route doesn't break a production build)
- [ ] `curl -s http://localhost:3000/api/dev/smoke/` — five checks, no `fail`
- [ ] Portal Tests card: each of the four buttons runs and settles
- [ ] Results show the commit SHA; `+dirty` appears only for tracked changes, not untracked files
- [ ] `configured` ⇒ `works` holds: an unset key reports `skip`, a present-but-broken key reports `fail` — never a silent pass
- [ ] Breaking PDF generation turns `smoke` red; reverting turns it green
- [ ] Breaking `EMAIL_FROM_DOMAIN` turns `smoke` red
- [ ] Breaking `HELP_AI_MODEL` turns `smoke` red
- [ ] A bad reporter flag reads as `ERROR`, not `FAIL`

## Known Gaps (deliberate — from the spec)

- **No scheduled alerting.** These checks run only when someone opens the portal and clicks. An overnight outage stays invisible until then. Auto-reload in the Anthropic Console is the prevention mechanism for the credit case. Revisit first if a dependency failure ever reaches a user before it reaches you.
- **Payroll XLSX exports are not smoke-covered.** They are built client-side with ExcelJS in `payroll-hub-table.tsx` and `contractor-payments-table.tsx`, so they cannot run in-process. Their download path is covered by `src/lib/download.test.ts` and the e2e suite.
- **`csvCell` is duplicated** between `src/lib/sessions/export-csv.ts` and `src/lib/payroll/annual-summary.ts`. Left alone deliberately — merging them is unrelated refactoring that would widen this change's blast radius.
- **The smoke suite verifies generation logic, not the HTTP + auth + client-download chain.** That chain is the e2e suite's job, including `tests/e2e/invoice-pdf-download.spec.ts`.
