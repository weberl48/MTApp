import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isPilotModeActive,
  getPilotRecipients,
  applyPilotRedirect,
  getPilotSquareRecipient,
  PILOT_ENV_VAR,
} from './pilot'

const ORIGINAL_VALUE = process.env[PILOT_ENV_VAR]

beforeEach(() => {
  delete process.env[PILOT_ENV_VAR]
})

afterEach(() => {
  if (ORIGINAL_VALUE === undefined) {
    delete process.env[PILOT_ENV_VAR]
  } else {
    process.env[PILOT_ENV_VAR] = ORIGINAL_VALUE
  }
})

describe('isPilotModeActive', () => {
  it('is false when the var is unset', () => {
    expect(isPilotModeActive()).toBe(false)
  })

  it('is false when the var is whitespace-only', () => {
    process.env[PILOT_ENV_VAR] = '   '
    expect(isPilotModeActive()).toBe(false)
  })

  it('is true when the var has a usable-looking value', () => {
    process.env[PILOT_ENV_VAR] = 'tester@example.com'
    expect(isPilotModeActive()).toBe(true)
  })
})

describe('getPilotRecipients', () => {
  it('is empty when the var is unset', () => {
    expect(getPilotRecipients()).toEqual([])
  })

  it('parses a single address', () => {
    process.env[PILOT_ENV_VAR] = 'tester@example.com'
    expect(getPilotRecipients()).toEqual(['tester@example.com'])
  })

  it('parses comma-separated addresses', () => {
    process.env[PILOT_ENV_VAR] = 'a@example.com,b@example.com'
    expect(getPilotRecipients()).toEqual(['a@example.com', 'b@example.com'])
  })

  it('parses semicolon-separated addresses', () => {
    process.env[PILOT_ENV_VAR] = 'a@example.com;b@example.com'
    expect(getPilotRecipients()).toEqual(['a@example.com', 'b@example.com'])
  })

  it('parses newline/space-separated addresses', () => {
    process.env[PILOT_ENV_VAR] = 'a@example.com\n b@example.com   c@example.com'
    expect(getPilotRecipients()).toEqual(['a@example.com', 'b@example.com', 'c@example.com'])
  })

  it('dedupes case-insensitively, preserving the first-seen casing', () => {
    process.env[PILOT_ENV_VAR] = 'Tester@Example.com, tester@example.com, TESTER@EXAMPLE.COM'
    expect(getPilotRecipients()).toEqual(['Tester@Example.com'])
  })

  it('drops entries with no @', () => {
    process.env[PILOT_ENV_VAR] = 'not-an-address, ok@example.com'
    expect(getPilotRecipients()).toEqual(['ok@example.com'])
  })

  it('drops entries starting or ending with @', () => {
    process.env[PILOT_ENV_VAR] = '@example.com, ok@example.com, ok@'
    expect(getPilotRecipients()).toEqual(['ok@example.com'])
  })

  it('strips surrounding quotes and angle brackets', () => {
    process.env[PILOT_ENV_VAR] = `"a@example.com", <b@example.com>, '<c@example.com>'`
    expect(getPilotRecipients()).toEqual(['a@example.com', 'b@example.com', 'c@example.com'])
  })
})

describe('applyPilotRedirect', () => {
  it('passes through unchanged when the var is unset', () => {
    const result = applyPilotRedirect('client@example.com', 'Invoice 123')
    expect(result).toEqual({
      to: ['client@example.com'],
      subject: 'Invoice 123',
      redirected: false,
      originalTo: ['client@example.com'],
      htmlBanner: '',
      textBanner: '',
    })
  })

  it('passes through unchanged when the var is whitespace-only', () => {
    process.env[PILOT_ENV_VAR] = '   '
    const result = applyPilotRedirect('client@example.com', 'Invoice 123')
    expect(result.redirected).toBe(false)
    expect(result.to).toEqual(['client@example.com'])
    expect(result.subject).toBe('Invoice 123')
    expect(result.htmlBanner).toBe('')
    expect(result.textBanner).toBe('')
  })

  // Most important case: a typo'd or shell-mangled value must never silently
  // fall through to real client delivery.
  it('throws when pilot mode is on but the value has no usable addresses', () => {
    process.env[PILOT_ENV_VAR] = 'not-an-address, @nope, nope@'
    expect(() => applyPilotRedirect('client@example.com', 'Invoice 123')).toThrow()
  })

  it('redirects to the pilot recipients and prefixes the subject for one intended recipient', () => {
    process.env[PILOT_ENV_VAR] = 'tester@example.com'
    const result = applyPilotRedirect('client@example.com', 'Invoice 123')
    expect(result.redirected).toBe(true)
    expect(result.to).toEqual(['tester@example.com'])
    expect(result.originalTo).toEqual(['client@example.com'])
    expect(result.subject).toBe('[PILOT → client@example.com] Invoice 123')
  })

  it('names both intended recipients when there are exactly two', () => {
    process.env[PILOT_ENV_VAR] = 'tester@example.com'
    const result = applyPilotRedirect(['a@example.com', 'b@example.com'], 'Invoice 123')
    expect(result.subject).toBe('[PILOT → a@example.com, b@example.com] Invoice 123')
  })

  it('elides with "+N more" when there are three or more intended recipients', () => {
    process.env[PILOT_ENV_VAR] = 'tester@example.com'
    const result = applyPilotRedirect(
      ['a@example.com', 'b@example.com', 'c@example.com'],
      'Invoice 123'
    )
    expect(result.subject).toBe('[PILOT → a@example.com, b@example.com +1 more] Invoice 123')
  })

  it('produces non-empty banners naming the intended recipient when redirected', () => {
    process.env[PILOT_ENV_VAR] = 'tester@example.com'
    const result = applyPilotRedirect('client@example.com', 'Invoice 123')
    expect(result.htmlBanner).not.toBe('')
    expect(result.textBanner).not.toBe('')
    expect(result.htmlBanner).toContain('client@example.com')
    expect(result.textBanner).toContain('client@example.com')
  })
})

describe('getPilotSquareRecipient', () => {
  it('returns null when the var is unset', () => {
    expect(getPilotSquareRecipient()).toBeNull()
  })

  it('returns the first pilot recipient when active', () => {
    process.env[PILOT_ENV_VAR] = 'first@example.com, second@example.com'
    expect(getPilotSquareRecipient()).toBe('first@example.com')
  })

  it('throws when pilot mode is on but the value has no usable addresses', () => {
    process.env[PILOT_ENV_VAR] = 'not-an-address'
    expect(() => getPilotSquareRecipient()).toThrow()
  })
})
