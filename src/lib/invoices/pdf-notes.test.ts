import { describe, it, expect } from 'vitest'
import { clientInvoiceNotes } from './pdf-notes'

describe('clientInvoiceNotes (regression for #11 — internal notes on client invoice PDF)', () => {
  it('never returns internal session notes', () => {
    expect(clientInvoiceNotes({ notes: 'PRIVATE clinical observation' })).toBeNull()
  })

  it('returns client-facing notes when present', () => {
    expect(clientInvoiceNotes({ client_notes: 'See you next week!' })).toBe('See you next week!')
  })

  it('ignores internal notes even when both fields are present', () => {
    expect(clientInvoiceNotes({ notes: 'internal-only', client_notes: 'client-facing' })).toBe(
      'client-facing'
    )
  })

  it('returns null for empty/whitespace client notes and missing session', () => {
    expect(clientInvoiceNotes({ client_notes: '   ' })).toBeNull()
    expect(clientInvoiceNotes(null)).toBeNull()
    expect(clientInvoiceNotes(undefined)).toBeNull()
  })
})
