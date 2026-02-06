/**
 * HIPAA-Compliant Field-Level Encryption
 *
 * Uses AES-256-GCM encryption via Web Crypto API (built-in, no dependencies).
 * Encrypts PHI fields before storing in database, decrypts when reading.
 *
 * Key is derived from ENCRYPTION_KEY environment variable using PBKDF2.
 * Each encryption generates a unique IV for security.
 */

// Works in both browser and Node.js
const getCrypto = (): Crypto => {
  if (typeof window !== 'undefined') {
    return window.crypto
  }
  // Node.js environment
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { webcrypto } = require('crypto')
  return webcrypto as Crypto
}

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits recommended for GCM
const SALT_LENGTH = 16
const ITERATIONS = 100000 // PBKDF2 iterations

/**
 * Derives an AES key from the encryption password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const crypto = getCrypto()
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts a string using AES-256-GCM
 * Returns base64-encoded string: salt:iv:ciphertext
 */
export async function encryptField(plaintext: string): Promise<string> {
  // SECURITY: Only use server-side ENCRYPTION_KEY, never public env vars
  const encryptionKey = process.env.ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required for PHI encryption')
  }

  if (!plaintext || plaintext.trim() === '') {
    return plaintext
  }

  const crypto = getCrypto()
  const encoder = new TextEncoder()

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  // Derive key from password
  const key = await deriveKey(encryptionKey, salt)

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    encoder.encode(plaintext)
  )

  // Combine salt + iv + ciphertext and encode as base64
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

  // Add prefix to identify encrypted data
  return 'enc:' + btoa(String.fromCharCode(...combined))
}

/**
 * Decrypts a string that was encrypted with encryptField
 * Expects base64-encoded string: enc:salt:iv:ciphertext
 */
export async function decryptField(encrypted: string): Promise<string> {
  // SECURITY: Only use server-side ENCRYPTION_KEY, never public env vars
  const encryptionKey = process.env.ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required for PHI decryption')
  }

  // Check if data is actually encrypted
  if (!encrypted || !encrypted.startsWith('enc:')) {
    return encrypted // Return unencrypted data as-is (for migration)
  }

  try {
    const crypto = getCrypto()
    const decoder = new TextDecoder()

    // Remove prefix and decode base64
    const data = encrypted.slice(4) // Remove 'enc:' prefix
    const combined = Uint8Array.from(atob(data), c => c.charCodeAt(0))

    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)

    // Derive key from password
    const key = await deriveKey(encryptionKey, salt)

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
      key,
      ciphertext
    )

    return decoder.decode(plaintext)
  } catch {
    // Return original if decryption fails (could be unencrypted legacy data)
    return encrypted
  }
}

/**
 * Check if a field value is encrypted
 */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith('enc:')
}

/**
 * Encrypt multiple fields in an object
 */
export async function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fieldNames: (keyof T)[]
): Promise<T> {
  const result = { ...obj }

  for (const field of fieldNames) {
    const value = obj[field]
    if (typeof value === 'string' && value.trim() !== '') {
      result[field] = await encryptField(value) as T[keyof T]
    }
  }

  return result
}

/**
 * Decrypt multiple fields in an object
 */
export async function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fieldNames: (keyof T)[]
): Promise<T> {
  const result = { ...obj }

  for (const field of fieldNames) {
    const value = obj[field]
    if (typeof value === 'string' && isEncrypted(value)) {
      result[field] = await decryptField(value) as T[keyof T]
    }
  }

  return result
}

/**
 * Hash sensitive data for audit logs (one-way, can't be reversed)
 * Uses SHA-256 to create a consistent hash for tracking changes without storing PHI
 */
export async function hashForAudit(value: string): Promise<string> {
  if (!value) return ''

  const crypto = getCrypto()
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)

  // Return first 16 chars of hex hash (enough for change detection)
  return Array.from(hashArray.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
