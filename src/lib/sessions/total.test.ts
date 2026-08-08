import { describe, it, expect } from 'vitest'
import { sessionDisplayTotal, sessionDisplayBreakdown } from './total'

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

describe('sessionDisplayBreakdown', () => {
  it('returns both stored figures', () => {
    expect(sessionDisplayBreakdown({ mca_cut: 17, contractor_pay: 133 })).toEqual({
      mcaCut: 17,
      contractorPay: 133,
    })
  })

  it('preserves a negative MCA cut', () => {
    // In-school sessions bill $0 against real contractor pay. Clamping or hiding this
    // would erase the one number on the row worth looking at.
    expect(sessionDisplayBreakdown({ mca_cut: -73, contractor_pay: 73 })).toEqual({
      mcaCut: -73,
      contractorPay: 73,
    })
  })

  it('preserves a zero cut (a real split, not a missing one)', () => {
    expect(sessionDisplayBreakdown({ mca_cut: 0, contractor_pay: 25 })).toEqual({
      mcaCut: 0,
      contractorPay: 25,
    })
  })

  it('keeps the half that exists when only one column is populated', () => {
    expect(sessionDisplayBreakdown({ mca_cut: null, contractor_pay: 41.5 })).toEqual({
      mcaCut: null,
      contractorPay: 41.5,
    })
    expect(sessionDisplayBreakdown({ mca_cut: 18.5, contractor_pay: null })).toEqual({
      mcaCut: 18.5,
      contractorPay: null,
    })
  })

  it('returns null when neither column is populated', () => {
    // Pre-migration rows: the caller drops the whole line rather than rendering "— · —".
    expect(sessionDisplayBreakdown({ mca_cut: null, contractor_pay: null })).toBeNull()
    expect(sessionDisplayBreakdown({})).toBeNull()
  })
})
