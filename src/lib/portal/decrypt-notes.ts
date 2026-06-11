import { decryptField, isEncrypted } from '@/lib/crypto'

/**
 * Decrypt a stored client-facing notes value for display in the client portal,
 * tolerating legacy plaintext rows.
 *
 * `client_notes` is encrypted at rest (the session form runs it through encryptPHI).
 * The portal sessions endpoint previously returned the value raw, so clients saw the
 * `enc:...` ciphertext blob instead of the note their therapist wrote for them.
 */
export async function decryptClientNotesForPortal(
  value: string | null | undefined
): Promise<string | null> {
  if (!value) return null
  return isEncrypted(value) ? await decryptField(value) : value
}
