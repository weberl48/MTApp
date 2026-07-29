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
