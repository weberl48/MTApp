import { describe, it, expect } from 'vitest'
import { createReportGate, formatConsoleArg, consoleArgsToMessage } from './error-report'

describe('createReportGate', () => {
  it('lets a fresh key through and suppresses an immediate repeat', () => {
    const t = 0
    const gate = createReportGate({ now: () => t })
    expect(gate('a')).toBe(true)
    expect(gate('a')).toBe(false)
  })

  it('lets the same key through again after the dedupe window', () => {
    let t = 0
    const gate = createReportGate({ now: () => t, dedupeMs: 5000 })
    expect(gate('a')).toBe(true)
    t = 5001
    expect(gate('a')).toBe(true)
  })

  it('caps total reports per rolling window across distinct keys', () => {
    let t = 0
    const gate = createReportGate({ now: () => t, maxPerWindow: 3, windowMs: 60000 })
    expect(gate('a')).toBe(true)
    expect(gate('b')).toBe(true)
    expect(gate('c')).toBe(true)
    expect(gate('d')).toBe(false)
    t = 60001
    expect(gate('d')).toBe(true)
  })

  it('prunes the dedupe map instead of growing without bound', () => {
    let t = 0
    const gate = createReportGate({ now: () => t, maxPerWindow: 1000, windowMs: 1 })
    for (let i = 0; i < 300; i++) {
      t += 10_000
      gate(`key-${i}`)
    }
    // Re-reporting an old key succeeds because it was pruned, not remembered.
    expect(gate('key-0')).toBe(true)
  })
})

describe('formatConsoleArg', () => {
  it('formats errors as name: message', () => {
    expect(formatConsoleArg(new TypeError('boom'))).toBe('TypeError: boom')
  })

  it('passes strings through and stringifies objects', () => {
    expect(formatConsoleArg('plain')).toBe('plain')
    expect(formatConsoleArg({ a: 1 })).toBe('{"a":1}')
  })

  it('never throws on circular structures', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(formatConsoleArg(circular)).toBe('[unserializable]')
  })

  it('handles undefined, which JSON.stringify returns undefined for', () => {
    expect(formatConsoleArg(undefined)).toBe('undefined')
  })
})

describe('consoleArgsToMessage', () => {
  it('joins mixed args and truncates to 2000 chars', () => {
    expect(consoleArgsToMessage(['failed:', new Error('x')])).toBe('failed: Error: x')
    expect(consoleArgsToMessage(['y'.repeat(3000)]).length).toBe(2000)
  })
})
