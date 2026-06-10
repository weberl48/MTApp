import { describe, it, expect } from 'vitest'
import { monthBoundaries, formatMonthlyBreakdown } from './buckets'

type Entry = [string, { earnings: number; sessions: number }]

describe('monthBoundaries (regression for #17 — 1st-of-month double-count)', () => {
  it('produces non-overlapping local-calendar ranges', () => {
    const b = monthBoundaries(new Date(2026, 5, 15)) // June 15 2026 local
    expect(b.monthStart).toBe('2026-06-01')
    expect(b.monthEnd).toBe('2026-06-30')
    expect(b.lastMonthStart).toBe('2026-05-01')
    expect(b.lastMonthEnd).toBe('2026-05-31')
    expect(b.yearStart).toBe('2026-01-01')
    // the 1st of THIS month must not fall within last month's range
    expect('2026-06-01' >= b.lastMonthStart && '2026-06-01' <= b.lastMonthEnd).toBe(false)
  })

  it('keeps end-of-month local even late in the evening (no UTC roll-over)', () => {
    const b = monthBoundaries(new Date(2026, 5, 30, 23, 30)) // June 30 11:30pm local
    expect(b.monthEnd).toBe('2026-06-30') // not 2026-07-01
    expect(b.lastMonthEnd).toBe('2026-05-31')
  })
})

describe('formatMonthlyBreakdown (regression for #17 — month sort + labels)', () => {
  it('sorts by YYYY-MM key (chronological), not by the alphabetical label', () => {
    const out = formatMonthlyBreakdown([
      ['2026-05', { earnings: 1, sessions: 1 }],
      ['2026-06', { earnings: 2, sessions: 2 }],
      ['2025-12', { earnings: 3, sessions: 3 }],
    ])
    expect(out.map((m) => m.month)).toEqual(['June 2026', 'May 2026', 'December 2025'])
  })

  it('labels each month from its key with no UTC month shift', () => {
    const out = formatMonthlyBreakdown([['2026-06', { earnings: 0, sessions: 0 }]])
    expect(out[0].month).toBe('June 2026')
  })

  it('keeps only the latest N months by key', () => {
    const entries: Entry[] = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'].map(
      (m) => [m, { earnings: 0, sessions: 0 }]
    )
    const out = formatMonthlyBreakdown(entries, 6)
    expect(out).toHaveLength(6)
    expect(out[0].month).toBe('July 2026') // latest
    expect(out[5].month).toBe('February 2026') // Jan dropped
  })
})
