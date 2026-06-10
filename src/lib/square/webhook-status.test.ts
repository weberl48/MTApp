import { describe, it, expect } from 'vitest'
import { resolveSquareWebhookStatus } from './webhook-status'

describe('resolveSquareWebhookStatus (regression for #31 — webhook regressed paid invoices)', () => {
  it('marks paid (with a paid date) on PAID', () => {
    expect(resolveSquareWebhookStatus('sent', 'PAID')).toEqual({ status: 'paid', setPaidDate: true })
  })

  it('does NOT un-pay an already-paid invoice', () => {
    expect(resolveSquareWebhookStatus('paid', 'UNPAID')).toBeNull()
    expect(resolveSquareWebhookStatus('paid', 'SCHEDULED')).toBeNull()
    expect(resolveSquareWebhookStatus('paid', 'CANCELED')).toBeNull()
    expect(resolveSquareWebhookStatus('paid', 'DRAFT')).toBeNull()
  })

  it('a repeated PAID event stays paid', () => {
    expect(resolveSquareWebhookStatus('paid', 'PAID')).toEqual({ status: 'paid', setPaidDate: true })
  })

  it('maps UNPAID/SCHEDULED→sent and CANCELED/DRAFT→pending for not-yet-paid invoices', () => {
    expect(resolveSquareWebhookStatus('pending', 'UNPAID')).toEqual({ status: 'sent', setPaidDate: false })
    expect(resolveSquareWebhookStatus('sent', 'SCHEDULED')).toEqual({ status: 'sent', setPaidDate: false })
    expect(resolveSquareWebhookStatus('sent', 'CANCELED')).toEqual({ status: 'pending', setPaidDate: false })
  })

  it('returns null for unknown/missing Square statuses', () => {
    expect(resolveSquareWebhookStatus('sent', 'WEIRD')).toBeNull()
    expect(resolveSquareWebhookStatus('sent', undefined)).toBeNull()
    expect(resolveSquareWebhookStatus('sent', null)).toBeNull()
  })
})
