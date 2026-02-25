'use server'

import { createClient } from '@/lib/supabase/server'
import { handleSupabaseError, revalidateAdminWorkPaths, requirePermission } from '@/lib/actions/helpers'

export async function createAdminWork(data: {
  admin_user_id: string
  date: string
  duration_minutes: number
  description: string
  pay_amount: number
}) {
  const permErr = await requirePermission('admin-work:create')
  if (permErr) return permErr

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false as const, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { success: false as const, error: 'User profile not found' }

  const { data: adminWork, error } = await supabase
    .from('admin_work')
    .insert({
      organization_id: profile.organization_id,
      admin_user_id: data.admin_user_id,
      date: data.date,
      duration_minutes: data.duration_minutes,
      description: data.description,
      pay_amount: data.pay_amount,
      status: 'submitted',
      created_by: user.id,
    })
    .select()
    .single()

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateAdminWorkPaths()
  return { success: true as const, id: adminWork.id }
}

export async function updateAdminWork(id: string, data: {
  admin_user_id?: string
  date?: string
  duration_minutes?: number
  description?: string
  pay_amount?: number
}) {
  const permErr = await requirePermission('admin-work:create')
  if (permErr) return permErr

  const supabase = await createClient()

  const { error } = await supabase
    .from('admin_work')
    .update(data)
    .eq('id', id)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateAdminWorkPaths()
  return { success: true as const }
}

export async function approveAdminWork(id: string) {
  const permErr = await requirePermission('admin-work:approve')
  if (permErr) return permErr

  const supabase = await createClient()

  const { error } = await supabase
    .from('admin_work')
    .update({ status: 'approved' as const })
    .eq('id', id)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateAdminWorkPaths()
  return { success: true as const }
}

export async function bulkApproveAdminWork(ids: string[]) {
  if (ids.length === 0) return { success: true as const, count: 0 }

  const permErr = await requirePermission('admin-work:approve')
  if (permErr) return permErr

  const supabase = await createClient()

  const { error } = await supabase
    .from('admin_work')
    .update({ status: 'approved' as const })
    .in('id', ids)
    .eq('status', 'submitted')

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateAdminWorkPaths()
  return { success: true as const, count: ids.length }
}

export async function deleteAdminWork(id: string) {
  const permErr = await requirePermission('admin-work:delete')
  if (permErr) return permErr

  const supabase = await createClient()

  const { error } = await supabase
    .from('admin_work')
    .delete()
    .eq('id', id)

  const err = handleSupabaseError(error)
  if (err) return err

  revalidateAdminWorkPaths()
  return { success: true as const }
}
