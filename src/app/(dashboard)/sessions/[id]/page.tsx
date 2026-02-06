'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, User, Users, DollarSign, FileText, Loader2, Pencil, Trash2, XCircle, UserX } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import { decryptPHI } from '@/lib/crypto/actions'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { toast } from 'sonner'
import {
  approveSession,
  markSessionNoShow,
  cancelSession,
  deleteSession,
} from '@/app/actions/sessions'
import { useOrganization } from '@/contexts/organization-context'

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
  client_notes: string | null
  group_headcount: number | null
  group_member_names: string | null
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
  const { can, user, effectiveUserId, loading: contextLoading } = useOrganization()
  const [session, setSession] = useState<SessionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [decryptedNotes, setDecryptedNotes] = useState<string | null>(null)
  const [decryptedClientNotes, setDecryptedClientNotes] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const currentUserId = effectiveUserId || user?.id || null

  useEffect(() => {
    async function loadSession() {
      const supabase = createClient()
      const sessionId = params.id as string

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login/')
        return
      }

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
          client_notes,
          group_headcount,
          group_member_names,
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
        console.error('[MCA] Error loading session')
        setLoading(false)
        return
      }

      const sessionData = data as unknown as SessionDetails

      setSession(sessionData)
      setLoading(false)
    }

    loadSession()
  }, [params.id, router])

  // Decrypt notes when session loads (via server action since ENCRYPTION_KEY is server-only)
  useEffect(() => {
    async function decryptNotes() {
      if (!session) return
      const decrypted = await decryptPHI({
        notes: session.notes,
        clientNotes: session.client_notes,
      })
      setDecryptedNotes(decrypted.notes)
      setDecryptedClientNotes(decrypted.clientNotes)
    }
    decryptNotes()
  }, [session?.notes, session?.client_notes])

  const handleApprove = () => {
    if (!session) return
    startTransition(async () => {
      const result = await approveSession(session.id)
      if (result.success) {
        setSession({ ...session, status: 'approved' })
        toast.success('Session approved')
        // Show Square auto-send feedback
        const sq = result.squareAutoSend
        if (sq) {
          if (sq.sent > 0) {
            toast.success(`${sq.sent} invoice${sq.sent > 1 ? 's' : ''} sent via Square`)
          }
          if (sq.failed.length > 0) {
            toast.warning(`Failed to send Square invoice for: ${sq.failed.join(', ')}`)
          }
          if (sq.skipped > 0) {
            toast.info(`${sq.skipped} invoice${sq.skipped > 1 ? 's' : ''} skipped (no client email)`)
          }
        }
      } else {
        toast.error(result.error || 'Failed to approve session')
      }
    })
  }

  const handleMarkNoShow = () => {
    if (!session || !confirm('Mark this session as a no-show? This cannot be undone.')) return
    startTransition(async () => {
      const result = await markSessionNoShow(session.id)
      if (result.success) {
        setSession({ ...session, status: 'no_show' })
        toast.success('Session marked as no-show')
      } else {
        toast.error(result.error || 'Failed to update session')
      }
    })
  }

  const handleCancel = () => {
    if (!session || !confirm('Cancel this session? This cannot be undone.')) return
    startTransition(async () => {
      const result = await cancelSession(session.id)
      if (result.success) {
        setSession({ ...session, status: 'cancelled' })
        toast.success('Session cancelled')
      } else {
        toast.error(result.error || 'Failed to cancel session')
      }
    })
  }

  const handleDelete = () => {
    if (!session || !confirm('Are you sure you want to delete this session?')) return
    startTransition(async () => {
      const result = await deleteSession(session.id)
      if (result.success) {
        toast.success('Session deleted')
        router.push('/sessions/')
      } else {
        toast.error(result.error || 'Failed to delete session')
      }
    })
  }

  if (loading || contextLoading) {
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

  // Check access - contractors can only see their own sessions
  if (!can('session:view-all') && session.contractor?.id !== currentUserId) {
    router.push('/sessions/')
    return null
  }

  const totalCost = session.attendees?.reduce((sum, a) => sum + (a.individual_cost || 0), 0) || 0
  const isActiveSession = !['no_show', 'cancelled'].includes(session.status)
  const isOwnDraft = session.contractor?.id === currentUserId && session.status === 'draft'
  const canEdit = isActiveSession && (can('session:approve') || isOwnDraft)
  const canDelete = isActiveSession && (can('session:delete') || isOwnDraft)
  const canApprove = can('session:approve') && session.status === 'submitted'
  const canMarkNoShow = can('session:mark-no-show') && isActiveSession && session.status !== 'draft'
  const canCancel = isActiveSession && (can('session:cancel') || isOwnDraft)

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Sessions', href: '/sessions' },
        { label: session.service_type?.name || 'Session Details' },
      ]} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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

            {/* Group session indicator */}
            {session.group_headcount && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Group Session - {session.group_headcount} participants
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Group Session Details */}
      {session.group_headcount && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-purple-900 dark:text-purple-100">Group Session Details</CardTitle>
            <CardDescription>Participant information for this group session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Total Participants</p>
                <p className="font-medium">{session.group_headcount} people</p>
              </div>
            </div>

            {session.group_member_names && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Participant Names</p>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm">{session.group_member_names}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {(decryptedNotes || decryptedClientNotes) && (
        <Card>
          <CardHeader>
            <CardTitle>Session Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {decryptedNotes && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Internal Notes</p>
                <p className="whitespace-pre-wrap">{decryptedNotes}</p>
              </div>
            )}
            {decryptedClientNotes && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Client Notes</p>
                <p className="whitespace-pre-wrap">{decryptedClientNotes}</p>
              </div>
            )}
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
