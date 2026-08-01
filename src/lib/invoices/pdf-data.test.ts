/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { fetchInvoicePdfData } from './pdf-data'

interface MockRows {
  invoice: any
  items?: any[]
  settings?: any
}

function mockSupabase({ invoice, items = [], settings = {} }: MockRows): any {
  return {
    from(table: string) {
      if (table === 'invoices') {
        return {
          select: () => ({
            eq: () => ({
              single: async () =>
                invoice ? { data: invoice, error: null } : { data: null, error: { message: 'not found' } },
            }),
          }),
        }
      }
      if (table === 'invoice_items') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: items, error: null }),
            }),
          }),
        }
      }
      if (table === 'organizations') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { settings }, error: null }),
            }),
          }),
        }
      }
      return {}
    },
  }
}

const baseInvoice = {
  id: 'inv1',
  organization_id: 'org1',
  invoice_type: 'single',
  client: { id: 'c1', name: 'Client', contact_email: null },
  session: {
    id: 's1',
    date: '2026-02-03',
    duration_minutes: 30,
    client_notes: null,
    contractor_id: 'u1',
    contractor: { id: 'u1', name: 'Colleen' },
    service_type: { name: 'Scholarship Group' },
    classroom: null,
  },
}

describe('session location pass-through', () => {
  const withLocation = () => ({
    ...baseInvoice,
    session: { ...baseInvoice.session, classroom: 'Room 101' },
  })

  it('keeps the session location on a single-session invoice with default org settings', async () => {
    const result = await fetchInvoicePdfData(mockSupabase({ invoice: withLocation() }), 'inv1')
    expect(result!.invoice.session!.classroom).toBe('Room 101')
  })

  it('keeps batch line-item locations with default org settings', async () => {
    const batch = { ...baseInvoice, invoice_type: 'batch' }
    const items = [{ description: 'X', session_date: '2026-02-03', amount: 60, classroom: 'Room 9' }]
    const result = await fetchInvoicePdfData(mockSupabase({ invoice: batch, items }), 'inv1')
    expect(result!.invoice.items![0].classroom).toBe('Room 9')
  })
})

describe('fetchInvoicePdfData', () => {
  it('returns null when the invoice is missing', async () => {
    const result = await fetchInvoicePdfData(mockSupabase({ invoice: null }), 'nope')
    expect(result).toBeNull()
  })

  it('passes legacy plaintext client_notes through untouched', async () => {
    const invoice = {
      ...baseInvoice,
      session: { ...baseInvoice.session, client_notes: 'Great progress today!' },
    }
    const result = await fetchInvoicePdfData(mockSupabase({ invoice }), 'inv1')
    expect(result?.invoice.session?.client_notes).toBe('Great progress today!')
  })

  it('attaches ordered line items for batch invoices, omits them when empty', async () => {
    const batch = { ...baseInvoice, invoice_type: 'batch', session: null }
    const items = [
      { description: 'A', session_date: '2026-02-03', duration_minutes: 30, amount: 65, service_type_name: 'Scholarship Group', contractor_name: 'Colleen' },
    ]

    const withItems = await fetchInvoicePdfData(mockSupabase({ invoice: batch, items }), 'inv1')
    expect(withItems?.invoice.items).toHaveLength(1)

    const withoutItems = await fetchInvoicePdfData(mockSupabase({ invoice: batch, items: [] }), 'inv1')
    expect(withoutItems?.invoice.items).toBeUndefined()
  })

  it('does not fetch line items for single-session invoices', async () => {
    const result = await fetchInvoicePdfData(mockSupabase({ invoice: baseInvoice, items: [{ description: 'X' }] }), 'inv1')
    expect(result?.invoice.items).toBeUndefined()
  })

  it('surfaces org invoice settings as footerText/paymentInstructions', async () => {
    const settings = { invoice: { footer_text: 'Thanks!', payment_instructions: 'Checks to MCA' } }
    const result = await fetchInvoicePdfData(mockSupabase({ invoice: baseInvoice, settings }), 'inv1')
    expect(result?.footerText).toBe('Thanks!')
    expect(result?.paymentInstructions).toBe('Checks to MCA')
  })

  it('leaves footerText/paymentInstructions undefined when unset (template defaults apply)', async () => {
    const result = await fetchInvoicePdfData(mockSupabase({ invoice: baseInvoice }), 'inv1')
    expect(result?.footerText).toBeUndefined()
    expect(result?.paymentInstructions).toBeUndefined()
  })
})
