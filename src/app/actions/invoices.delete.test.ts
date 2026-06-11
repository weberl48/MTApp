import { describe, it, expect, vi, beforeEach } from 'vitest'

// Record every table that .delete() is called on.
const deletedTables: string[] = []

const mockClient = {
  from(table: string) {
    return {
      delete() {
        deletedTables.push(table)
        return {
          eq() {
            return Promise.resolve({ error: null, count: 1 })
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
})
