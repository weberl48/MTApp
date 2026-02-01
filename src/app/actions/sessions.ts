'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function approveSession(sessionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/sessions')
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/dashboard')

  return { success: true }
}

export async function markSessionNoShow(sessionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'no_show', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/sessions')
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/dashboard')

  return { success: true }
}

export async function cancelSession(sessionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/sessions')
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/dashboard')

  return { success: true }
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient()

  // Delete attendees first
  const { error: attendeesError } = await supabase
    .from('session_attendees')
    .delete()
    .eq('session_id', sessionId)

  if (attendeesError) {
    return { success: false, error: attendeesError.message }
  }

  // Delete session
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/sessions')
  revalidatePath('/dashboard')

  return { success: true }
}
