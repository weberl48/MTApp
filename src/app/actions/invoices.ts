'use server'

import { createClient } from '@/lib/supabase/server'
import { handleSupabaseError, revalidateInvoicePaths, requirePermission } from '@/lib/actions/helpers'
import { sendInvoiceById } from '@/lib/invoices/send'
import { logger } from '@/lib/logger'

export async function deleteInvoice(invoiceId: string) {
  const permErr = await requirePermission('invoice:delete')
  if (permErr) return permErr

  const supabase = await createClient()

  const { error, count } = await supabase
    .from('invoices')
    .delete({ count: 'exact' })
    .eq('id', invoiceId)

  const err = handleSupabaseError(error)
  if (err) return err

  if (count === 0) {
    return { success: false as const, error: 'Invoice not found or you do not have permission to delete it' }
  }

  revalidateInvoicePaths()

  return { success: true as const }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'pending' | 'sent' | 'paid'
) {
  const permErr = await requirePermission('invoice:bulk-action')
  if (permErr) return permErr

  const supabase = await createClient()

  const updates: { status: string; paid_date?: string } = { status }

  if (status === 'paid') {
    updates.paid_date = new Date().toISOString().split('T')[0]
  }

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

  const updates: { status: string; paid_date?: string } = { status }

  if (status === 'paid') {
    updates.paid_date = new Date().toISOString().split('T')[0]
  }

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
  if (invoiceIds.length === 0) return { success: true as const, sent: 0, failed: [] as string[] }

  const permErr = await requirePermission('invoice:send')
  if (permErr) return permErr

  const supabase = await createClient()
  const results = { sent: 0, failed: [] as string[] }

  // Process sequentially to avoid overwhelming email service
  for (const id of invoiceIds) {
    try {
      const result = await sendInvoiceById(supabase, id)
      if (result.success) {
        results.sent++
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
