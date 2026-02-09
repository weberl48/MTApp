import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SessionForm } from '@/components/forms/session-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { decryptField } from '@/lib/crypto'
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'

interface EditSessionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSessionPage({ params }: EditSessionPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login/')
  }

  // Get user role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  const isAdmin = can(userProfile?.role as UserRole, 'session:approve')

  // Fetch the session with attendees
  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      id,
      date,
      time,
      duration_minutes,
      service_type_id,
      contractor_id,
      status,
      notes,
      client_notes,
      group_headcount,
      group_member_names,
      rejection_reason,
      attendees:session_attendees(client_id)
    `)
    .eq('id', id)
    .single()

  if (error || !session) {
    notFound()
  }

  // Check access - only admin or session owner can edit
  const canEdit = isAdmin || session.contractor_id === user.id
  if (!canEdit) {
    redirect('/sessions/')
  }

  // Only draft sessions can be edited by contractors
  if (!isAdmin && session.status !== 'draft') {
    redirect(`/sessions/${id}/`)
  }

  // Fetch service types and clients for the form
  const [{ data: serviceTypes }, { data: clients }] = await Promise.all([
    supabase.from('service_types').select('*').order('name'),
    supabase.from('clients').select('id, name, payment_method').order('name'),
  ])

  // Decrypt PHI fields
  const decryptedNotes = session.notes ? await decryptField(session.notes) : null
  const decryptedClientNotes = session.client_notes ? await decryptField(session.client_notes) : null

  const existingSession = {
    id: session.id,
    date: session.date,
    time: session.time,
    duration_minutes: session.duration_minutes,
    service_type_id: session.service_type_id,
    status: session.status,
    notes: decryptedNotes,
    client_notes: decryptedClientNotes,
    group_headcount: session.group_headcount,
    group_member_names: session.group_member_names,
    rejection_reason: session.rejection_reason,
    attendees: (session.attendees as { client_id: string }[]) || [],
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href={`/sessions/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Session</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 ml-12">
          Update session details. Changes will be saved immediately.
        </p>
      </div>

      {session.rejection_reason && (
        <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Revision Requested</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {session.rejection_reason}
          </AlertDescription>
        </Alert>
      )}

      <SessionForm
        serviceTypes={serviceTypes || []}
        clients={clients || []}
        contractorId={session.contractor_id}
        existingSession={existingSession}
      />
    </div>
  )
}
