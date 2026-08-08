import { describe, it, expect } from 'vitest'
import { createErrorBuffer } from './client-buffer'

const at = () => new Date('2026-08-07T12:00:00.000Z')

describe('createErrorBuffer', () => {
  it('records in order, newest last', () => {
    const buf = createErrorBuffer(10, at)
    buf.record('TypeError', 'first')
    buf.record('TypeError', 'second')
    expect(buf.snapshot().map((e) => e.message)).toEqual(['first', 'second'])
  })

  it('drops the oldest entries past capacity', () => {
    const buf = createErrorBuffer(3, at)
    for (const m of ['a', 'b', 'c', 'd', 'e']) buf.record('Error', m)
    expect(buf.snapshot().map((e) => e.message)).toEqual(['c', 'd', 'e'])
  })

  it('truncates long messages', () => {
    const buf = createErrorBuffer(10, at)
    buf.record('Error', 'x'.repeat(5000))
    expect(buf.snapshot()[0].message).toHaveLength(500)
  })

  it('falls back to a usable kind for junk input', () => {
    const buf = createErrorBuffer(10, at)
    buf.record('', '')
    expect(buf.snapshot()[0].kind).toBe('error')
  })

  it('stamps each entry', () => {
    const buf = createErrorBuffer(10, at)
    buf.record('Error', 'boom')
    expect(buf.snapshot()[0].at).toBe('2026-08-07T12:00:00.000Z')
  })

  it('summarizes kinds with counts, most recent kind first', () => {
    const buf = createErrorBuffer(10, at)
    buf.record('TypeError', 'a')
    buf.record('TypeError', 'b')
    buf.record('console.error', 'c')
    expect(buf.summarizeKinds()).toEqual([
      { kind: 'console.error', count: 1 },
      { kind: 'TypeError', count: 2 },
    ])
  })

  it('summarizeKinds carries no message text — it is the GitHub-safe view', () => {
    const buf = createErrorBuffer(10, at)
    buf.record('TypeError', 'Failed to save Jane Doe')
    expect(JSON.stringify(buf.summarizeKinds())).not.toContain('Jane Doe')
  })

  it('snapshot returns a copy, so callers cannot mutate the buffer', () => {
    const buf = createErrorBuffer(10, at)
    buf.record('Error', 'a')
    buf.snapshot().push({ kind: 'X', message: 'y', at: '' })
    expect(buf.snapshot()).toHaveLength(1)
  })

  it('clears', () => {
    const buf = createErrorBuffer(10, at)
    buf.record('Error', 'a')
    buf.clear()
    expect(buf.snapshot()).toEqual([])
  })
})
