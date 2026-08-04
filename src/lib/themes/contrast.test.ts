import { describe, expect, it } from 'vitest'
import { contrastRatio, parseOklch } from './contrast'

describe('parseOklch', () => {
  it('parses lightness, chroma, hue', () => {
    expect(parseOklch('oklch(0.52 0.105 210)')).toEqual({ l: 0.52, c: 0.105, h: 210 })
  })

  it('parses alpha and zero-hue grays', () => {
    expect(parseOklch('oklch(1 0 0 / 10%)')).toEqual({ l: 1, c: 0, h: 0 })
  })

  it('returns null for non-oklch values', () => {
    expect(parseOklch('#ffffff')).toBeNull()
  })
})

describe('contrastRatio', () => {
  it('is ~21 for black on white', () => {
    expect(contrastRatio('oklch(0 0 0)', 'oklch(1 0 0)')).toBeGreaterThan(20)
  })

  it('is 1 for identical colors', () => {
    expect(contrastRatio('oklch(0.5 0.1 200)', 'oklch(0.5 0.1 200)')).toBeCloseTo(1, 1)
  })

  it('is symmetric', () => {
    const a = 'oklch(0.3 0.05 150)'
    const b = 'oklch(0.9 0.02 150)'
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 5)
  })
})
