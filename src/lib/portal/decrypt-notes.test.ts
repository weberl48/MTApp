import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { encryptField } from '@/lib/crypto'
import { decryptClientNotesForPortal } from './decrypt-notes'

const TEST_KEY = 'a'.repeat(64)
beforeAll(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY
})
afterAll(() => {
  delete process.env.ENCRYPTION_KEY
})

describe('decryptClientNotesForPortal (regression for #38 — portal showed encrypted notes)', () => {
  it('decrypts an encrypted client note so the client sees plaintext', async () => {
    const enc = await encryptField('See you next week!')
    expect(enc.startsWith('enc:')).toBe(true)
    expect(await decryptClientNotesForPortal(enc)).toBe('See you next week!')
  })

  it('passes through legacy plaintext notes unchanged', async () => {
    expect(await decryptClientNotesForPortal('plain legacy note')).toBe('plain legacy note')
  })

  it('handles null/empty/undefined', async () => {
    expect(await decryptClientNotesForPortal(null)).toBeNull()
    expect(await decryptClientNotesForPortal('')).toBeNull()
    expect(await decryptClientNotesForPortal(undefined)).toBeNull()
  })
})
