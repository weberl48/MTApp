'use server'

import { createClient } from '@/lib/supabase/server'
import { autoSendInvoicesViaSquare, type AutoSendResult } from '@/lib/square/auto-send'
import { sendInvoiceById } from '@/lib/invoices/send'
import { logger } from '@/lib/logger'
import { handleSupabaseError, revalidateSessionPaths, requirePermission } from '@/lib/actions/helpers'
import type { OrganizationSettings } from '@/types/database'

async function autoSendInvoicesOnApprove(supabase: Awaited<ReturnType<typeof createClient>>, sessionId: string) {
  // Get the session's organization settings
  const { data: session } = await supabase
    .from('sessions')
    .select('organization_id')
    .eq('id', sessionId)
    .single()

  if (!session) return

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', session.organization_id)
    .single()

  const settings = org?.settings as OrganizationSettings | undefined
  const method = settings?.automation?.auto_send_invoice_method

  if (!settings?.automation?.auto_send_invoice_on_approve || method === 'none') return

  if (method === 'square') {
    await autoSendInvoicesViaSquare(sessionId)
  } else if (method === 'email') {
    // Find pending invoices for this session and send via email
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('session_id', sessionId)
      .eq('status', 'pending')

    if (invoices) {
      for (const inv of invoices) {
        try {
          await sendInvoiceById(supabase, inv.id)
        } catch (e) {
          logger.error('Auto-send email invoice failed', e)
        }
      }
    }
  }
}

export async function approveSession(sessionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  const err = handleSupabaseError(error)
  if (err) return err

  // Auto-send invoices via Square (legacy setting — non-blocking)
  let squareAutoSend: AutoSendResult | null = null
  try {
    squareAutoSend = await autoSendInvoicesViaSquare(sessionId)
  } catch (e) {
    logger.error('Auto-send Square invoices failed', e)
  }

  // Auto-send via automation settings (email or square)
  try {
    await autoSendInvoicesOnApprove(supabase, sessionId)
  } catch (e) {
    logger.error('Auto-send invoices on approve failed', e)
  }

  revalidateSessionPaths(sessionId)

  return { success: true as const, squareAutoSend }
}

export async function bulkApproveSessions(sessionIds: string[]) {
  if (sessionIds.length === 0) return { success: true as const, count: 0 }

  const permErr = await requirePermission('session:approve')
  if (permErr) return permErr

  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .in('id', sessionIds)
    .eq('status', 'submitted') // Safety: only approve submitted sessions

  const err = handleSupabaseError(error)
  if (err) return err

  // Auto-send invoices via Square for each session (non-blocking)
  const squareResults = await Promise.allSettled(
    sessionIds.map((id) => autoSendInvoicesViaSquare(id))
  )

  const squareSent = squareResults.filter(
    (r) => r.status === 'fulfilled' && r.value.sent > 0
  ).length

  revalidateSessionPaths()

  return { success: true as const, count: sessionIds.length, squareSent }
}

export async function markSessionNoShow(sessionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'no_show', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateSessionPaths(sessionId)

  return { success: true as const }
}

/**
 * Remove a session from any pending batch invoices (invoice_items).
 * If removing the item leaves the batch invoice empty, delete the invoice.
 * Otherwise, recalculate the batch invoice totals.
 */
async function removeSessionFromBatchInvoices(supabase: Awaited<ReturnType<typeof createClient>>, sessionId: string) {
  // Find invoice_items referencing this session
  const { data: items } = await supabase
    .from('invoice_items')
    .select('id, invoice_id, amount, mca_cut, contractor_pay, rent_amount')
    .eq('session_id', sessionId)

  if (!items || items.length === 0) return

  for (const item of items) {
    // Check if the parent invoice is still pending
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, status, amount, mca_cut, contractor_pay, rent_amount')
      .eq('id', item.invoice_id)
      .single()

    if (!invoice || invoice.status !== 'pending') continue

    // Delete the item
    await supabase.from('invoice_items').delete().eq('id', item.id)

    // Check remaining items
    const { count } = await supabase
      .from('invoice_items')
      .select('id', { count: 'exact', head: true })
      .eq('invoice_id', item.invoice_id)

    if (count === 0) {
      // No items left — delete the batch invoice
      await supabase.from('invoices').delete().eq('id', item.invoice_id)
    } else {
      // Recalculate totals
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

export async function rejectSession(sessionId: string, reason: string) {
  const supabase = await createClient()

  // Delete pending per-session invoices (created on submit, must be removed when reverting to draft)
  const { error: invoicesError } = await supabase
    .from('invoices')
    .delete()
    .eq('session_id', sessionId)

  const invoiceErr = handleSupabaseError(invoicesError)
  if (invoiceErr) return invoiceErr

  // Remove from any pending batch invoices (scholarship)
  await removeSessionFromBatchInvoices(supabase, sessionId)

  // Revert to draft with rejection reason
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'draft',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateSessionPaths(sessionId)

  return { success: true as const }
}

export async function cancelSession(sessionId: string) {
  const supabase = await createClient()

  // Delete any per-session invoices for this session
  const { error: invoicesError } = await supabase
    .from('invoices')
    .delete()
    .eq('session_id', sessionId)

  const invoiceErr = handleSupabaseError(invoicesError)
  if (invoiceErr) return invoiceErr

  // Remove from any pending batch invoices (scholarship)
  await removeSessionFromBatchInvoices(supabase, sessionId)

  // Update session status to cancelled
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateSessionPaths(sessionId)

  return { success: true as const }
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient()

  // Remove from any pending batch invoices (scholarship)
  await removeSessionFromBatchInvoices(supabase, sessionId)

  // Delete per-session invoices (foreign key constraint)
  const { error: invoicesError } = await supabase
    .from('invoices')
    .delete()
    .eq('session_id', sessionId)

  const invoiceErr = handleSupabaseError(invoicesError)
  if (invoiceErr) return invoiceErr

  // Delete attendees
  const { error: attendeesError } = await supabase
    .from('session_attendees')
    .delete()
    .eq('session_id', sessionId)

  const attendeeErr = handleSupabaseError(attendeesError)
  if (attendeeErr) return attendeeErr

  // Delete session
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateSessionPaths()

  return { success: true as const }
}
