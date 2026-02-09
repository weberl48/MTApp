import { encryptField, decryptField, isEncrypted, encryptFields, decryptFields, hashForAudit } from './index'

// Set a test encryption key before tests run
const TEST_KEY = 'a'.repeat(64) // 64-char hex key for testing

beforeAll(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY
})

afterAll(() => {
  delete process.env.ENCRYPTION_KEY
})

describe('encryptField / decryptField', () => {
  it('encrypts and decrypts a string round-trip', async () => {
    const plaintext = 'Patient has shown improvement in social skills'
    const encrypted = await encryptField(plaintext)
    const decrypted = await decryptField(encrypted)

    expect(encrypted).not.toBe(plaintext)
    expect(encrypted.startsWith('enc:')).toBe(true)
    expect(decrypted).toBe(plaintext)
  })

  it('produces different ciphertext for the same input (unique IV)', async () => {
    const plaintext = 'Same input'
    const encrypted1 = await encryptField(plaintext)
    const encrypted2 = await encryptField(plaintext)

    expect(encrypted1).not.toBe(encrypted2)

    // Both decrypt to the same plaintext
    expect(await decryptField(encrypted1)).toBe(plaintext)
    expect(await decryptField(encrypted2)).toBe(plaintext)
  })

  it('handles unicode and special characters', async () => {
    const plaintext = 'Notes: café, naïve, 日本語テスト, emoji 🎵🎹'
    const encrypted = await encryptField(plaintext)
    const decrypted = await decryptField(encrypted)

    expect(decrypted).toBe(plaintext)
  })

  it('handles long text (session notes)', async () => {
    const plaintext = 'Detailed session notes. '.repeat(500)
    const encrypted = await encryptField(plaintext)
    const decrypted = await decryptField(encrypted)

    expect(decrypted).toBe(plaintext)
  })

  it('returns empty/whitespace strings unchanged (no encryption)', async () => {
    expect(await encryptField('')).toBe('')
    expect(await encryptField('   ')).toBe('   ')
  })

  it('decryptField returns unencrypted strings as-is (migration support)', async () => {
    const legacy = 'This is legacy unencrypted data'
    expect(await decryptField(legacy)).toBe(legacy)
  })

  it('decryptField returns empty/null-ish values as-is', async () => {
    expect(await decryptField('')).toBe('')
  })

  it('throws when ENCRYPTION_KEY is missing on encrypt', async () => {
    const originalKey = process.env.ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY

    await expect(encryptField('test')).rejects.toThrow('ENCRYPTION_KEY environment variable is required')

    process.env.ENCRYPTION_KEY = originalKey
  })

  it('throws when ENCRYPTION_KEY is missing on decrypt of encrypted data', async () => {
    // First encrypt with a key
    const encrypted = await encryptField('test data')

    const originalKey = process.env.ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY

    await expect(decryptField(encrypted)).rejects.toThrow('ENCRYPTION_KEY environment variable is required')

    process.env.ENCRYPTION_KEY = originalKey
  })

  it('returns original string when decryption fails (wrong key)', async () => {
    const encrypted = await encryptField('secret data')

    // Change the key
    process.env.ENCRYPTION_KEY = 'b'.repeat(64)

    // Should return original encrypted string on failure (not throw)
    const result = await decryptField(encrypted)
    expect(result).toBe(encrypted)

    // Restore
    process.env.ENCRYPTION_KEY = TEST_KEY
  })
})

describe('isEncrypted', () => {
  it('returns true for encrypted strings', async () => {
    const encrypted = await encryptField('test')
    expect(isEncrypted(encrypted)).toBe(true)
  })

  it('returns false for plain strings', () => {
    expect(isEncrypted('regular text')).toBe(false)
    expect(isEncrypted('encryption is not this')).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isEncrypted(null)).toBe(false)
    expect(isEncrypted(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isEncrypted('')).toBe(false)
  })
})

describe('encryptFields / decryptFields', () => {
  it('encrypts specified fields in an object', async () => {
    const record = {
      id: '123',
      notes: 'Sensitive session notes',
      client_notes: 'Also sensitive',
      status: 'submitted',
    }

    const encrypted = await encryptFields(record, ['notes', 'client_notes'])

    expect(encrypted.id).toBe('123')
    expect(encrypted.status).toBe('submitted')
    expect(encrypted.notes).not.toBe('Sensitive session notes')
    expect(isEncrypted(encrypted.notes)).toBe(true)
    expect(isEncrypted(encrypted.client_notes)).toBe(true)
  })

  it('decrypts specified fields in an object', async () => {
    const record = {
      id: '123',
      notes: 'Sensitive session notes',
      client_notes: 'Also sensitive',
      status: 'submitted',
    }

    const encrypted = await encryptFields(record, ['notes', 'client_notes'])
    const decrypted = await decryptFields(encrypted, ['notes', 'client_notes'])

    expect(decrypted.id).toBe('123')
    expect(decrypted.status).toBe('submitted')
    expect(decrypted.notes).toBe('Sensitive session notes')
    expect(decrypted.client_notes).toBe('Also sensitive')
  })

  it('skips non-string and empty fields', async () => {
    const record = {
      id: 123,
      notes: '',
      status: null,
    }

    const encrypted = await encryptFields(record, ['id', 'notes', 'status'] as (keyof typeof record)[])

    // None of these should be encrypted
    expect(encrypted.id).toBe(123)
    expect(encrypted.notes).toBe('')
    expect(encrypted.status).toBeNull()
  })
})

describe('hashForAudit', () => {
  it('produces a consistent hash for the same input', async () => {
    const hash1 = await hashForAudit('patient notes content')
    const hash2 = await hashForAudit('patient notes content')

    expect(hash1).toBe(hash2)
  })

  it('produces different hashes for different inputs', async () => {
    const hash1 = await hashForAudit('input one')
    const hash2 = await hashForAudit('input two')

    expect(hash1).not.toBe(hash2)
  })

  it('returns a 16-character hex string', async () => {
    const hash = await hashForAudit('some data')

    expect(hash).toHaveLength(16)
    expect(hash).toMatch(/^[0-9a-f]{16}$/)
  })

  it('returns empty string for empty input', async () => {
    expect(await hashForAudit('')).toBe('')
  })
})
