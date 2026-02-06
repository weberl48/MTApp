/**
 * PHI (Protected Health Information) Helper
 *
 * Centralizes encryption/decryption for all PHI fields in the application.
 * Use these functions when saving/reading sensitive data.
 */

import { encryptField, decryptField, isEncrypted } from './index'

// Define which fields in each table contain PHI
export const PHI_FIELDS = {
  sessions: ['notes', 'client_notes'],
  clients: ['notes'],
  client_goals: ['description'],
} as const

type PhiTable = keyof typeof PHI_FIELDS

/**
 * Encrypt PHI fields in a record before saving to database
 */
export async function encryptPhiForSave<T extends Record<string, unknown>>(
  table: PhiTable,
  data: T
): Promise<T> {
  const fields = PHI_FIELDS[table] as readonly string[]
  const result = { ...data }

  for (const field of fields) {
    if (field in result) {
      const value = result[field as keyof T]
      if (typeof value === 'string' && value.trim() !== '') {
        result[field as keyof T] = await encryptField(value) as T[keyof T]
      }
    }
  }

  return result
}

/**
 * Decrypt PHI fields in a record after reading from database
 */
export async function decryptPhiFromDb<T extends Record<string, unknown>>(
  table: PhiTable,
  data: T | null
): Promise<T | null> {
  if (!data) return null

  const fields = PHI_FIELDS[table] as readonly string[]
  const result = { ...data }

  for (const field of fields) {
    if (field in result) {
      const value = result[field as keyof T]
      if (typeof value === 'string' && isEncrypted(value)) {
        result[field as keyof T] = await decryptField(value) as T[keyof T]
      }
    }
  }

  return result
}

/**
 * Decrypt PHI fields in an array of records
 */
export async function decryptPhiArray<T extends Record<string, unknown>>(
  table: PhiTable,
  data: T[] | null
): Promise<T[]> {
  if (!data) return []

  return Promise.all(data.map(record => decryptPhiFromDb(table, record))) as Promise<T[]>
}

/**
 * Check if encryption is enabled
 */
export function isEncryptionEnabled(): boolean {
  const key = process.env.ENCRYPTION_KEY
  return !!key && key.length > 0
}

/**
 * Get encryption status message for display
 */
export function getEncryptionStatus(): { enabled: boolean; message: string } {
  const enabled = isEncryptionEnabled()
  return {
    enabled,
    message: enabled
      ? 'PHI encryption is enabled'
      : 'PHI encryption is disabled - set ENCRYPTION_KEY in environment',
  }
}
