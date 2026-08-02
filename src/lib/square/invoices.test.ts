import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockIsSquareSandbox, mockGetPilotSquareRecipient } = vi.hoisted(() => ({
  mockIsSquareSandbox: vi.fn(() => false),
  mockGetPilotSquareRecipient: vi.fn((): string | null => null),
}))

// Avoid initializing the Square SDK on import.
vi.mock('./client', () => ({
  squareClient: {},
  getDefaultLocationId: async () => 'loc',
  dollarsToCents: (d: number) => Math.round(d * 100),
  isSquareSandbox: mockIsSquareSandbox,
}))

// Avoid pulling in the real pilot module's env-var parsing.
vi.mock('../email/pilot', () => ({
  getPilotSquareRecipient: mockGetPilotSquareRecipient,
}))

import { squareIdempotencyKeys, buildSquareProcessingFee, resolveSquareRecipient, DEV_EMAIL } from './invoices'

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

describe('resolveSquareRecipient (pilot-mode + sandbox redirect for Square-sent invoice mail)', () => {
  beforeEach(() => {
    mockIsSquareSandbox.mockReset().mockReturnValue(false)
    mockGetPilotSquareRecipient.mockReset().mockReturnValue(null)
  })

  it('passes through the real client when neither sandbox nor pilot mode is active', () => {
    expect(resolveSquareRecipient('client@example.com', 'Jane Client')).toEqual({
      email: 'client@example.com',
      name: 'Jane Client',
      redirectReason: null,
    })
  })

  it('redirects to DEV_EMAIL with a [TEST] prefix when sandbox is active', () => {
    mockIsSquareSandbox.mockReturnValue(true)
    expect(resolveSquareRecipient('client@example.com', 'Jane Client')).toEqual({
      email: DEV_EMAIL,
      name: '[TEST] Jane Client',
      redirectReason: 'sandbox',
    })
  })

  it('redirects to the pilot recipient with a [PILOT] prefix when only pilot mode is active', () => {
    mockGetPilotSquareRecipient.mockReturnValue('tester@example.com')
    expect(resolveSquareRecipient('client@example.com', 'Jane Client')).toEqual({
      email: 'tester@example.com',
      name: '[PILOT] Jane Client',
      redirectReason: 'pilot',
    })
  })

  it('sandbox wins when both sandbox and pilot mode are active', () => {
    mockIsSquareSandbox.mockReturnValue(true)
    mockGetPilotSquareRecipient.mockReturnValue('tester@example.com')
    expect(resolveSquareRecipient('client@example.com', 'Jane Client')).toEqual({
      email: DEV_EMAIL,
      name: '[TEST] Jane Client',
      redirectReason: 'sandbox',
    })
  })
})
