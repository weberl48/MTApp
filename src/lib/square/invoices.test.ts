import { describe, it, expect, vi } from 'vitest'

// Avoid initializing the Square SDK on import.
vi.mock('./client', () => ({
  squareClient: {},
  getDefaultLocationId: async () => 'loc',
  dollarsToCents: (d: number) => Math.round(d * 100),
  isSquareSandbox: () => false,
}))

import { squareIdempotencyKeys, buildSquareProcessingFee } from './invoices'

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

describe('buildSquareProcessingFee per-invoice override', () => {
  const percentFee = {
    square_processing_fee_enabled: false,
    square_processing_fee_type: 'percentage',
    square_processing_fee_percentage: 3,
    square_processing_fee_fixed_cents: 0,
  }
  const orgEnabledFee = { ...percentFee, square_processing_fee_enabled: true }

  it('follows the org toggle when the override is null/undefined', () => {
    expect(buildSquareProcessingFee(percentFee, 100, null)).toBeUndefined()
    expect(buildSquareProcessingFee(percentFee, 100, undefined)).toBeUndefined()
    expect(buildSquareProcessingFee(orgEnabledFee, 100, null)).toEqual({
      name: 'Online Processing Fee', type: 'PERCENTAGE', percentage: '3',
    })
  })

  it('override=true charges the configured fee even when the org toggle is off (per-client opt-in)', () => {
    expect(buildSquareProcessingFee(percentFee, 100, true)).toEqual({
      name: 'Online Processing Fee', type: 'PERCENTAGE', percentage: '3',
    })
  })

  it('override=false removes the fee even when the org toggle is on (per-invoice removal)', () => {
    expect(buildSquareProcessingFee(orgEnabledFee, 100, false)).toBeUndefined()
  })

  it('override=true with no fee configured still charges nothing', () => {
    expect(buildSquareProcessingFee(
      { square_processing_fee_enabled: false, square_processing_fee_type: 'percentage', square_processing_fee_percentage: 0 },
      100,
      true
    )).toBeUndefined()
  })
})
