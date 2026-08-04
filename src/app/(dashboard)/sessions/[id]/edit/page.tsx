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
import { ErrorState } from '@/components/ui/error-state'
import { Card, CardContent } from '@/components/ui/card'

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
      classroom,
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
  const [
    { data: serviceTypes, error: serviceTypesError },
    { data: clients, error: clientsError },
  ] = await Promise.all([
    supabase.from('service_types').select('*').order('name'),
    supabase.from('clients').select('id, name, payment_method, requires_location').order('name'),
  ])

  if (serviceTypesError || clientsError) {
    return (
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link href={`/sessions/${id}/`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Edit Session</h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Update session details. Changes take effect when you save.
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardContent className="space-y-4">
            <ErrorState
              title="Couldn't load the session form"
              description="Check your connection and try again. Your data is safe."
            />
            <div className="flex justify-center">
              <Link href="/sessions/">
                <Button variant="outline">Back to Sessions</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
    classroom: session.classroom,
    rejection_reason: session.rejection_reason,
    attendees: (session.attendees as { client_id: string }[]) || [],
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href={`/sessions/${id}/`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Edit Session</h1>
        </div>
        <p className="text-muted-foreground ml-12">
          Update session details. Changes take effect when you save.
        </p>
      </div>

      <div className="max-w-2xl">
      {session.rejection_reason && (
        <Alert className="mb-6 border-warning/30 bg-warning-soft">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning-soft-foreground">Revision Requested</AlertTitle>
          <AlertDescription className="text-warning-soft-foreground">
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
    </div>
  )
}
