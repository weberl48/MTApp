'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { autoSendInvoicesViaSquare, type AutoSendResult } from '@/lib/square/auto-send'
import { logger } from '@/lib/logger'

export async function approveSession(sessionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    return { success: false as const, error: error.message }
  }

  // Auto-send invoices via Square (non-blocking — approval always succeeds)
  let squareAutoSend: AutoSendResult | null = null
  try {
    squareAutoSend = await autoSendInvoicesViaSquare(sessionId)
  } catch (err) {
    logger.error('Auto-send Square invoices failed', err)
  }

  revalidatePath('/sessions')
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/dashboard')
  revalidatePath('/invoices')

  return { success: true as const, squareAutoSend }
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

  // Delete any invoices for this session (they shouldn't exist for cancelled sessions)
  const { error: invoicesError } = await supabase
    .from('invoices')
    .delete()
    .eq('session_id', sessionId)

  if (invoicesError) {
    return { success: false, error: invoicesError.message }
  }

  // Update session status to cancelled
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
  revalidatePath('/invoices')

  return { success: true }
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient()

  // Delete invoices first (foreign key constraint)
  const { error: invoicesError } = await supabase
    .from('invoices')
    .delete()
    .eq('session_id', sessionId)

  if (invoicesError) {
    return { success: false, error: invoicesError.message }
  }

  // Delete attendees
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
  revalidatePath('/invoices')

  return { success: true }
}
