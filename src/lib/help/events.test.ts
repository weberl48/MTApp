import { describe, it, expect } from 'vitest'
import { normalizeQuery, createSearchMissGate } from './events'

describe('normalizeQuery', () => {
  it('trims, lowercases, collapses whitespace', () => {
    expect(normalizeQuery('  Why   NO Invoice ')).toBe('why no invoice')
  })
})

describe('createSearchMissGate', () => {
  it('allows a query once per session', () => {
    const gate = createSearchMissGate()
    expect(gate('billing')).toBe(true)
    expect(gate(' Billing ')).toBe(false)
    expect(gate('other')).toBe(true)
  })
})
