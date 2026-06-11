'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'
import { handleSupabaseError, revalidateTeamPaths } from '@/lib/actions/helpers'
import { logger } from '@/lib/logger'

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
