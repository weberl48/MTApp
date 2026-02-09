import {
  encryptPhiForSave,
  decryptPhiFromDb,
  decryptPhiArray,
  isEncryptionEnabled,
  getEncryptionStatus,
  PHI_FIELDS,
} from './phi'
import { isEncrypted } from './index'

const TEST_KEY = 'a'.repeat(64)

beforeAll(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY
})

afterAll(() => {
  delete process.env.ENCRYPTION_KEY
})

describe('PHI_FIELDS', () => {
  it('defines PHI fields for sessions', () => {
    expect(PHI_FIELDS.sessions).toEqual(['notes', 'client_notes'])
  })

  it('defines PHI fields for clients', () => {
    expect(PHI_FIELDS.clients).toEqual(['notes'])
  })

  it('defines PHI fields for client_goals', () => {
    expect(PHI_FIELDS.client_goals).toEqual(['description'])
  })
})

describe('encryptPhiForSave', () => {
  it('encrypts PHI fields for sessions table', async () => {
    const data = {
      id: 'session-1',
      notes: 'Patient showed improvement',
      client_notes: 'Family feedback was positive',
      status: 'submitted',
      duration: 30,
    }

    const encrypted = await encryptPhiForSave('sessions', data)

    expect(encrypted.id).toBe('session-1')
    expect(encrypted.status).toBe('submitted')
    expect(encrypted.duration).toBe(30)
    expect(isEncrypted(encrypted.notes as string)).toBe(true)
    expect(isEncrypted(encrypted.client_notes as string)).toBe(true)
  })

  it('encrypts PHI fields for clients table', async () => {
    const data = {
      id: 'client-1',
      name: 'Test Client',
      notes: 'Medical history details',
    }

    const encrypted = await encryptPhiForSave('clients', data)

    expect(encrypted.name).toBe('Test Client')
    expect(isEncrypted(encrypted.notes as string)).toBe(true)
  })

  it('skips empty and missing PHI fields', async () => {
    const data = {
      id: 'session-1',
      notes: '',
      status: 'draft',
    }

    const encrypted = await encryptPhiForSave('sessions', data)

    expect(encrypted.notes).toBe('')
    expect(encrypted.status).toBe('draft')
  })

  it('does not mutate the original object', async () => {
    const data = { id: '1', notes: 'Original notes' }
    const encrypted = await encryptPhiForSave('clients', data)

    expect(data.notes).toBe('Original notes')
    expect(encrypted.notes).not.toBe('Original notes')
  })
})

describe('decryptPhiFromDb', () => {
  it('decrypts PHI fields after encryption round-trip', async () => {
    const original = {
      id: 'session-1',
      notes: 'Patient session notes here',
      client_notes: 'Client feedback notes',
      status: 'approved',
    }

    const encrypted = await encryptPhiForSave('sessions', original)
    const decrypted = await decryptPhiFromDb('sessions', encrypted)

    expect(decrypted!.notes).toBe('Patient session notes here')
    expect(decrypted!.client_notes).toBe('Client feedback notes')
    expect(decrypted!.status).toBe('approved')
  })

  it('returns null for null input', async () => {
    expect(await decryptPhiFromDb('sessions', null)).toBeNull()
  })

  it('passes through unencrypted (legacy) data unchanged', async () => {
    const legacyData = {
      id: 'session-1',
      notes: 'Legacy unencrypted notes',
      status: 'submitted',
    }

    const result = await decryptPhiFromDb('sessions', legacyData)

    expect(result!.notes).toBe('Legacy unencrypted notes')
  })
})

describe('decryptPhiArray', () => {
  it('decrypts an array of records', async () => {
    const records = [
      { id: '1', notes: 'Note 1' },
      { id: '2', notes: 'Note 2' },
    ]

    const encrypted = await Promise.all(
      records.map(r => encryptPhiForSave('clients', r))
    )
    const decrypted = await decryptPhiArray('clients', encrypted)

    expect(decrypted).toHaveLength(2)
    expect(decrypted[0].notes).toBe('Note 1')
    expect(decrypted[1].notes).toBe('Note 2')
  })

  it('returns empty array for null input', async () => {
    expect(await decryptPhiArray('sessions', null)).toEqual([])
  })
})

describe('isEncryptionEnabled', () => {
  it('returns true when ENCRYPTION_KEY is set', () => {
    expect(isEncryptionEnabled()).toBe(true)
  })

  it('returns false when ENCRYPTION_KEY is unset', () => {
    const originalKey = process.env.ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY

    expect(isEncryptionEnabled()).toBe(false)

    process.env.ENCRYPTION_KEY = originalKey
  })

  it('returns false when ENCRYPTION_KEY is empty', () => {
    const originalKey = process.env.ENCRYPTION_KEY
    process.env.ENCRYPTION_KEY = ''

    expect(isEncryptionEnabled()).toBe(false)

    process.env.ENCRYPTION_KEY = originalKey
  })
})

describe('getEncryptionStatus', () => {
  it('returns enabled status when key is set', () => {
    const status = getEncryptionStatus()

    expect(status.enabled).toBe(true)
    expect(status.message).toBe('PHI encryption is enabled')
  })

  it('returns disabled status when key is not set', () => {
    const originalKey = process.env.ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY

    const status = getEncryptionStatus()

    expect(status.enabled).toBe(false)
    expect(status.message).toContain('disabled')

    process.env.ENCRYPTION_KEY = originalKey
  })
})
