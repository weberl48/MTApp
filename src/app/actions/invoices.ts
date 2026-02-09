'use server'

import { createClient } from '@/lib/supabase/server'
import { handleSupabaseError, revalidateInvoicePaths } from '@/lib/actions/helpers'

export async function deleteInvoice(invoiceId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateInvoicePaths()

  return { success: true as const }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'pending' | 'sent' | 'paid'
) {
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
