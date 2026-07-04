'use server'

import { createClient } from '@/lib/supabase/server'
import { handleSupabaseError, revalidateInvoicePaths, revalidateSessionPaths, requirePermission } from '@/lib/actions/helpers'
import { sendInvoiceById } from '@/lib/invoices/send'
import { invoiceStatusUpdate } from '@/lib/invoices/status'
import { logger } from '@/lib/logger'

export async function deleteInvoice(invoiceId: string) {
  const permErr = await requirePermission('invoice:delete')
  if (permErr) return permErr

  const supabase = await createClient()

  // A PAID invoice is a settled financial record — deleting it destroys the paid_date and the
  // Square mapping. Refuse; the invoice must be marked unpaid first (a deliberate separate step).
  const { data: existing } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', invoiceId)
    .single()

  if (existing?.status === 'paid') {
    return { success: false as const, error: 'Cannot delete a paid invoice. Mark it unpaid first if this was a mistake.' }
  }

  // Delete ONLY the invoice. Its invoice_items cascade via ON DELETE CASCADE.
  // The linked session(s) are intentionally preserved — they simply revert to un-billed
  // (and can be re-invoiced). Deleting a financial document must never destroy the
  // underlying clinical session records. For a batch (scholarship) invoice this means the
  // whole month's sessions stay intact; only the monthly statement is removed.
  const { error, count } = await supabase
    .from('invoices')
    .delete({ count: 'exact' })
    .eq('id', invoiceId)
    .neq('status', 'paid')

  const err = handleSupabaseError(error)
  if (err) return err

  if (count === 0) {
    return { success: false as const, error: 'Invoice not found or you do not have permission to delete it' }
  }

  revalidateInvoicePaths()
  revalidateSessionPaths()

  return { success: true as const }
}

/**
 * Set the per-invoice Square processing fee decision (invoices.apply_square_fee).
 * true = charge the org-configured fee; false = don't; null = follow the org toggle.
 * Only allowed until the Square invoice actually exists — after that the fee is
 * already on the Square order and can't be silently changed from here.
 */
export async function setInvoiceSquareFee(invoiceId: string, apply: boolean | null) {
  const permErr = await requirePermission('invoice:send')
  if (permErr) return permErr

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('invoices')
    .select('square_invoice_id, status')
    .eq('id', invoiceId)
    .single()

  if (!existing) {
    return { success: false as const, error: 'Invoice not found' }
  }
  if (existing.square_invoice_id) {
    return { success: false as const, error: 'This invoice is already on Square — the fee can no longer be changed here' }
  }
  if (existing.status === 'paid') {
    return { success: false as const, error: 'This invoice is already paid' }
  }

  const { error } = await supabase
    .from('invoices')
    .update({ apply_square_fee: apply, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateInvoicePaths(invoiceId)

  return { success: true as const }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'pending' | 'sent' | 'paid'
) {
  const permErr = await requirePermission('invoice:bulk-action')
  if (permErr) return permErr

  const supabase = await createClient()

  const updates = invoiceStatusUpdate(status, new Date().toISOString().split('T')[0])

  const { error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateInvoicePaths(invoiceId)

  return { success: true as const }
}

export async function bulkUpdateInvoiceStatus(
  invoiceIds: string[],
  status: 'sent' | 'paid'
) {
  const permErr = await requirePermission('invoice:bulk-action')
  if (permErr) return permErr

  const supabase = await createClient()

  const updates = invoiceStatusUpdate(status, new Date().toISOString().split('T')[0])

  const { error } = await supabase
    .from('invoices')
    .update(updates)
    .in('id', invoiceIds)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateInvoicePaths()

  return { success: true as const }
}

export async function bulkSendInvoices(invoiceIds: string[]) {
  if (invoiceIds.length === 0) {
    return { success: true as const, sent: 0, failed: [] as string[], sentIds: [] as string[] }
  }

  const permErr = await requirePermission('invoice:send')
  if (permErr) return permErr

  const supabase = await createClient()
  // Track which ids actually sent so callers can remove only those (failed ones stay visible).
  const results = { sent: 0, failed: [] as string[], sentIds: [] as string[] }

  // Process sequentially to avoid overwhelming email service
  for (const id of invoiceIds) {
    try {
      const result = await sendInvoiceById(supabase, id)
      if (result.success) {
        results.sent++
        results.sentIds.push(id)
      } else {
        results.failed.push(result.error || `Failed to send invoice ${id}`)
      }
    } catch (e) {
      logger.error('Bulk send invoice failed for invoice', e)
      results.failed.push(`Invoice ${id.slice(0, 8)} failed`)
    }
  }

  revalidateInvoicePaths()

  return { success: true as const, ...results }
}
