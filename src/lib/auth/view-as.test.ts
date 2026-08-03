import { describe, it, expect } from 'vitest'
import { resolveEffectiveRole, VIEW_AS_COOKIE } from './view-as'

describe('resolveEffectiveRole', () => {
  it('returns the real role when nothing is requested', () => {
    expect(resolveEffectiveRole('developer', null)).toBe('developer')
    expect(resolveEffectiveRole('owner', undefined)).toBe('owner')
    expect(resolveEffectiveRole('admin', '')).toBe('admin')
  })

  it('lets a developer simulate the lesser roles', () => {
    expect(resolveEffectiveRole('developer', 'admin')).toBe('admin')
    expect(resolveEffectiveRole('developer', 'contractor')).toBe('contractor')
    expect(resolveEffectiveRole('developer', 'owner')).toBe('owner')
  })

  it('lets an owner step down', () => {
    expect(resolveEffectiveRole('owner', 'admin')).toBe('admin')
    expect(resolveEffectiveRole('owner', 'contractor')).toBe('contractor')
  })

  // The whole point of validating server-side.
  it('ignores the cookie for roles that may not simulate', () => {
    expect(resolveEffectiveRole('admin', 'owner')).toBe('admin')
    expect(resolveEffectiveRole('admin', 'developer')).toBe('admin')
    expect(resolveEffectiveRole('contractor', 'owner')).toBe('contractor')
    expect(resolveEffectiveRole('contractor', 'admin')).toBe('contractor')
  })

  it('never lets anyone become a developer through the cookie', () => {
    expect(resolveEffectiveRole('owner', 'developer')).toBe('owner')
    expect(resolveEffectiveRole('admin', 'developer')).toBe('admin')
  })

  it('ignores unrecognised values rather than failing open', () => {
    for (const junk of ['superuser', 'DEVELOPER', 'null', '{}', 'admin ', '../owner']) {
      expect(resolveEffectiveRole('developer', junk)).toBe('developer')
    }
  })

  it('returns null when there is no real role', () => {
    expect(resolveEffectiveRole(null, 'owner')).toBeNull()
  })

  it('exposes a stable cookie name', () => {
    expect(VIEW_AS_COOKIE).toBe('mca_view_as')
  })
})
