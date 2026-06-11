import { describe, it, expect } from 'vitest'
import { scholarshipBatchToasts } from './scholarship-batch-feedback'

describe('scholarshipBatchToasts (regression for #19 — silent Generate All failures)', () => {
  it('shows an error toast when the action fails (previously silent)', () => {
    expect(scholarshipBatchToasts({ success: false, error: 'Forbidden' })).toEqual([
      { level: 'error', message: 'Forbidden' },
    ])
  })

  it('falls back to a generic error message when none is provided', () => {
    expect(scholarshipBatchToasts({ success: false })).toEqual([
      { level: 'error', message: 'Failed to generate scholarship invoices' },
    ])
  })

  it('reports generated and failed counts', () => {
    expect(scholarshipBatchToasts({ success: true, generated: 3, failed: ['x'] })).toEqual([
      { level: 'success', message: 'Generated 3 invoices' },
      { level: 'warning', message: '1 failed' },
    ])
  })

  it('singularizes a single generated invoice', () => {
    expect(scholarshipBatchToasts({ success: true, generated: 1, failed: [] })).toEqual([
      { level: 'success', message: 'Generated 1 invoice' },
    ])
  })

  it('reports when there was nothing to generate', () => {
    expect(scholarshipBatchToasts({ success: true, generated: 0, failed: [] })).toEqual([
      { level: 'info', message: 'No unbilled scholarship sessions to generate' },
    ])
  })
})
