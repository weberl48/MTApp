'use server'

import { createClient } from '@/lib/supabase/server'
import { handleSupabaseError, revalidateInvoicePaths, revalidateSessionPaths, requirePermission } from '@/lib/actions/helpers'
import { sendInvoiceById } from '@/lib/invoices/send'
import { logger } from '@/lib/logger'

/**
 * Delete a single session and all its linked data (attendees, per-session invoices, batch invoice items).
 * Used internally by deleteInvoice to cascade-delete linked sessions.
 */
async function cascadeDeleteSession(supabase: Awaited<ReturnType<typeof createClient>>, sessionId: string) {
  // Remove from any pending batch invoices (scholarship)
  // Find invoice_items referencing this session
  const { data: items } = await supabase
    .from('invoice_items')
    .select('id, invoice_id, amount, mca_cut, contractor_pay, rent_amount')
    .eq('session_id', sessionId)

  if (items && items.length > 0) {
    for (const item of items) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, status, amount, mca_cut, contractor_pay, rent_amount')
        .eq('id', item.invoice_id)
        .single()

      if (!invoice || invoice.status !== 'pending') continue

      await supabase.from('invoice_items').delete().eq('id', item.id)

      const { count } = await supabase
        .from('invoice_items')
        .select('id', { count: 'exact', head: true })
        .eq('invoice_id', item.invoice_id)

      if (count === 0) {
        await supabase.from('invoices').delete().eq('id', item.invoice_id)
      } else {
        await supabase
          .from('invoices')
          .update({
            amount: Math.round((invoice.amount - item.amount) * 100) / 100,
            mca_cut: Math.round((invoice.mca_cut - item.mca_cut) * 100) / 100,
            contractor_pay: Math.round((invoice.contractor_pay - item.contractor_pay) * 100) / 100,
            rent_amount: Math.round((invoice.rent_amount - item.rent_amount) * 100) / 100,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.invoice_id)
      }
    }
  }

  // Delete per-session invoices
  await supabase.from('invoices').delete().eq('session_id', sessionId)

  // Delete attendees
  await supabase.from('session_attendees').delete().eq('session_id', sessionId)

  // Delete the session
  await supabase.from('sessions').delete().eq('id', sessionId)
}

export async function deleteInvoice(invoiceId: string) {
  const permErr = await requirePermission('invoice:delete')
  if (permErr) return permErr

  const supabase = await createClient()

  // Fetch the invoice to find linked sessions before deleting
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, session_id, invoice_type')
    .eq('id', invoiceId)
    .single()

  if (!invoice) {
    return { success: false as const, error: 'Invoice not found or you do not have permission to delete it' }
  }

  // Collect all session IDs linked to this invoice
  const sessionIds: string[] = []

  if (invoice.session_id) {
    // Per-session invoice — linked to one session
    sessionIds.push(invoice.session_id)
  } else {
    // Batch invoice — find sessions via invoice_items
    const { data: items } = await supabase
      .from('invoice_items')
      .select('session_id')
      .eq('invoice_id', invoiceId)

    if (items) {
      for (const item of items) {
        if (item.session_id && !sessionIds.includes(item.session_id)) {
          sessionIds.push(item.session_id)
        }
      }
    }
  }

  // Delete the invoice first (invoice_items cascade via ON DELETE CASCADE)
  const { error, count } = await supabase
    .from('invoices')
    .delete({ count: 'exact' })
    .eq('id', invoiceId)

  const err = handleSupabaseError(error)
  if (err) return err

  if (count === 0) {
    return { success: false as const, error: 'Invoice not found or you do not have permission to delete it' }
  }

  // Cascade-delete all linked sessions
  for (const sessionId of sessionIds) {
    await cascadeDeleteSession(supabase, sessionId)
  }

  revalidateInvoicePaths()
  revalidateSessionPaths()

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
