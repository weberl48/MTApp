'use server'

import { encryptField, decryptField } from './index'
import { createClient } from '@/lib/supabase/server'

/**
 * Ensure a caller is authenticated before running a PHI crypto primitive.
 *
 * These are 'use server' actions and are therefore reachable as POST endpoints by anyone.
 * Without this check `decryptPHI` is a general decryption oracle under the master key. It
 * still isn't row-scoped (the caller supplies the ciphertext), but requiring a valid session
 * removes the anonymous-access path.
 */
async function requireAuthenticated(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return !!user
}

/**
 * Server action to encrypt PHI fields
 * Must be called from server-side since ENCRYPTION_KEY is not available client-side
 */
export async function encryptPHI(fields: {
  notes?: string | null
  clientNotes?: string | null
}): Promise<{
  notes: string | null
  clientNotes: string | null
}> {
  if (!(await requireAuthenticated())) {
    throw new Error('Unauthorized')
  }
  return {
    notes: fields.notes ? await encryptField(fields.notes) : null,
    clientNotes: fields.clientNotes ? await encryptField(fields.clientNotes) : null,
  }
}

/**
 * Server action to decrypt PHI fields
 */
export async function decryptPHI(fields: {
  notes?: string | null
  clientNotes?: string | null
}): Promise<{
  notes: string | null
  clientNotes: string | null
}> {
  if (!(await requireAuthenticated())) {
    throw new Error('Unauthorized')
  }
  return {
    notes: fields.notes ? await decryptField(fields.notes) : null,
    clientNotes: fields.clientNotes ? await decryptField(fields.clientNotes) : null,
  }
}
