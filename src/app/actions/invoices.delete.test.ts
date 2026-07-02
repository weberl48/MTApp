import { describe, it, expect, vi, beforeEach } from 'vitest'

// Record every table that .delete() is called on.
const deletedTables: string[] = []
// The status the mock reports for the invoice being deleted (tests reassign this).
let invoiceStatus = 'sent'

const mockClient = {
  from(table: string) {
    return {
      // Pre-delete status check: select('status').eq('id', ...).single()
      select() {
        return {
          eq() {
            return {
              single() {
                return Promise.resolve({ data: { status: invoiceStatus }, error: null })
              },
            }
          },
        }
      },
      delete() {
        deletedTables.push(table)
        return {
          eq() {
            return {
              // .neq('status', 'paid') terminates the chain
              neq() {
                return Promise.resolve({ error: null, count: 1 })
              },
            }
          },
        }
      },
    }
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => mockClient,
}))
vi.mock('@/lib/actions/helpers', () => ({
  requirePermission: async () => null,
  handleSupabaseError: () => null,
  revalidateInvoicePaths: () => {},
  revalidateSessionPaths: () => {},
}))
vi.mock('@/lib/invoices/send', () => ({
  sendInvoiceById: async () => ({ success: true }),
}))
vi.mock('@/lib/logger', () => ({
  logger: { error: () => {}, info: () => {}, warn: () => {} },
}))

import { deleteInvoice } from './invoices'

describe('deleteInvoice (regression for #1 — must not cascade-delete sessions)', () => {
  beforeEach(() => {
    deletedTables.length = 0
    invoiceStatus = 'sent'
  })

  it('deletes the invoice but never deletes sessions, attendees, or items', async () => {
    const result = await deleteInvoice('inv-1')
    expect(result).toEqual({ success: true })
    expect(deletedTables).toContain('invoices')
    // The whole point of the fix: clinical/session data is preserved.
    expect(deletedTables).not.toContain('sessions')
    expect(deletedTables).not.toContain('session_attendees')
    // invoice_items are removed by the DB ON DELETE CASCADE, not by the action.
    expect(deletedTables).not.toContain('invoice_items')
  })

  it('refuses to delete a PAID invoice (financial record)', async () => {
    invoiceStatus = 'paid'
    const result = await deleteInvoice('inv-1')
    expect(result.success).toBe(false)
    expect(deletedTables).not.toContain('invoices')
  })
})
