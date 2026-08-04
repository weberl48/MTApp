import { describe, it, expect, vi, beforeEach } from 'vitest'

const listFactors = vi.fn()

vi.mock('./client', () => ({
  createClient: () => ({ auth: { mfa: { listFactors } } }),
}))

import { getMfaFactors, hasMfaEnabled } from './mfa'

const verifiedFactor = {
  id: 'f1',
  factor_type: 'totp',
  status: 'verified',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}

describe('getMfaFactors (regression — transient listFactors error must not read as "no factors")', () => {
  beforeEach(() => {
    listFactors.mockReset()
  })

  it('returns the totp factors on success', async () => {
    listFactors.mockResolvedValue({ data: { totp: [verifiedFactor] }, error: null })
    expect(await getMfaFactors()).toEqual([verifiedFactor])
    expect(listFactors).toHaveBeenCalledTimes(1)
  })

  it('retries once and succeeds after a transient error', async () => {
    listFactors
      .mockResolvedValueOnce({ data: null, error: new Error('fetch failed') })
      .mockResolvedValueOnce({ data: { totp: [verifiedFactor] }, error: null })
    expect(await getMfaFactors()).toEqual([verifiedFactor])
    expect(listFactors).toHaveBeenCalledTimes(2)
  })

  it('returns null — NOT an empty list — when every attempt errors', async () => {
    listFactors.mockResolvedValue({ data: null, error: new Error('fetch failed') })
    expect(await getMfaFactors()).toBeNull()
    expect(listFactors).toHaveBeenCalledTimes(2)
  })
})

describe('hasMfaEnabled', () => {
  beforeEach(() => {
    listFactors.mockReset()
  })

  it('true when a verified factor exists', async () => {
    listFactors.mockResolvedValue({ data: { totp: [verifiedFactor] }, error: null })
    expect(await hasMfaEnabled()).toBe(true)
  })

  it('false when the user genuinely has no verified factors', async () => {
    listFactors.mockResolvedValue({ data: { totp: [] }, error: null })
    expect(await hasMfaEnabled()).toBe(false)
  })

  it('null (unknown) when the check fails — the enforcement guard must not block on this', async () => {
    listFactors.mockResolvedValue({ data: null, error: new Error('fetch failed') })
    expect(await hasMfaEnabled()).toBeNull()
  })
})
