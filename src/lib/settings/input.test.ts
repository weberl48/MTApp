import { describe, it, expect } from 'vitest'
import { parseSettingNumber, resolveDurationOptions } from './input'

describe('parseSettingNumber (regression for #34 — $0 no-show fee impossible)', () => {
  it('returns 0 for "0" instead of coercing to the fallback', () => {
    expect(parseSettingNumber('0', 60)).toBe(0)
  })

  it('returns the parsed number', () => {
    expect(parseSettingNumber('75', 60)).toBe(75)
    expect(parseSettingNumber('2.5', 0)).toBe(2.5)
  })

  it('returns the fallback for empty or non-numeric input', () => {
    expect(parseSettingNumber('', 60)).toBe(60)
    expect(parseSettingNumber('   ', 60)).toBe(60)
    expect(parseSettingNumber('abc', 60)).toBe(60)
  })
})

describe('resolveDurationOptions (regression for #35 — empty options brick the dropdown)', () => {
  it('returns the configured options when present', () => {
    expect(resolveDurationOptions([30, 60])).toEqual([30, 60])
  })

  it('falls back to defaults for an empty array (never zero options)', () => {
    expect(resolveDurationOptions([])).toEqual([30, 45, 60, 90])
  })

  it('falls back to defaults for null/undefined', () => {
    expect(resolveDurationOptions(null)).toEqual([30, 45, 60, 90])
    expect(resolveDurationOptions(undefined)).toEqual([30, 45, 60, 90])
  })
})
