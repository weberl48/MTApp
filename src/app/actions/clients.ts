'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function deleteClient(clientId: string) {
  const supabase = await createClient()

  // Check if client has any sessions
  const { count: sessionCount } = await supabase
    .from('session_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)

  if (sessionCount && sessionCount > 0) {
    return {
      success: false,
      error: `Cannot delete: client has ${sessionCount} session record(s). Remove them from sessions first.`,
    }
  }

  // Check if client has any invoices
  const { count: invoiceCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)

  if (invoiceCount && invoiceCount > 0) {
    return {
      success: false,
      error: `Cannot delete: client has ${invoiceCount} invoice(s).`,
    }
  }

  // Safe to delete
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/clients')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function addClient(data: {
  name: string
  contact_email?: string | null
  contact_phone?: string | null
  payment_method: string
  notes?: string | null
  organization_id: string
}) {
  const supabase = await createClient()

  const { data: newClient, error } = await supabase
    .from('clients')
    .insert({
      name: data.name.trim(),
      contact_email: data.contact_email?.trim() || null,
      contact_phone: data.contact_phone?.trim() || null,
      payment_method: data.payment_method,
      notes: data.notes?.trim() || null,
      organization_id: data.organization_id,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/clients')
  revalidatePath('/dashboard')

  return { success: true, clientId: newClient.id }
}

export async function updateClient(
  clientId: string,
  data: {
    name: string
    contact_email?: string | null
    contact_phone?: string | null
    payment_method: string
    notes?: string | null
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({
      name: data.name.trim(),
      contact_email: data.contact_email?.trim() || null,
      contact_phone: data.contact_phone?.trim() || null,
      payment_method: data.payment_method,
      notes: data.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)

  return { success: true }
}
