/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { resolveLocationConfig, isLocationSatisfied } from './config'
import { mergeOrganizationSettings } from '@/lib/organization/settings'

const withLists = (custom_lists: Record<string, unknown>) =>
  mergeOrganizationSettings({ custom_lists } as any)

describe('resolveLocationConfig', () => {
  it('returns null when the client has no config and it is not a scholarship group', () => {
    expect(resolveLocationConfig(withLists({}), 'c1', { isScholarshipGroup: false })).toBeNull()
  })

  it('returns the per-client config when present', () => {
    const s = withLists({
      locations_by_client: {
        c1: { label: 'Site', options: ['A'], allow_other: true, required: true },
      },
    })
    expect(resolveLocationConfig(s, 'c1', { isScholarshipGroup: false })?.label).toBe('Site')
  })

  it('applies the per-client config for any payment type, not just groups', () => {
    const s = withLists({
      locations_by_client: {
        c1: { label: 'Site', options: ['A'], allow_other: false, required: true },
      },
    })
    expect(resolveLocationConfig(s, 'c1', { isScholarshipGroup: false })).not.toBeNull()
    expect(resolveLocationConfig(s, 'c1', { isScholarshipGroup: true })?.label).toBe('Site')
  })

  it('falls back to the global classroom list only for scholarship groups', () => {
    const s = withLists({ classrooms: ['Room A', 'Room B'] })
    expect(resolveLocationConfig(s, 'c1', { isScholarshipGroup: false })).toBeNull()
    const g = resolveLocationConfig(s, 'c1', { isScholarshipGroup: true })
    expect(g?.options).toEqual(['Room A', 'Room B'])
    expect(g?.required).toBe(true)
    expect(g?.allow_other).toBe(false)
  })

  it('upgrades a legacy classrooms_by_client entry via the settings merge', () => {
    const s = withLists({ classrooms_by_client: { c1: ['Legacy Room'] } })
    const cfg = resolveLocationConfig(s, 'c1', { isScholarshipGroup: false })
    expect(cfg?.options).toEqual(['Legacy Room'])
    expect(cfg?.required).toBe(true)
  })

  it('treats an empty-options config with allow_other as free text', () => {
    const s = withLists({
      locations_by_client: {
        c1: { label: 'Location', options: [], allow_other: true, required: true },
      },
    })
    const cfg = resolveLocationConfig(s, 'c1', { isScholarshipGroup: false })
    expect(cfg).not.toBeNull()
    expect(cfg!.options).toEqual([])
    expect(cfg!.allow_other).toBe(true)
  })

  it('returns null for an unfillable config (no options, no free text)', () => {
    const s = withLists({
      locations_by_client: {
        c1: { label: 'Location', options: [], allow_other: false, required: true },
      },
    })
    expect(resolveLocationConfig(s, 'c1', { isScholarshipGroup: false })).toBeNull()
  })

  it('returns null without a billed client', () => {
    const s = withLists({
      locations_by_client: {
        c1: { label: 'Site', options: ['A'], allow_other: false, required: true },
      },
    })
    expect(resolveLocationConfig(s, '', { isScholarshipGroup: false })).toBeNull()
  })

  it('tolerates null settings', () => {
    expect(resolveLocationConfig(null, 'c1', { isScholarshipGroup: true })).toBeNull()
  })
})

describe('isLocationSatisfied', () => {
  const cfg = (required: boolean) => ({
    label: 'L',
    options: ['A'],
    allow_other: true,
    required,
  })

  it('rejects blank and whitespace-only values when required', () => {
    expect(isLocationSatisfied(cfg(true), '')).toBe(false)
    expect(isLocationSatisfied(cfg(true), '   ')).toBe(false)
    expect(isLocationSatisfied(cfg(true), 'A')).toBe(true)
  })

  it('accepts blank when not required', () => {
    expect(isLocationSatisfied(cfg(false), '')).toBe(true)
  })

  it('accepts anything when there is no config', () => {
    expect(isLocationSatisfied(null, '')).toBe(true)
  })
})
