import { describe, it, expect } from 'vitest'
import { isHealthDetailAuthorized } from './detail-auth'

describe('isHealthDetailAuthorized (regression — health endpoint info disclosure)', () => {
  it('allows detail in non-production', () => {
    expect(isHealthDetailAuthorized(null, undefined, false)).toBe(true)
    expect(isHealthDetailAuthorized(null, 'sekret', false)).toBe(true)
  })

  it('requires the matching cron secret in production', () => {
    expect(isHealthDetailAuthorized(null, 'sekret', true)).toBe(false)
    expect(isHealthDetailAuthorized('Bearer wrong', 'sekret', true)).toBe(false)
    expect(isHealthDetailAuthorized('Bearer sekret', 'sekret', true)).toBe(true)
  })

  it('denies in production when no secret is configured', () => {
    expect(isHealthDetailAuthorized('Bearer ', undefined, true)).toBe(false)
  })
})
