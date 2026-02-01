'use server'

import { encryptField, decryptField } from './index'

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
  return {
    notes: fields.notes ? await decryptField(fields.notes) : null,
    clientNotes: fields.clientNotes ? await decryptField(fields.clientNotes) : null,
  }
}
