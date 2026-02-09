'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { autoSendInvoicesViaSquare, type AutoSendResult } from '@/lib/square/auto-send'
import { logger } from '@/lib/logger'

export async function approveSession(sessionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    return { success: false as const, error: error.message }
  }

  // Auto-send invoices via Square (non-blocking — approval always succeeds)
  let squareAutoSend: AutoSendResult | null = null
  try {
    squareAutoSend = await autoSendInvoicesViaSquare(sessionId)
  } catch (err) {
    logger.error('Auto-send Square invoices failed', err)
  }

  revalidatePath('/sessions')
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/dashboard')
  revalidatePath('/invoices')

  return { success: true as const, squareAutoSend }
}

export async function markSessionNoShow(sessionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'no_show', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/sessions')
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/dashboard')

  return { success: true }
}

/**
 * Remove a session from any pending batch invoices (invoice_items).
 * If removing the item leaves the batch invoice empty, delete the invoice.
 * Otherwise, recalculate the batch invoice totals.
 */
async function removeSesssionFromBatchInvoices(supabase: Awaited<ReturnType<typeof createClient>>, sessionId: string) {
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

  if (invoicesError) {
    return { success: false as const, error: invoicesError.message }
  }

  // Remove from any pending batch invoices (scholarship)
  await removeSesssionFromBatchInvoices(supabase, sessionId)

  // Revert to draft with rejection reason
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'draft',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) {
    return { success: false as const, error: error.message }
  }

  revalidatePath('/sessions')
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/dashboard')
  revalidatePath('/invoices')

  return { success: true as const }
}

export async function cancelSession(sessionId: string) {
  const supabase = await createClient()

  // Delete any per-session invoices for this session
  const { error: invoicesError } = await supabase
    .from('invoices')
    .delete()
    .eq('session_id', sessionId)

  if (invoicesError) {
    return { success: false, error: invoicesError.message }
  }

  // Remove from any pending batch invoices (scholarship)
  await removeSesssionFromBatchInvoices(supabase, sessionId)

  // Update session status to cancelled
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/sessions')
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/dashboard')
  revalidatePath('/invoices')

  return { success: true }
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient()

  // Remove from any pending batch invoices (scholarship)
  await removeSesssionFromBatchInvoices(supabase, sessionId)

  // Delete per-session invoices (foreign key constraint)
  const { error: invoicesError } = await supabase
    .from('invoices')
    .delete()
    .eq('session_id', sessionId)

  if (invoicesError) {
    return { success: false, error: invoicesError.message }
  }

  // Delete attendees
  const { error: attendeesError } = await supabase
    .from('session_attendees')
    .delete()
    .eq('session_id', sessionId)

  if (attendeesError) {
    return { success: false, error: attendeesError.message }
  }

  // Delete session
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/sessions')
  revalidatePath('/dashboard')
  revalidatePath('/invoices')

  return { success: true }
}
