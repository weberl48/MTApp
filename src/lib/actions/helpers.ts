import { revalidatePath } from 'next/cache'
import type { PostgrestError } from '@supabase/supabase-js'

/** Returns an error result if the Supabase operation failed, null otherwise. */
export function handleSupabaseError(error: PostgrestError | null): { success: false; error: string } | null {
  if (error) return { success: false, error: error.message }
  return null
}

/** Revalidate all paths affected by session changes. */
export function revalidateSessionPaths(sessionId?: string) {
  revalidatePath('/sessions')
  if (sessionId) revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/dashboard')
  revalidatePath('/invoices')
}

/** Revalidate all paths affected by invoice changes. */
export function revalidateInvoicePaths(invoiceId?: string) {
  revalidatePath('/invoices')
  if (invoiceId) revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/dashboard')
  revalidatePath('/payments')
}

/** Revalidate all paths affected by client changes. */
export function revalidateClientPaths(clientId?: string) {
  revalidatePath('/clients')
  if (clientId) revalidatePath(`/clients/${clientId}`)
  revalidatePath('/dashboard')
}

/** Revalidate all paths affected by team changes. */
export function revalidateTeamPaths() {
  revalidatePath('/team')
  revalidatePath('/dashboard')
}
