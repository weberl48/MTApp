import { describe, it, expect } from 'vitest'
import { timingSafeEqualString, verifyBearerSecret } from './bearer'

describe('timingSafeEqualString', () => {
  it('matches identical strings', () => {
    expect(timingSafeEqualString('abc', 'abc')).toBe(true)
    expect(timingSafeEqualString('', '')).toBe(true)
  })

  it('rejects different content and different lengths', () => {
    expect(timingSafeEqualString('abc', 'abd')).toBe(false)
    expect(timingSafeEqualString('abc', 'abcd')).toBe(false)
    expect(timingSafeEqualString('abc', '')).toBe(false)
  })
})

describe('verifyBearerSecret (regression — cron auth used to fail OPEN)', () => {
  it('accepts the exact Bearer form', () => {
    expect(verifyBearerSecret('Bearer sekret', 'sekret')).toBe(true)
  })

  it('rejects a wrong or malformed token', () => {
    expect(verifyBearerSecret('Bearer wrong', 'sekret')).toBe(false)
    expect(verifyBearerSecret('sekret', 'sekret')).toBe(false)
    expect(verifyBearerSecret('bearer sekret', 'sekret')).toBe(false)
    expect(verifyBearerSecret('Bearer sekret ', 'sekret')).toBe(false)
  })

  it('fails CLOSED when the secret is unset — any header used to pass off-production', () => {
    expect(verifyBearerSecret('Bearer anything', undefined)).toBe(false)
    expect(verifyBearerSecret('Bearer anything', '')).toBe(false)
    expect(verifyBearerSecret('Bearer anything', null)).toBe(false)
  })

  it('fails closed when the header is absent', () => {
    expect(verifyBearerSecret(null, 'sekret')).toBe(false)
    expect(verifyBearerSecret(undefined, 'sekret')).toBe(false)
    expect(verifyBearerSecret('', 'sekret')).toBe(false)
  })
})
