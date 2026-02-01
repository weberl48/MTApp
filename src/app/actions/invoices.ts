'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function deleteInvoice(invoiceId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  revalidatePath('/payments')

  return { success: true }
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

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/dashboard')
  revalidatePath('/payments')

  return { success: true }
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

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  revalidatePath('/payments')

  return { success: true }
}
