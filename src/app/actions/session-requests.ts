'use server'

import { createClient } from '@/lib/supabase/server'
import { decryptField } from '@/lib/crypto'

/**
 * Fetch the caller's organization's pending session requests with the client-submitted notes
 * DECRYPTED. The staff manager is a client component and can't decrypt PHI, so the read goes
 * through here. RLS scopes the query to the staff member's org.
 */
export async function getPendingSessionRequests() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) return []

  const { data } = await supabase
    .from('session_requests')
    .select(`
      id,
      preferred_date,
      preferred_time,
      alternative_date,
      alternative_time,
      duration_minutes,
      notes,
      status,
      response_notes,
      created_at,
      client:clients(id, name)
    `)
    .eq('organization_id', profile.organization_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return Promise.all(
    (data || []).map(async (req) => ({
      ...req,
      client: Array.isArray(req.client) ? req.client[0] : req.client,
      notes: req.notes ? await decryptField(req.notes) : null,
    }))
  )
}
