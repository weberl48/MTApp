import {
  can,
  canWithGrants,
  isAdminGrantable,
  ADMIN_GRANTABLE_PERMISSIONS,
} from './permissions'
import type { AdminGrants, Permission } from './permissions'
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
    'team:view-rates',
    'client:manage',
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
      'client:manage',
    ]

    const adminDenied: Permission[] = [
      'team:manage',
      'team:view-rates',
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

    it('team:view-rates is restricted to developer and owner only', () => {
      expect(can('developer', 'team:view-rates')).toBe(true)
      expect(can('owner', 'team:view-rates')).toBe(true)
      expect(can('admin', 'team:view-rates')).toBe(false)
      expect(can('contractor', 'team:view-rates')).toBe(false)
    })

    it('team:invite includes admin but not contractor', () => {
      expect(can('admin', 'team:invite')).toBe(true)
      expect(can('contractor', 'team:invite')).toBe(false)
    })

    it('client:manage includes admin but not contractor (regression for #42)', () => {
      expect(can('developer', 'client:manage')).toBe(true)
      expect(can('owner', 'client:manage')).toBe(true)
      expect(can('admin', 'client:manage')).toBe(true)
      expect(can('contractor', 'client:manage')).toBe(false)
    })
  })
})

describe('canWithGrants (owner-configurable admin visibility)', () => {
  const ALL: AdminGrants = {
    'team:view-rates': true,
    'financial:view-details': true,
    'analytics:view': true,
    'payments:view': true,
  }

  it('grants a listed permission to an admin when the owner turned it on', () => {
    for (const permission of ADMIN_GRANTABLE_PERMISSIONS) {
      expect(can('admin', permission)).toBe(false)
      expect(canWithGrants('admin', permission, ALL)).toBe(true)
    }
  })

  it('changes nothing when there are no grants', () => {
    for (const permission of ADMIN_GRANTABLE_PERMISSIONS) {
      expect(canWithGrants('admin', permission, {})).toBe(false)
      expect(canWithGrants('admin', permission, null)).toBe(false)
      expect(canWithGrants('admin', permission, undefined)).toBe(false)
    }
  })

  // The whole point of the feature: a grant widens what an ADMIN sees, nothing else.
  it('never elevates a contractor, whatever the settings say', () => {
    for (const permission of ADMIN_GRANTABLE_PERMISSIONS) {
      expect(canWithGrants('contractor', permission, ALL)).toBe(false)
    }
    expect(canWithGrants(null, 'payments:view', ALL)).toBe(false)
  })

  it('leaves owner and developer exactly as they were', () => {
    for (const permission of ADMIN_GRANTABLE_PERMISSIONS) {
      expect(canWithGrants('owner', permission, {})).toBe(true)
      expect(canWithGrants('developer', permission, {})).toBe(true)
    }
  })

  // Settings are user-editable JSONB. A stray or hostile key must not become a grant —
  // above all `settings:edit`, which would let an admin grant themselves everything else.
  it('ignores grants for permissions that are not grantable', () => {
    const forged = { 'settings:edit': true, 'session:approve': true } as unknown as AdminGrants
    expect(canWithGrants('admin', 'settings:edit', forged)).toBe(false)
    expect(canWithGrants('contractor', 'session:approve', forged)).toBe(false)
    expect(isAdminGrantable('settings:edit')).toBe(false)
    expect(isAdminGrantable('team:view-rates')).toBe(true)
  })

  it('only ever grants the permission that was turned on', () => {
    const onlyRates: AdminGrants = { 'team:view-rates': true }
    expect(canWithGrants('admin', 'team:view-rates', onlyRates)).toBe(true)
    expect(canWithGrants('admin', 'payments:view', onlyRates)).toBe(false)
    expect(canWithGrants('admin', 'analytics:view', onlyRates)).toBe(false)
    expect(canWithGrants('admin', 'financial:view-details', onlyRates)).toBe(false)
  })

  it('treats a falsy flag as no grant', () => {
    const off = { 'payments:view': false } as AdminGrants
    expect(canWithGrants('admin', 'payments:view', off)).toBe(false)
  })
})
