import { describe, it, expect } from 'vitest'
import { sessionDisplayTotal } from './total'

describe('sessionDisplayTotal', () => {
  it('prefers the stored snapshot over the attendee sum', () => {
    expect(
      sessionDisplayTotal({
        total_amount: 75,
        attendees: [{ individual_cost: 10 }, { individual_cost: 10 }],
      })
    ).toBe(75)
  })

  it('preserves a stored total of 0 (a real number, not a missing one)', () => {
    expect(sessionDisplayTotal({ total_amount: 0, attendees: [{ individual_cost: 40 }] })).toBe(0)
  })

  it('sums attendee costs when the snapshot is null', () => {
    expect(
      sessionDisplayTotal({
        total_amount: null,
        attendees: [{ individual_cost: 30 }, { individual_cost: 22.5 }],
      })
    ).toBe(52.5)
  })

  it('treats a null individual_cost as 0 within the sum', () => {
    expect(
      sessionDisplayTotal({
        total_amount: null,
        attendees: [{ individual_cost: 30 }, { individual_cost: null }],
      })
    ).toBe(30)
  })

  it('returns null when there is no snapshot and no attendee rows', () => {
    // A pre-migration group session: the old `?? 0` fallback rendered this as "$0.00".
    expect(sessionDisplayTotal({ total_amount: null, attendees: [] })).toBeNull()
    expect(sessionDisplayTotal({ total_amount: null })).toBeNull()
    expect(sessionDisplayTotal({ total_amount: null, attendees: null })).toBeNull()
    expect(sessionDisplayTotal({})).toBeNull()
  })
})
