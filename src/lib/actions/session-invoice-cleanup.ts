import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Delete only the PENDING per-session invoices for a session.
 *
 * Reject / cancel / delete-session flows previously deleted *every* invoice for the
 * session with no status filter, which permanently destroyed invoices that had already
 * been sent or paid (losing the financial record, paid_date, and Square mapping). Sent
 * and paid invoices are financial records and must never be removed by these flows.
 */
export async function deletePendingSessionInvoices(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  sessionId: string
) {
  return supabase
    .from('invoices')
    .delete()
    .eq('session_id', sessionId)
    .eq('status', 'pending')
}

/**
 * Whether the session has an invoice that has already been sent or paid.
 * Used to block destructive actions that would orphan or destroy a financial record.
 */
export async function hasBilledSessionInvoice(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  sessionId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('invoices')
    .select('id')
    .eq('session_id', sessionId)
    .in('status', ['sent', 'paid'])
    .limit(1)
  return !!(data && data.length > 0)
}
