'use server'

import { createClient } from '@/lib/supabase/server'
import { autoSendInvoicesViaSquare } from '@/lib/square/auto-send'
import { sendInvoiceById } from '@/lib/invoices/send'
import { logger } from '@/lib/logger'
import { handleSupabaseError, revalidateSessionPaths, requirePermission } from '@/lib/actions/helpers'
import { deletePendingSessionInvoices, hasBilledSessionInvoice } from '@/lib/actions/session-invoice-cleanup'
import { resolveAutoSendMethod } from '@/lib/invoices/auto-send-policy'
import { calculateNoShowPricing, type ContractorPricingOverrides } from '@/lib/pricing'
import type { OrganizationSettings, ServiceType } from '@/types/database'

async function autoSendInvoicesOnApprove(supabase: Awaited<ReturnType<typeof createClient>>, sessionId: string): Promise<number> {
  // Get the session's organization settings
  const { data: session } = await supabase
    .from('sessions')
    .select('organization_id')
    .eq('id', sessionId)
    .single()

  if (!session) return 0

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', session.organization_id)
    .single()

  const settings = org?.settings as OrganizationSettings | undefined
  const method = resolveAutoSendMethod(settings)

  if (!method) return 0

  if (method === 'square') {
    const res = await autoSendInvoicesViaSquare(sessionId)
    return res?.sent ?? 0
  } else if (method === 'email') {
    // Find pending invoices for this session — only send to email-billed clients
    let sent = 0
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, client:clients(billing_method)')
      .eq('session_id', sessionId)
      .eq('status', 'pending')

    if (invoices) {
      for (const inv of invoices) {
        const client = Array.isArray(inv.client) ? inv.client[0] : inv.client
        const billingMethod = client?.billing_method
        // Only auto-send email to clients with email billing or no billing method set
        if (billingMethod && billingMethod !== 'email') continue

        try {
          await sendInvoiceById(supabase, inv.id)
          sent++
        } catch (e) {
          logger.error('Auto-send email invoice failed', e)
        }
      }
    }
    return sent
  }

  return 0
}

export async function approveSession(sessionId: string) {
  const permErr = await requirePermission('session:approve')
  if (permErr) return permErr

  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  const err = handleSupabaseError(error)
  if (err) return err

  // Auto-send via automation settings (email or square)
  try {
    await autoSendInvoicesOnApprove(supabase, sessionId)
  } catch (e) {
    logger.error('Auto-send invoices on approve failed', e)
  }

  revalidateSessionPaths(sessionId)

  return { success: true as const }
}

export async function bulkApproveSessions(sessionIds: string[]) {
  if (sessionIds.length === 0) return { success: true as const, count: 0, approvedIds: [] as string[], autoSent: 0 }

  const permErr = await requirePermission('session:approve')
  if (permErr) return permErr

  const supabase = await createClient()

  const { data: approved, error } = await supabase
    .from('sessions')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .in('id', sessionIds)
    .eq('status', 'submitted') // Safety: only approve submitted sessions
    .select('id')

  const err = handleSupabaseError(error)
  if (err) return err

  // Only the rows that were actually 'submitted' got approved — others (already approved/
  // rejected by someone else) are skipped, so report and act on the real set.
  const approvedIds = (approved || []).map((s) => s.id)

  // Auto-send invoices per the org's automation settings (email or square), using the SAME
  // gate as single approve, ONLY for the sessions actually approved here.
  const autoSendResults = await Promise.allSettled(
    approvedIds.map((id) => autoSendInvoicesOnApprove(supabase, id))
  )

  const autoSent = autoSendResults.reduce(
    (n, r) => n + (r.status === 'fulfilled' ? r.value : 0),
    0
  )

  revalidateSessionPaths()

  return { success: true as const, count: approvedIds.length, approvedIds, autoSent }
}

export async function markSessionNoShow(sessionId: string) {
  const permErr = await requirePermission('session:mark-no-show')
  if (permErr) return permErr

  const supabase = await createClient()

  // Load the session + its service type so we can reprice to the no-show fee.
  const { data: session } = await supabase
    .from('sessions')
    .select('id, organization_id, contractor_id, service_type_id, service_type:service_types(*)')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return { success: false as const, error: 'Session not found' }
  }

  const serviceType = (Array.isArray(session.service_type)
    ? session.service_type[0]
    : session.service_type) as ServiceType | null

  // Org no-show fee (falls back to the pricing default inside calculateNoShowPricing).
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', session.organization_id)
    .single()
  const settings = org?.settings as OrganizationSettings | undefined
  const noShowFee = settings?.pricing?.no_show_fee

  // Contractor's custom rate (so the contractor keeps their normal pay on a no-show).
  let overrides: ContractorPricingOverrides | undefined
  if (session.contractor_id && session.service_type_id) {
    const { data: rate } = await supabase
      .from('contractor_rates')
      .select('contractor_pay, duration_increment')
      .eq('contractor_id', session.contractor_id)
      .eq('service_type_id', session.service_type_id)
      .maybeSingle()
    if (rate) {
      overrides = { customContractorPay: rate.contractor_pay, durationIncrement: rate.duration_increment }
    }
  }

  const pricing = serviceType ? calculateNoShowPricing(serviceType, overrides, noShowFee) : null

  // Mark no-show and reprice the session to the flat no-show fee (contractor keeps normal pay).
  const sessionUpdate: Record<string, unknown> = {
    status: 'no_show',
    updated_at: new Date().toISOString(),
  }
  if (pricing) {
    sessionUpdate.total_amount = pricing.totalAmount
    sessionUpdate.contractor_pay = pricing.contractorPay
    sessionUpdate.mca_cut = pricing.mcaCut
  }

  const { error } = await supabase.from('sessions').update(sessionUpdate).eq('id', sessionId)

  const err = handleSupabaseError(error)
  if (err) return err

  // Reprice any PENDING per-session invoice to the no-show fee. Sent/paid invoices are
  // left alone (they are financial records; handle those manually).
  if (pricing) {
    await supabase
      .from('invoices')
      .update({
        amount: pricing.totalAmount,
        contractor_pay: pricing.contractorPay,
        mca_cut: pricing.mcaCut,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .eq('status', 'pending')
  }

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
  const permErr = await requirePermission('session:approve')
  if (permErr) return permErr

  const supabase = await createClient()

  // Delete only PENDING per-session invoices (created on submit). Never delete sent/paid
  // invoices — those are financial records.
  const { error: invoicesError } = await deletePendingSessionInvoices(supabase, sessionId)

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
  const permErr = await requirePermission('session:cancel')
  if (permErr) return permErr

  const supabase = await createClient()

  // Delete only PENDING per-session invoices. Never delete sent/paid invoices —
  // those are financial records.
  const { error: invoicesError } = await deletePendingSessionInvoices(supabase, sessionId)

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
  const permErr = await requirePermission('session:delete')
  if (permErr) return permErr

  const supabase = await createClient()

  // Don't allow deleting a session whose invoice was already sent or paid (financial record)
  if (await hasBilledSessionInvoice(supabase, sessionId)) {
    return {
      success: false as const,
      error: 'This session has a sent or paid invoice and cannot be deleted. Void the invoice first.',
    }
  }

  // Remove from any pending batch invoices (scholarship)
  await removeSessionFromBatchInvoices(supabase, sessionId)

  // Delete only PENDING per-session invoices (foreign key constraint)
  const { error: invoicesError } = await deletePendingSessionInvoices(supabase, sessionId)

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

/**
 * Mark a set of sessions paid for payroll, atomically. Delegates to the mark_sessions_paid()
 * function which updates the whole set in one statement, only touches not-yet-paid sessions
 * (no double-pay / mixed state on partial failure), and snapshots each session's own
 * contractor_pay. Returns how many were actually marked.
 */
export async function markSessionsPaid(sessionIds: string[], paidDate: string) {
  const permErr = await requirePermission('invoice:bulk-action')
  if (permErr) return permErr
  if (sessionIds.length === 0) return { success: true as const, count: 0 }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('mark_sessions_paid', {
    p_ids: sessionIds,
    p_paid_date: paidDate,
  })

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateSessionPaths()

  return { success: true as const, count: (data as number) ?? 0 }
}
