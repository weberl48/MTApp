'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, User, Users, DollarSign, FileText, Loader2, Pencil, Trash2, XCircle, UserX } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'

interface SessionAttendee {
  id: string
  individual_cost: number
  client: { id: string; name: string; contact_email: string | null } | null
}

interface SessionDetails {
  id: string
  date: string
  time: string | null
  duration_minutes: number
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  service_type: { id: string; name: string; base_rate: number; per_person_rate: number; mca_percentage: number } | null
  contractor: { id: string; name: string; email: string } | null
  attendees: SessionAttendee[]
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  no_show: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  no_show: 'No Show',
  cancelled: 'Cancelled',
}

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<SessionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadSession() {
      const supabase = createClient()
      const sessionId = params.id as string

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login/')
        return
      }

      setCurrentUserId(user.id)

      // Get user role
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>()

      const admin = ['admin', 'owner', 'developer'].includes(userProfile?.role || '')
      setIsAdmin(admin)

      // Fetch session with related data
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          date,
          time,
          duration_minutes,
          status,
          notes,
          created_at,
          updated_at,
          service_type:service_types(id, name, base_rate, per_person_rate, mca_percentage),
          contractor:users(id, name, email),
          attendees:session_attendees(
            id,
            individual_cost,
            client:clients(id, name, contact_email)
          )
        `)
        .eq('id', sessionId)
        .single()

      if (error || !data) {
        console.error('Error loading session:', error)
        setLoading(false)
        return
      }

      // Check access - contractors can only see their own sessions
      const sessionData = data as unknown as SessionDetails
      if (!admin && sessionData.contractor?.id !== user.id) {
        router.push('/sessions/')
        return
      }

      setSession(sessionData)
      setLoading(false)
    }

    loadSession()
  }, [params.id, router])

  const handleApprove = async () => {
    if (!session) return
    const supabase = createClient()

    const { error } = await supabase
      .from('sessions')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', session.id)

    if (!error) {
      setSession({ ...session, status: 'approved' })
    }
  }

  const handleMarkNoShow = async () => {
    if (!session || !confirm('Mark this session as a no-show? This cannot be undone.')) return
    const supabase = createClient()

    const { error } = await supabase
      .from('sessions')
      .update({ status: 'no_show', updated_at: new Date().toISOString() })
      .eq('id', session.id)

    if (!error) {
      setSession({ ...session, status: 'no_show' })
    }
  }

  const handleCancel = async () => {
    if (!session || !confirm('Cancel this session? This cannot be undone.')) return
    const supabase = createClient()

    const { error } = await supabase
      .from('sessions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', session.id)

    if (!error) {
      setSession({ ...session, status: 'cancelled' })
    }
  }

  const handleDelete = async () => {
    if (!session || !confirm('Are you sure you want to delete this session?')) return
    const supabase = createClient()

    // Delete attendees first
    await supabase
      .from('session_attendees')
      .delete()
      .eq('session_id', session.id)

    // Delete session
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', session.id)

    if (!error) {
      router.push('/sessions/')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Session not found</h2>
        <p className="text-gray-500 mb-4">This session may have been deleted or you don&apos;t have access.</p>
        <Link href="/sessions">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Button>
        </Link>
      </div>
    )
  }

  const totalCost = session.attendees?.reduce((sum, a) => sum + (a.individual_cost || 0), 0) || 0
  const isActiveSession = !['no_show', 'cancelled'].includes(session.status)
  const canEdit = isActiveSession && (isAdmin || (session.contractor?.id === currentUserId && session.status === 'draft'))
  const canDelete = isActiveSession && (isAdmin || (session.contractor?.id === currentUserId && session.status === 'draft'))
  const canApprove = isAdmin && session.status === 'submitted'
  const canMarkNoShow = isAdmin && isActiveSession && session.status !== 'draft'
  const canCancel = isActiveSession && (isAdmin || (session.contractor?.id === currentUserId && session.status === 'draft'))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Link href="/sessions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">
              {(session.service_type?.name || 'Session Details').replaceAll('-', '‑')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {new Date(session.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge className={statusColors[session.status]}>
            {statusLabels[session.status] || session.status}
          </Badge>
          {canApprove && (
            <Button onClick={handleApprove} variant="default" className="w-full sm:w-auto">
              Approve Session
            </Button>
          )}
          {canMarkNoShow && (
            <Button
              onClick={handleMarkNoShow}
              variant="outline"
              className="w-full sm:w-auto text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <UserX className="w-4 h-4 mr-2" />
              No Show
            </Button>
          )}
          {canCancel && (
            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          {canEdit && (
            <Link href={`/sessions/${session.id}/edit`}>
              <Button variant="outline">
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>Details about this session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">
                  {new Date(session.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {session.time && (
                    <span className="ml-2">
                      at {new Date(`2000-01-01T${session.time}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{session.duration_minutes} minutes</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Contractor</p>
                <p className="font-medium">{session.contractor?.name || 'Unknown'}</p>
                {session.contractor?.email && (
                  <p className="text-sm text-gray-500">{session.contractor.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Service Type</p>
                <p className="font-medium">{session.service_type?.name || 'Unknown'}</p>
                {session.service_type && (
                  <p className="text-sm text-gray-500">
                    Base: {formatCurrency(session.service_type.base_rate)}
                    {session.service_type.per_person_rate > 0 && (
                      <> + {formatCurrency(session.service_type.per_person_rate)}/person</>
                    )}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing Summary</CardTitle>
            <CardDescription>Financial breakdown for this session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Attendees</p>
                <p className="font-medium">
                  {session.attendees?.length || 0} client{session.attendees?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalCost)}</p>
              </div>
            </div>

            {session.attendees?.length > 1 && (
              <div className="text-sm text-gray-500">
                {formatCurrency(totalCost / session.attendees.length)} per person
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendees</CardTitle>
          <CardDescription>Clients who attended this session</CardDescription>
        </CardHeader>
        <CardContent>
          {session.attendees && session.attendees.length > 0 ? (
            <div className="space-y-3">
              {session.attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{attendee.client?.name || 'Unknown Client'}</p>
                    {attendee.client?.contact_email && (
                      <p className="text-sm text-gray-500">{attendee.client.contact_email}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(attendee.individual_cost)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">No attendees recorded</p>
          )}
        </CardContent>
      </Card>

      {session.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Session Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{session.notes}</p>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p>Created: {new Date(session.created_at).toLocaleString()}</p>
        <p>Last updated: {new Date(session.updated_at).toLocaleString()}</p>
      </div>
    </div>
  )
}
