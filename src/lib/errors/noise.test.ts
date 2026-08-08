import { describe, it, expect } from 'vitest'
import { isIgnorableClientError, NOISE_PATTERN_COUNT, NOISE_REASONS } from './noise'

describe('isIgnorableClientError', () => {
  it('drops the Next.js RSC prefetch miss that flooded the feed', () => {
    expect(
      isIgnorableClientError(
        'Failed to fetch RSC payload for http://localhost:3000/login/. Falling back to browser navigation.'
      )
    ).toBe(true)
  })

  it('drops benign browser notices', () => {
    expect(isIgnorableClientError('ResizeObserver loop limit exceeded')).toBe(true)
    expect(
      isIgnorableClientError('ResizeObserver loop completed with undelivered notifications.')
    ).toBe(true)
  })

  it('drops extension noise', () => {
    expect(isIgnorableClientError('Extension context invalidated.')).toBe(true)
    expect(isIgnorableClientError('Error at chrome-extension://abcdef/inject.js')).toBe(true)
  })

  it('drops aborted requests — the user navigated away, nothing failed', () => {
    expect(isIgnorableClientError('AbortError: The operation was aborted.')).toBe(true)
  })

  it('drops opaque cross-origin script errors that carry no detail', () => {
    expect(isIgnorableClientError('Script error.')).toBe(true)
  })

  it('drops empty and whitespace-only messages', () => {
    expect(isIgnorableClientError('')).toBe(true)
    expect(isIgnorableClientError('   ')).toBe(true)
    expect(isIgnorableClientError(null)).toBe(true)
    expect(isIgnorableClientError(undefined)).toBe(true)
  })

  // The half that actually matters: the filter must not eat real bugs.
  it('KEEPS genuine application errors', () => {
    const real = [
      "Cannot read properties of undefined (reading 'total')",
      'Failed to save session: duplicate key value violates unique constraint',
      'TypeError: contractor.rate is not a function',
      '[dashboard boundary] Something exploded',
      'Invoice send failed: 403 Forbidden',
      'NetworkError when attempting to fetch resource.',
    ]
    for (const message of real) {
      expect(isIgnorableClientError(message), message).toBe(false)
    }
  })

  it('does not silence a real error merely for mentioning a noisy word', () => {
    // "fetch" and "payload" appear in the RSC pattern; this is still a real bug.
    expect(isIgnorableClientError('Failed to fetch invoice payload from Square')).toBe(false)
    // Contains "aborted" but is our own message about a business action.
    expect(isIgnorableClientError('Batch aborted because a client had no rate')).toBe(false)
  })

  it('every pattern carries a stated reason — no unexplained filtering', () => {
    expect(NOISE_REASONS).toHaveLength(NOISE_PATTERN_COUNT)
    for (const why of NOISE_REASONS) {
      expect(why.length).toBeGreaterThan(10)
    }
  })
})
