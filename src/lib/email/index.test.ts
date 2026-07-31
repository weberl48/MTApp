import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getFromAddress, getReplyTo } from './index'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  delete process.env.EMAIL_FROM_DOMAIN
  delete process.env.EMAIL_REPLY_TO
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('getFromAddress', () => {
  it('builds a named From on the verified domain', () => {
    process.env.EMAIL_FROM_DOMAIN = 'maycreativearts.com'
    expect(getFromAddress()).toBe('May Creative Arts <noreply@maycreativearts.com>')
  })

  it('uses the organization name when given', () => {
    process.env.EMAIL_FROM_DOMAIN = 'maycreativearts.com'
    expect(getFromAddress('Other Practice')).toBe('Other Practice <noreply@maycreativearts.com>')
  })

  // Regression: the old `|| 'rattatata.xyz'` fallback meant a missing env var
  // sent from a domain Resend had never verified. Every send 403'd for seven
  // months while /api/health stayed green. Fail loudly instead of silently.
  it('throws rather than falling back to a hardcoded domain', () => {
    expect(() => getFromAddress()).toThrow(/EMAIL_FROM_DOMAIN/)
  })

  it('throws on an empty-string domain', () => {
    process.env.EMAIL_FROM_DOMAIN = ''
    expect(() => getFromAddress()).toThrow(/EMAIL_FROM_DOMAIN/)
  })
})

describe('getReplyTo', () => {
  it('is undefined when nothing is configured', () => {
    expect(getReplyTo()).toBeUndefined()
  })

  it('falls back to the global EMAIL_REPLY_TO', () => {
    process.env.EMAIL_REPLY_TO = 'hello@maycreativearts.com'
    expect(getReplyTo()).toBe('hello@maycreativearts.com')
  })

  it('prefers a per-call override so org-scoped sends reply to that org', () => {
    process.env.EMAIL_REPLY_TO = 'hello@maycreativearts.com'
    expect(getReplyTo('practice@example.com')).toBe('practice@example.com')
  })

  it('ignores null/empty overrides and uses the global default', () => {
    process.env.EMAIL_REPLY_TO = 'hello@maycreativearts.com'
    expect(getReplyTo(null)).toBe('hello@maycreativearts.com')
    expect(getReplyTo('')).toBe('hello@maycreativearts.com')
  })
})
