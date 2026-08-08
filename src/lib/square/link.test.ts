import { describe, it, expect } from 'vitest'
import {
  squareInvoiceToCandidate,
  sortCandidates,
  linkStatusUpdate,
  squareStatusLabel,
  NON_LINKABLE_SQUARE_STATUSES,
  type SquareInvoiceCandidate,
} from './link'

function candidate(overrides: Partial<SquareInvoiceCandidate> = {}): SquareInvoiceCandidate {
  return {
    id: 'sq-1',
    invoiceNumber: 'INV-001',
    title: 'Music Therapy Services',
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    customerId: 'CUST-1',
    amount: 60,
    status: 'UNPAID',
    createdAt: '2026-08-01T10:00:00Z',
    publicUrl: 'https://squareup.com/pay/sq-1',
    suggested: false,
    ...overrides,
  }
}

describe('squareInvoiceToCandidate', () => {
  it('maps a full Square invoice, converting bigint cents to dollars', () => {
    const result = squareInvoiceToCandidate({
      id: 'sq-abc',
      invoiceNumber: '000042',
      title: 'Music Therapy Services',
      status: 'UNPAID',
      createdAt: '2026-08-05T12:00:00Z',
      publicUrl: 'https://squareup.com/pay/abc',
      primaryRecipient: {
        customerId: 'CUST-9',
        givenName: 'Jane',
        familyName: 'Doe',
        emailAddress: 'jane@example.com',
      },
      paymentRequests: [{ computedAmountMoney: { amount: BigInt(6150) } }],
    })

    expect(result).toEqual({
      id: 'sq-abc',
      invoiceNumber: '000042',
      title: 'Music Therapy Services',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      customerId: 'CUST-9',
      amount: 61.5,
      status: 'UNPAID',
      createdAt: '2026-08-05T12:00:00Z',
      publicUrl: 'https://squareup.com/pay/abc',
      suggested: false,
    })
  })

  it('returns null when the invoice has no id', () => {
    expect(squareInvoiceToCandidate({ status: 'UNPAID' })).toBeNull()
  })

  it('tolerates missing recipient and payment requests', () => {
    const result = squareInvoiceToCandidate({ id: 'sq-min' })
    expect(result).toMatchObject({
      id: 'sq-min',
      customerName: null,
      customerEmail: null,
      customerId: null,
      amount: null,
      status: 'UNKNOWN',
    })
  })

  it('falls back to companyName when there is no person name', () => {
    const result = squareInvoiceToCandidate({
      id: 'sq-co',
      primaryRecipient: { companyName: 'People Inc' },
    })
    expect(result?.customerName).toBe('People Inc')
  })

  it('sums multiple payment requests', () => {
    const result = squareInvoiceToCandidate({
      id: 'sq-multi',
      paymentRequests: [
        { computedAmountMoney: { amount: BigInt(3000) } },
        { computedAmountMoney: { amount: BigInt(3000) } },
      ],
    })
    expect(result?.amount).toBe(60)
  })
})

describe('sortCandidates', () => {
  it('flags exact amount matches as suggested and sorts them first', () => {
    const sorted = sortCandidates(
      [
        candidate({ id: 'a', amount: 120, createdAt: '2026-08-06T00:00:00Z' }),
        candidate({ id: 'b', amount: 60, createdAt: '2026-08-01T00:00:00Z' }),
      ],
      { amount: 60, squareCustomerId: null }
    )
    expect(sorted.map((c) => c.id)).toEqual(['b', 'a'])
    expect(sorted[0].suggested).toBe(true)
    expect(sorted[1].suggested).toBe(false)
  })

  it('compares amounts in cents so floating point does not break matches', () => {
    const sorted = sortCandidates(
      [candidate({ id: 'a', amount: 0.1 + 0.2 })],
      { amount: 0.3, squareCustomerId: null }
    )
    expect(sorted[0].suggested).toBe(true)
  })

  it('flags candidates whose Square customer matches the client', () => {
    const sorted = sortCandidates(
      [
        candidate({ id: 'a', amount: 999, customerId: 'CUST-match' }),
        candidate({ id: 'b', amount: 999, customerId: 'CUST-other' }),
      ],
      { amount: 60, squareCustomerId: 'CUST-match' }
    )
    expect(sorted[0].id).toBe('a')
    expect(sorted[0].suggested).toBe(true)
    expect(sorted[1].suggested).toBe(false)
  })

  it('never treats a missing client customer id as a match', () => {
    const sorted = sortCandidates(
      [candidate({ id: 'a', amount: 999, customerId: null })],
      { amount: 60, squareCustomerId: null }
    )
    expect(sorted[0].suggested).toBe(false)
  })

  it('orders newest first within each group', () => {
    const sorted = sortCandidates(
      [
        candidate({ id: 'old', amount: 999, createdAt: '2026-07-01T00:00:00Z' }),
        candidate({ id: 'new', amount: 999, createdAt: '2026-08-01T00:00:00Z' }),
        candidate({ id: 'undated', amount: 999, createdAt: null }),
      ],
      { amount: 60, squareCustomerId: null }
    )
    expect(sorted.map((c) => c.id)).toEqual(['new', 'old', 'undated'])
  })
})

describe('linkStatusUpdate', () => {
  it('adopts paid (with paid date) when the Square invoice is PAID', () => {
    expect(linkStatusUpdate('pending', 'PAID')).toEqual({ status: 'paid', setPaidDate: true })
    expect(linkStatusUpdate('sent', 'PAID')).toEqual({ status: 'paid', setPaidDate: true })
  })

  it('adopts sent when the Square invoice is UNPAID or SCHEDULED', () => {
    expect(linkStatusUpdate('pending', 'UNPAID')).toEqual({ status: 'sent', setPaidDate: false })
    expect(linkStatusUpdate('pending', 'SCHEDULED')).toEqual({ status: 'sent', setPaidDate: false })
  })

  it('never regresses the local status (unlike a raw webhook mapping)', () => {
    // Locally sent (e.g. emailed earlier); linking a DRAFT must not go back to pending.
    expect(linkStatusUpdate('sent', 'DRAFT')).toBeNull()
    expect(linkStatusUpdate('paid', 'UNPAID')).toBeNull()
    expect(linkStatusUpdate('paid', 'DRAFT')).toBeNull()
  })

  it('returns null when nothing would change', () => {
    expect(linkStatusUpdate('pending', 'DRAFT')).toBeNull()
    expect(linkStatusUpdate('sent', 'UNPAID')).toBeNull()
    expect(linkStatusUpdate('paid', 'PAID')).toBeNull()
  })

  it('returns null for unknown Square statuses', () => {
    expect(linkStatusUpdate('pending', 'PARTIALLY_PAID')).toBeNull()
    expect(linkStatusUpdate('pending', undefined)).toBeNull()
  })
})

describe('squareStatusLabel', () => {
  it('humanizes known Square statuses and passes unknown ones through', () => {
    expect(squareStatusLabel('DRAFT')).toBe('Draft')
    expect(squareStatusLabel('PARTIALLY_PAID')).toBe('Partially paid')
    expect(squareStatusLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW')
  })
})

describe('NON_LINKABLE_SQUARE_STATUSES', () => {
  it('excludes canceled and failed Square invoices', () => {
    expect(NON_LINKABLE_SQUARE_STATUSES.has('CANCELED')).toBe(true)
    expect(NON_LINKABLE_SQUARE_STATUSES.has('FAILED')).toBe(true)
    expect(NON_LINKABLE_SQUARE_STATUSES.has('UNPAID')).toBe(false)
  })
})
