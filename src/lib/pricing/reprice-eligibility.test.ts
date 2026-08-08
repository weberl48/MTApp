import { describe, it, expect } from 'vitest'
import {
  repriceEligibility,
  REPRICEABLE_SESSION_STATUSES,
  REPRICE_SKIP_LABELS,
  type RepriceSkipReason,
} from './reprice-eligibility'

const session = (over: Partial<{ status: string; service_type_id: string | null }> = {}) => ({
  status: 'submitted',
  service_type_id: 'svc-1',
  ...over,
})

const invoice = (over: Partial<{ status: string; square_invoice_id: string | null }> = {}) => ({
  status: 'pending',
  square_invoice_id: null,
  ...over,
})

describe('repriceEligibility', () => {
  it('allows a submitted session whose invoices are all pending', () => {
    expect(repriceEligibility(session(), [invoice(), invoice()], 0)).toEqual({ eligible: true })
  })

  it('allows an approved session', () => {
    expect(repriceEligibility(session({ status: 'approved' }), [invoice()], 0)).toEqual({
      eligible: true,
    })
  })

  it('allows a session with no invoices at all', () => {
    expect(repriceEligibility(session(), [], 0)).toEqual({ eligible: true })
  })

  it('refuses a no_show session', () => {
    // no_show is priced by calculateNoShowPricing. Running the standard formula over it would
    // erase the flat fee — the most damaging thing a bulk re-price could do.
    expect(repriceEligibility(session({ status: 'no_show' }), [], 0)).toEqual({
      eligible: false,
      reason: 'status-not-repriceable',
    })
  })

  it('refuses draft and cancelled sessions', () => {
    for (const status of ['draft', 'cancelled']) {
      expect(repriceEligibility(session({ status }), [], 0)).toEqual({
        eligible: false,
        reason: 'status-not-repriceable',
      })
    }
  })

  it('refuses a session with a sent invoice', () => {
    expect(repriceEligibility(session(), [invoice({ status: 'sent' })], 0)).toEqual({
      eligible: false,
      reason: 'invoice-sent',
    })
  })

  it('refuses a session with a paid invoice', () => {
    expect(repriceEligibility(session(), [invoice({ status: 'paid' })], 0)).toEqual({
      eligible: false,
      reason: 'invoice-paid',
    })
  })

  it('refuses when ANY sibling invoice is beyond pending', () => {
    // A split session: re-pricing the pending half while the other is paid would leave the two
    // invoices disagreeing about the same session.
    expect(
      repriceEligibility(session(), [invoice(), invoice({ status: 'paid' })], 0)
    ).toEqual({ eligible: false, reason: 'invoice-paid' })
  })

  it('reports paid ahead of sent when both are present', () => {
    expect(
      repriceEligibility(session(), [invoice({ status: 'sent' }), invoice({ status: 'paid' })], 0)
    ).toEqual({ eligible: false, reason: 'invoice-paid' })
  })

  it('refuses a Square-linked invoice even while it is still pending', () => {
    expect(
      repriceEligibility(session(), [invoice({ square_invoice_id: 'sq-123' })], 0)
    ).toEqual({ eligible: false, reason: 'square-linked' })
  })

  it('refuses a session billed on a batch invoice', () => {
    expect(repriceEligibility(session(), [], 2)).toEqual({
      eligible: false,
      reason: 'on-batch-invoice',
    })
  })

  it('refuses a session with no service type', () => {
    expect(repriceEligibility(session({ service_type_id: null }), [], 0)).toEqual({
      eligible: false,
      reason: 'no-service-type',
    })
  })

  it('has a human label for every skip reason', () => {
    // Guards the UI: a reason added without a label would render blank.
    const reasons: RepriceSkipReason[] = [
      'invoice-sent',
      'invoice-paid',
      'square-linked',
      'on-batch-invoice',
      'status-not-repriceable',
      'no-service-type',
    ]
    for (const reason of reasons) {
      expect(REPRICE_SKIP_LABELS[reason]).toBeTruthy()
    }
    expect(Object.keys(REPRICE_SKIP_LABELS).sort()).toEqual([...reasons].sort())
  })

  it('keeps the repriceable status list narrow', () => {
    expect([...REPRICEABLE_SESSION_STATUSES]).toEqual(['submitted', 'approved'])
  })
})
