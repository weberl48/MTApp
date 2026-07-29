# Contractor Tax Summaries — Design

**Date:** 2026-07-28
**Status:** Approved by owner (brainstorming session)

## Problem

Payroll Hub snapshots what each contractor was paid (`contractor_paid_amount`,
`contractor_paid_date` on `sessions`), but there is no way to get annual totals
out of the app. At tax time the owner needs per-contractor calendar-year totals
for 1099-NEC filing, and contractors need their own earnings summary. Today
both are assembled by hand.

## Goals

- Owner/admin: per-contractor annual paid totals for a chosen tax year, plus
  CSV exports suitable for a bookkeeper (summary) and for records (detail).
- Contractor: a self-service downloadable annual earnings summary PDF.
- Zero PHI in any output. No schema changes.

## Non-goals (YAGNI)

- Generating actual 1099 forms or anything visually imitating an IRS form.
- QuickBooks/accounting API integration (CSV is the interchange format).
- W-9 / TIN tracking.
- Rollup/materialized tables — data volumes are small; aggregate on demand.

## Definitions

- **Cash basis:** a session counts toward tax year `Y` iff
  `contractor_paid_date` is within `Y-01-01`..`Y-12-31`. Date-only strings are
  compared as strings (same local-date discipline as `isInvoiceOverdue()` in
  `src/lib/invoices/overdue.ts`) — never parsed through `Date`/UTC.
- **Amount:** `contractor_paid_amount` (snapshot written by
  `mark_sessions_paid`). Fallback for legacy rows paid before snapshotting:
  `contractor_pay`. Rows with a paid date but both amounts null count as $0.
- **Inclusion:** any session with a qualifying `contractor_paid_date`,
  regardless of current status. Contractors with zero paid sessions in the
  year are omitted from tables/CSVs. Departed contractors still appear (they
  still receive 1099s).

## Components

### 1. Lib module — `src/lib/payroll/annual-summary.ts` (+ colocated test)

Pure functions, no I/O:

- `taxYearRange(year: number): { start: string; end: string }` — date-only
  string bounds.
- `isPaidInYear(paidDate: string | null, year: number): boolean` — string
  comparison against the range.
- `paidAmountForSession(s): number` — snapshot → `contractor_pay` fallback → 0.
- `summarizeContractorYear(sessions): AnnualSummary` — total, session count,
  12 per-month buckets (bucketed by `contractor_paid_date` month, string
  slice, not Date math), per-service-type totals.
- `availableTaxYears(paidDates: (string | null)[]): number[]` — distinct years
  with data, descending; always includes the current year.

Unit tests cover: Dec 31/Jan 1 boundary dates, null-amount fallback chain,
month bucketing, empty input.

### 2. Owner UI — Payroll Hub (`/payments`)

New "Tax Summaries" section:

- Year picker (from `availableTaxYears`, defaults to current year).
- Table: contractor name, sessions paid, total paid; grand-total footer.
- "Download summary CSV" — one row per contractor:
  `Contractor, Sessions Paid, Total Paid, Tax Year`.
- "Download detail CSV" — one row per paid session:
  `Contractor, Paid Date, Session Date, Service Type, Duration (min), Amount`.
- Visibility: existing `payments:view` permission (same as the rest of the
  page). No new permission.

### 3. Contractor UI — Earnings page (`/earnings`)

New "Annual Summary" card:

- Year selector, total paid + session count for that year, "Download PDF".
- Uses the page's existing effective-contractor-ID logic
  (`viewAsContractor?.id || user?.id`) so owner "View As" works.

### 4. API routes

Both follow the `/api/sessions/export` route pattern (auth → profile →
`can()` → org-scoped query). Year is validated with a zod schema
(integer, 2000–2100) added to `src/lib/validation/schemas.ts`.

- `GET /api/payroll/tax-summary?year=YYYY&detail=0|1`
  - Requires `payments:view`. Org-scoped.
  - Returns summary CSV (default) or detail CSV (`detail=1`).
  - Selects only: contractor id/name (join `users`), `contractor_paid_date`,
    `contractor_paid_amount`, `contractor_pay`, `date`, `duration_minutes`,
    service type name. No notes, no client joins.
- `GET /api/payroll/annual-summary/pdf?year=YYYY&contractorId=<uuid>`
  - Contractor role: always own data; `contractorId` param ignored.
  - Admin/owner (`payments:view`): any contractor in their org.
  - Developer: any org (consistent with existing routes).
  - Renders via `renderToBuffer` like `/api/invoices/[id]/pdf`; supports
    `?inline=1` for in-browser preview; attachment filename
    `earnings-summary-<year>-<name-slug>.pdf`.

### 5. PDF — `src/components/pdf/annual-earnings-pdf.tsx`

Content: organization name, contractor name, tax year, total paid, session
count, monthly breakdown table, per-service-type breakdown table, generated-on
date. Prominent disclaimer:

> Informal earnings summary — not an official tax document (not a 1099).
> Reflects payments recorded in this system during calendar year YYYY.

No client names, no session notes → zero PHI by construction. Plain document
styling; must not resemble an IRS form.

### 6. Error handling

- Invalid/missing year → 400.
- Contractor requesting another contractor's PDF → served their own (param
  ignored), never 403-leaks other IDs.
- Admin requesting a contractor outside their org → 404 (row simply not found
  under org scope).
- Year with no data → owner table shows empty state; PDF still renders with
  $0 totals (a contractor may legitimately want a "nothing paid" record);
  CSVs return headers only.

### 7. Docs

Per CLAUDE.md: update help articles — payroll/payments article (Tax Summaries
section: what cash basis means, where the CSVs are) and the contractor
earnings article (Annual Summary card + PDF download).

## Testing

- Unit: `annual-summary.test.ts` as above; zod year schema test alongside
  existing schema tests.
- Route behavior follows existing patterns already covered by colocated
  lib tests; manual verification of both downloads and the PDF via dev server.
- E2E (optional, if `TEST_USER_PASSWORD` available): payments page shows the
  Tax Summaries section for admin.

## Open questions

None — approach, audience (both owner and contractor), and cash-basis
definition confirmed with owner 2026-07-28.
