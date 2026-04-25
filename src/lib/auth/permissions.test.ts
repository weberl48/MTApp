import { can } from './permissions'
import type { Permission } from './permissions'
import type { UserRole } from '@/types/database'

describe('can (permission check)', () => {
  const allRoles: UserRole[] = ['developer', 'owner', 'admin', 'contractor']

  const allPermissions: Permission[] = [
    'session:approve',
    'session:delete',
    'session:cancel',
    'session:mark-no-show',
    'session:view-all',
    'invoice:bulk-action',
    'invoice:delete',
    'invoice:send',
    'team:view',
    'team:manage',
    'team:invite',
    'settings:edit',
    'analytics:view',
    'payments:view',
    'financial:view-details',
  ]

  // --- Developer: full access ---
  describe('developer role', () => {
    it('has access to all permissions', () => {
      for (const perm of allPermissions) {
        expect(can('developer', perm)).toBe(true)
      }
    })
  })

  // --- Owner: full org access ---
  describe('owner role', () => {
    it('has access to all permissions', () => {
      for (const perm of allPermissions) {
        expect(can('owner', perm)).toBe(true)
      }
    })
  })

  // --- Admin: operational access ---
  describe('admin role', () => {
    const adminAllowed: Permission[] = [
      'session:approve',
      'session:delete',
      'session:cancel',
      'session:mark-no-show',
      'session:view-all',
      'invoice:bulk-action',
      'invoice:delete',
      'invoice:send',
      'team:view',
      'team:invite',
    ]

    const adminDenied: Permission[] = [
      'team:manage',
      'settings:edit',
      'analytics:view',
      'payments:view',
      'financial:view-details',
    ]

    it.each(adminAllowed)('can %s', (perm) => {
      expect(can('admin', perm)).toBe(true)
    })

    it.each(adminDenied)('cannot %s', (perm) => {
      expect(can('admin', perm)).toBe(false)
    })
  })

  // --- Contractor: limited access ---
  describe('contractor role', () => {
    it('has no administrative permissions', () => {
      for (const perm of allPermissions) {
        expect(can('contractor', perm)).toBe(false)
      }
    })
  })

  // --- Null role ---
  describe('null role', () => {
    it('returns false for all permissions', () => {
      for (const perm of allPermissions) {
        expect(can(null, perm)).toBe(false)
      }
    })
  })

  // --- Specific permission boundaries ---
  describe('permission boundaries', () => {
    it('team:manage is restricted to developer and owner only', () => {
      expect(can('developer', 'team:manage')).toBe(true)
      expect(can('owner', 'team:manage')).toBe(true)
      expect(can('admin', 'team:manage')).toBe(false)
      expect(can('contractor', 'team:manage')).toBe(false)
    })

    it('settings:edit is restricted to developer and owner only', () => {
      expect(can('developer', 'settings:edit')).toBe(true)
      expect(can('owner', 'settings:edit')).toBe(true)
      expect(can('admin', 'settings:edit')).toBe(false)
      expect(can('contractor', 'settings:edit')).toBe(false)
    })

    it('financial:view-details is restricted to developer and owner only', () => {
      expect(can('developer', 'financial:view-details')).toBe(true)
      expect(can('owner', 'financial:view-details')).toBe(true)
      expect(can('admin', 'financial:view-details')).toBe(false)
      expect(can('contractor', 'financial:view-details')).toBe(false)
    })

    it('team:invite includes admin but not contractor', () => {
      expect(can('admin', 'team:invite')).toBe(true)
      expect(can('contractor', 'team:invite')).toBe(false)
    })
  })
})
