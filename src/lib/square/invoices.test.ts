import { describe, it, expect, vi } from 'vitest'

// Avoid initializing the Square SDK on import.
vi.mock('./client', () => ({
  squareClient: {},
  getDefaultLocationId: async () => 'loc',
  dollarsToCents: (d: number) => Math.round(d * 100),
  isSquareSandbox: () => false,
}))

import { squareIdempotencyKeys } from './invoices'

describe('squareIdempotencyKeys (regression for #10 — duplicate Square invoices on retry)', () => {
  it('is deterministic for the same invoice id', () => {
    expect(squareIdempotencyKeys('inv-123')).toEqual(squareIdempotencyKeys('inv-123'))
  })

  it('produces a distinct key per Square operation', () => {
    const k = squareIdempotencyKeys('inv-123')
    expect(new Set([k.order, k.invoice, k.publish]).size).toBe(3)
  })

  it('differs across invoices', () => {
    expect(squareIdempotencyKeys('a').order).not.toBe(squareIdempotencyKeys('b').order)
  })

  it("stays within Square's 45-char key limit for UUID bases", () => {
    const k = squareIdempotencyKeys('550e8400-e29b-41d4-a716-446655440000') // 36-char UUID
    expect(k.order.length).toBeLessThanOrEqual(45)
    expect(k.invoice.length).toBeLessThanOrEqual(45)
    expect(k.publish.length).toBeLessThanOrEqual(45)
  })
})
