import { describe, expect, it } from 'vitest'
import { isLocationProvided, resolveLocationField } from './resolve'

describe('resolveLocationField', () => {
  it('returns null when nothing is flagged', () => {
    expect(
      resolveLocationField({ requires_classroom: false }, [{ requires_location: false }])
    ).toBeNull()
  })

  it('returns Classroom for a flagged service type', () => {
    expect(resolveLocationField({ requires_classroom: true }, [])).toEqual({
      label: 'Classroom',
    })
  })

  it('returns Location when a client is flagged', () => {
    expect(
      resolveLocationField({ requires_classroom: false }, [{ requires_location: true }])
    ).toEqual({ label: 'Location' })
  })

  it('lets the service flag win the label when both apply', () => {
    expect(
      resolveLocationField({ requires_classroom: true }, [{ requires_location: true }])
    ).toEqual({ label: 'Classroom' })
  })

  it('triggers on any flagged client among several', () => {
    expect(
      resolveLocationField(null, [
        { requires_location: false },
        { requires_location: true },
        { requires_location: false },
      ])
    ).toEqual({ label: 'Location' })
  })

  it('tolerates a null or undefined service type', () => {
    expect(resolveLocationField(null, [])).toBeNull()
    expect(resolveLocationField(undefined, [{ requires_location: true }])).toEqual({
      label: 'Location',
    })
  })
})

describe('isLocationProvided', () => {
  it('rejects empty and whitespace-only values', () => {
    expect(isLocationProvided('')).toBe(false)
    expect(isLocationProvided('   ')).toBe(false)
  })

  it('accepts a real value', () => {
    expect(isLocationProvided('Room 4')).toBe(true)
  })
})
