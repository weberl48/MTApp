import { revalidatePath } from 'next/cache'
import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { can, type Permission } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'

/** Returns an error result if the Supabase operation failed, null otherwise. */
export function handleSupabaseError(error: PostgrestError | null): { success: false; error: string } | null {
  if (error) return { success: false, error: error.message }
  return null
}

/** Check that the current user has the given permission. Returns an error result if not. */
export async function requirePermission(
  permission: Permission
): Promise<{ success: false; error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!can((profile?.role as UserRole) ?? null, permission)) {
    return { success: false, error: 'Permission denied' }
  }
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
