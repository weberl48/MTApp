import type { UserRole } from '@/types/database'

/** All permission actions in the app */
export type Permission =
  | 'session:approve'
  | 'session:delete'
  | 'session:cancel'
  | 'session:mark-no-show'
  | 'session:view-all'
  | 'invoice:bulk-action'
  | 'invoice:delete'
  | 'invoice:send'
  | 'team:view'
  | 'team:manage'
  | 'team:invite'
  | 'team:view-rates'
  | 'client:manage'
  | 'settings:edit'
  | 'analytics:view'
  | 'payments:view'
  | 'financial:view-details'

const ROLE_PERMISSIONS: Record<Permission, UserRole[]> = {
  'session:approve':        ['developer', 'owner', 'admin'],
  'session:delete':         ['developer', 'owner', 'admin'],
  'session:cancel':         ['developer', 'owner', 'admin'],
  'session:mark-no-show':   ['developer', 'owner', 'admin'],
  'session:view-all':       ['developer', 'owner', 'admin'],
  'invoice:bulk-action':    ['developer', 'owner', 'admin'],
  'invoice:delete':         ['developer', 'owner', 'admin'],
  'invoice:send':           ['developer', 'owner', 'admin'],
  'team:view':              ['developer', 'owner', 'admin'],
  'team:manage':            ['developer', 'owner'],
  'team:invite':            ['developer', 'owner', 'admin'],
  // Contractor pay rates are owner business — admins manage sessions and
  // invoices without seeing what each contractor is paid.
  'team:view-rates':        ['developer', 'owner'],
  'client:manage':          ['developer', 'owner', 'admin'],
  'settings:edit':          ['developer', 'owner'],
  'analytics:view':         ['developer', 'owner'],
  'payments:view':          ['developer', 'owner'],
  'financial:view-details': ['developer', 'owner'],
}

export function can(role: UserRole | null, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[permission]?.includes(role) ?? false
}

/**
 * The only permissions an owner may hand to admins (Settings > Profile & Security).
 * A closed list on purpose: settings are user-editable JSONB, so a stray key must
 * never be able to invent a grant. Everything else stays role-decided forever —
 * in particular `settings:edit`, or an admin could grant themselves the rest.
 */
export const ADMIN_GRANTABLE_PERMISSIONS = [
  'team:view-rates',
  'financial:view-details',
  'analytics:view',
  'payments:view',
] as const

export type AdminGrantablePermission = (typeof ADMIN_GRANTABLE_PERMISSIONS)[number]

/** Which grantable permissions this organization has turned on for admins. */
export type AdminGrants = Partial<Record<AdminGrantablePermission, boolean>>

export function isAdminGrantable(permission: Permission): permission is AdminGrantablePermission {
  return (ADMIN_GRANTABLE_PERMISSIONS as readonly Permission[]).includes(permission)
}

/**
 * `can()` plus the organization's admin grants. Only the `admin` role is ever
 * elevated — contractors are never affected, and owner/developer already pass the
 * role check — so a grant can widen what an admin sees and nothing else.
 */
export function canWithGrants(
  role: UserRole | null,
  permission: Permission,
  grants: AdminGrants | null | undefined
): boolean {
  if (can(role, permission)) return true
  if (role !== 'admin' || !grants) return false
  return isAdminGrantable(permission) && grants[permission] === true
}
