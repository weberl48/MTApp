import { describe, it, expect } from 'vitest'
import { buildContractorRateMap } from './scholarship'

describe('buildContractorRateMap (regression for #4 — scholarship contractor pay)', () => {
  it('keys overrides by `contractor_id:service_type_id` (not the nonexistent user_id)', () => {
    const map = buildContractorRateMap([
      { contractor_id: 'c1', service_type_id: 's1', contractor_pay: 41.5, duration_increment: 13.5 },
    ])
    expect(map.get('c1:s1')).toEqual({ customContractorPay: 41.5, durationIncrement: 13.5 })
    // The lookup site uses `${contractor.id}:${serviceType.id}` — anything else never matches.
    expect([...map.keys()]).toEqual(['c1:s1'])
  })

  it('returns an empty map for null/empty input', () => {
    expect(buildContractorRateMap(null).size).toBe(0)
    expect(buildContractorRateMap(undefined).size).toBe(0)
    expect(buildContractorRateMap([]).size).toBe(0)
  })

  it('preserves a null duration_increment', () => {
    const map = buildContractorRateMap([
      { contractor_id: 'c2', service_type_id: 's2', contractor_pay: 50, duration_increment: null },
    ])
    expect(map.get('c2:s2')).toEqual({ customContractorPay: 50, durationIncrement: null })
  })
})
