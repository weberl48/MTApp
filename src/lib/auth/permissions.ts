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
  'settings:edit':          ['developer', 'owner'],
  'analytics:view':         ['developer', 'owner'],
  'payments:view':          ['developer', 'owner'],
  'financial:view-details': ['developer', 'owner'],
}

export function can(role: UserRole | null, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[permission]?.includes(role) ?? false
}
