import { describe, it, expect, vi, afterEach } from 'vitest'
import { todayLocal, parseLocalDate } from './dates'

afterEach(() => {
  vi.useRealTimers()
})

describe('todayLocal (regression for #14 — quick-log dated tomorrow in the evening)', () => {
  it('returns the LOCAL calendar date late in the evening', () => {
    // 2026-06-10 23:30 in local time. `new Date().toISOString()` would already read
    // 2026-06-11 for any timezone behind UTC — todayLocal must still return the 10th.
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 10, 23, 30, 0))
    expect(todayLocal()).toBe('2026-06-10')
  })

  it('zero-pads single-digit month and day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 5, 9, 0, 0))
    expect(todayLocal()).toBe('2026-01-05')
  })
})

describe('parseLocalDate', () => {
  it('parses a date-only string at local midnight (no UTC day-shift)', () => {
    const d = parseLocalDate('2026-03-05')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(2) // March, 0-indexed
    expect(d.getDate()).toBe(5)
  })
})
