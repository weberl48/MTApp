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

/** Round to cents at the aggregation boundary (mirrors src/lib/invoices/batch-totals.ts). */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

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
    totalPaid: round2(totalPaid),
    sessionCount: inYear.length,
    monthly: [...months.entries()]
      .sort(([a], [b]) => a - b)
      .map(([month, v]) => ({ month, label: MONTH_LABELS[month - 1], ...v, amount: round2(v.amount) })),
    byServiceType: [...services.entries()]
      .sort(([, a], [, b]) => b.amount - a.amount)
      .map(([name, v]) => ({ name, ...v, amount: round2(v.amount) })),
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
  return [...byId.values()]
    .map((entry) => ({ ...entry, totalPaid: round2(entry.totalPaid) }))
    .sort((a, b) => a.contractorName.localeCompare(b.contractorName))
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
    .sort((a, b) => {
      const byName = a.contractor_name.localeCompare(b.contractor_name)
      if (byName !== 0) return byName
      const aDate = a.contractor_paid_date ?? ''
      const bDate = b.contractor_paid_date ?? ''
      return aDate < bDate ? -1 : aDate > bDate ? 1 : 0
    })
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
