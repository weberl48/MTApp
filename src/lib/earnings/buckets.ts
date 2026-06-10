import { format, startOfYear, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { parseLocalDate } from '@/lib/dates'

export interface MonthBoundaries {
  yearStart: string
  monthStart: string
  monthEnd: string
  lastMonthStart: string
  lastMonthEnd: string
}

/**
 * Local-calendar (YYYY-MM-DD) boundaries for the earnings buckets.
 *
 * The earnings page built these with `endOfMonth(now).toISOString().split('T')[0]`, which
 * converts the local end-of-month (23:59 local) to UTC — in the evening that rolls to the
 * 1st of the next month, so `lastMonthEnd` became the 1st of *this* month and a session
 * dated the 1st was counted in BOTH "this month" and "last month". Formatting with date-fns
 * `format` keeps everything in local time, so the ranges never overlap.
 */
export function monthBoundaries(now: Date): MonthBoundaries {
  return {
    yearStart: format(startOfYear(now), 'yyyy-MM-dd'),
    monthStart: format(startOfMonth(now), 'yyyy-MM-dd'),
    monthEnd: format(endOfMonth(now), 'yyyy-MM-dd'),
    lastMonthStart: format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
    lastMonthEnd: format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
  }
}

/**
 * Sort monthly-earnings entries by their `YYYY-MM` key (chronological) and label them.
 *
 * The page sorted by the formatted label string ("May 2026" vs "June 2026"), which is
 * alphabetical, not chronological, and sliced the last 6 *after* mislabelling — so the wrong
 * months could be shown. Sort by the raw key first, then format the label with parseLocalDate
 * (avoiding the `new Date('YYYY-MM-01')` UTC month shift).
 */
export function formatMonthlyBreakdown(
  entries: Array<[string, { earnings: number; sessions: number }]>,
  limit = 6
): Array<{ month: string; earnings: number; sessions: number }> {
  return entries
    .slice()
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, limit)
    .map(([month, data]) => ({
      month: format(parseLocalDate(month + '-01'), 'MMMM yyyy'),
      earnings: data.earnings,
      sessions: data.sessions,
    }))
}
