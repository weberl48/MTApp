'use server'

import { createClient } from '@/lib/supabase/server'
import { handleSupabaseError, revalidateClientPaths, requirePermission } from '@/lib/actions/helpers'
import { encryptField, decryptField } from '@/lib/crypto'

export async function deleteClient(clientId: string) {
  const permErr = await requirePermission('settings:edit')
  if (permErr) return permErr

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

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateClientPaths()

  return { success: true as const }
}

export async function addClient(data: {
  name: string
  contact_email?: string | null
  contact_phone?: string | null
  payment_method: string
  billing_method?: string | null
  notes?: string | null
  organization_id: string
}) {
  const permErr = await requirePermission('client:manage')
  if (permErr) return permErr

  const supabase = await createClient()

  // Encrypt client notes (PHI) before storing
  const notes = data.notes?.trim() ? await encryptField(data.notes.trim()) : null

  const { data: newClient, error } = await supabase
    .from('clients')
    .insert({
      name: data.name.trim(),
      contact_email: data.contact_email?.trim() || null,
      contact_phone: data.contact_phone?.trim() || null,
      payment_method: data.payment_method,
      billing_method: data.billing_method || null,
      notes,
      organization_id: data.organization_id,
    })
    .select('id')
    .single()

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateClientPaths()

  return { success: true as const, clientId: newClient!.id }
}

export async function updateClient(
  clientId: string,
  data: {
    name: string
    contact_email?: string | null
    contact_phone?: string | null
    payment_method: string
    billing_method?: string | null
    notes?: string | null
  }
) {
  const permErr = await requirePermission('client:manage')
  if (permErr) return permErr

  const supabase = await createClient()

  // Encrypt client notes (PHI) before storing
  const notes = data.notes?.trim() ? await encryptField(data.notes.trim()) : null

  const { error } = await supabase
    .from('clients')
    .update({
      name: data.name.trim(),
      contact_email: data.contact_email?.trim() || null,
      contact_phone: data.contact_phone?.trim() || null,
      payment_method: data.payment_method,
      billing_method: data.billing_method || null,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateClientPaths(clientId)

  return { success: true as const }
}

/**
 * Fetch a client's notes decrypted, for the edit form. Notes are PHI (encrypted at rest); the
 * edit dialog is a client component and can't decrypt, so it fetches the plaintext through here.
 * Tolerant of legacy plaintext (decryptField returns the input unchanged when not encrypted).
 */
export async function getDecryptedClientNotes(clientId: string): Promise<string> {
  const permErr = await requirePermission('client:manage')
  if (permErr) return ''

  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('notes')
    .eq('id', clientId)
    .single()

  if (!data?.notes) return ''
  return await decryptField(data.notes)
}
