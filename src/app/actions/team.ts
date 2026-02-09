'use server'

import { createClient } from '@/lib/supabase/server'
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'
import { handleSupabaseError, revalidateTeamPaths } from '@/lib/actions/helpers'

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
    .select('role')
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

  // Only developers can remove owners
  if (memberToRemove.role === 'owner' && currentUser?.role !== 'developer') {
    return { success: false, error: 'Only developers can remove owners' }
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

  // Delete the user from the users table
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', memberId)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateTeamPaths()

  return { success: true as const }
}
