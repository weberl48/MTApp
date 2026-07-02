'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'
import { handleSupabaseError, revalidateTeamPaths } from '@/lib/actions/helpers'
import { logger } from '@/lib/logger'

const ASSIGNABLE_ROLES: UserRole[] = ['developer', 'owner', 'admin', 'contractor']

/**
 * Change a team member's role.
 *
 * Role changes MUST go through this action: a BEFORE UPDATE trigger on `users` makes
 * `role`/`organization_id` immutable for the authenticated (browser) role, so the update
 * is performed with the service client AFTER the authz checks below. This closes the P0
 * where any user could self-escalate to `developer` by writing their own row directly.
 */
export async function updateUserRole(memberId: string, newRole: UserRole) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  if (!ASSIGNABLE_ROLES.includes(newRole)) {
    return { success: false as const, error: 'Invalid role' }
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const callerRole = (currentUser?.role as UserRole | undefined) ?? null
  if (!can(callerRole, 'team:manage')) {
    return { success: false as const, error: 'Permission denied' }
  }

  // Never let someone change their own role (prevents an owner self-demoting into a lockout
  // and prevents any self-escalation path).
  if (memberId === user.id) {
    return { success: false as const, error: 'You cannot change your own role' }
  }

  const { data: member } = await supabase
    .from('users')
    .select('role, organization_id, name')
    .eq('id', memberId)
    .single()

  if (!member) {
    return { success: false as const, error: 'Team member not found' }
  }

  // Non-developers may only manage members in their own organization.
  if (callerRole !== 'developer' && member.organization_id !== currentUser?.organization_id) {
    return { success: false as const, error: 'Permission denied' }
  }

  // Only a developer may grant or modify the `developer` role.
  if ((newRole === 'developer' || member.role === 'developer') && callerRole !== 'developer') {
    return { success: false as const, error: 'Only a developer can assign the developer role' }
  }

  // Only owners/developers may grant or modify the `owner` role (owners are already gated by
  // team:manage, but be explicit).
  if ((newRole === 'owner' || member.role === 'owner') && callerRole !== 'owner' && callerRole !== 'developer') {
    return { success: false as const, error: 'Only an owner can change owner roles' }
  }

  // Service client bypasses RLS and the immutability trigger; all authz is enforced above.
  const service = createServiceClient()
  let updateQuery = service
    .from('users')
    .update({ role: newRole, updated_at: new Date().toISOString() }, { count: 'exact' })
    .eq('id', memberId)
  if (callerRole !== 'developer') {
    updateQuery = updateQuery.eq('organization_id', currentUser?.organization_id ?? '')
  }
  const { error, count } = await updateQuery

  const err = handleSupabaseError(error)
  if (err) return err

  if (!count) {
    return { success: false as const, error: 'Team member not found' }
  }

  revalidateTeamPaths()
  return { success: true as const }
}

export async function removeTeamMember(memberId: string) {
  const supabase = await createClient()

  // Get current user to check permissions
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if current user is owner, admin, or developer
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!can(currentUser?.role as UserRole ?? null, 'team:invite')) {
    return { success: false, error: 'Permission denied' }
  }

  // Prevent removing yourself
  if (memberId === user.id) {
    return { success: false, error: 'Cannot remove yourself' }
  }

  // Get the member being removed
  const { data: memberToRemove } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', memberId)
    .single()

  if (!memberToRemove) {
    return { success: false, error: 'Team member not found' }
  }

  // Only developers and owners can remove owners
  if (memberToRemove.role === 'owner' && currentUser?.role !== 'developer' && currentUser?.role !== 'owner') {
    return { success: false, error: 'Only owners can remove other owners' }
  }

  // Only owners/developers can remove admins
  if (
    memberToRemove.role === 'admin' &&
    currentUser?.role !== 'owner' &&
    currentUser?.role !== 'developer'
  ) {
    return { success: false, error: 'Only owners can remove admins' }
  }

  // Check if member has sessions
  const { count: sessionCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('contractor_id', memberId)

  if (sessionCount && sessionCount > 0) {
    return {
      success: false,
      error: `Cannot remove: ${memberToRemove.name || 'This user'} has ${sessionCount} session(s). Reassign or delete their sessions first.`,
    }
  }

  // The users table has no DELETE RLS policy, so the session-scoped client silently deletes
  // 0 rows (the original bug: "success" while the member stayed). Use the service role for
  // the delete AFTER all the authz + session checks above. Scope by org for non-developers
  // as defense in depth, since the service role bypasses RLS.
  const service = createServiceClient()
  let deleteQuery = service.from('users').delete({ count: 'exact' }).eq('id', memberId)
  if (currentUser?.role !== 'developer') {
    deleteQuery = deleteQuery.eq('organization_id', currentUser?.organization_id ?? '')
  }
  const { error, count } = await deleteQuery

  const err = handleSupabaseError(error)
  if (err) return err

  if (!count) {
    return { success: false as const, error: 'Team member not found' }
  }

  // Best-effort: also remove the auth identity so the person can no longer sign in.
  try {
    await service.auth.admin.deleteUser(memberId)
  } catch (e) {
    logger.error('Failed to delete auth user after team removal', e)
  }

  revalidateTeamPaths()

  return { success: true as const }
}
