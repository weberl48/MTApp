'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePortal } from '@/contexts/portal-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, User, FileText, Plus, Send } from 'lucide-react'

interface SessionRequest {
  id: string
  preferred_date: string
  preferred_time: string | null
  alternative_date: string | null
  status: 'pending' | 'approved' | 'declined' | 'cancelled'
  response_notes: string | null
  created_at: string
}

interface Session {
  id: string
  date: string
  time: string | null
  duration_minutes: number
  client_notes: string | null
  status: string
  service_type: { id: string; name: string; category: string } | null
  contractor: { id: string; name: string } | null
}

export default function PortalSessionsPage() {
  const { token } = usePortal()
  const [sessions, setSessions] = useState<Session[]>([])
  const [requests, setRequests] = useState<SessionRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const headers = { Authorization: `Bearer ${token}` }

        const [sessionsRes, requestsRes] = await Promise.all([
          fetch('/api/portal/sessions', { headers }),
          fetch('/api/portal/session-requests', { headers }),
        ])

        if (sessionsRes.ok) {
          const data = await sessionsRes.json()
          setSessions(data.sessions || [])
        }

        if (requestsRes.ok) {
          const data = await requestsRes.json()
          setRequests(data.requests || [])
        }
      } catch (error) {
        console.error('[MCA] Error loading data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [token])

  const pendingRequests = requests.filter((r) => r.status === 'pending')

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function formatTime(timeStr: string | null) {
    if (!timeStr) return null
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const today = new Date().toISOString().split('T')[0]
  const upcomingSessions = sessions
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const pastSessions = sessions
    .filter((s) => s.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))

  function SessionCard({ session }: { session: Session }) {
    const isPast = session.date < today

    return (
      <Card className={isPast ? 'opacity-80' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">
                {session.service_type?.name || 'Session'}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {formatDate(session.date)}
                {session.time && (
                  <>
                    <span className="text-gray-300">•</span>
                    <Clock className="h-4 w-4" />
                    {formatTime(session.time)}
                  </>
                )}
              </CardDescription>
            </div>
            <Badge variant={isPast ? 'secondary' : 'default'}>
              {session.duration_minutes} min
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {session.contractor && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>with {session.contractor.name}</span>
            </div>
          )}

          {session.client_notes && (
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <FileText className="h-4 w-4" />
                Session Notes
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {session.client_notes}
              </p>
            </div>
          )}

          {!session.client_notes && isPast && (
            <p className="text-sm text-gray-400 italic">
              No notes available for this session
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <p className="text-gray-500">Loading your sessions...</p>
      </div>
    )
  }

  function getRequestStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>
      case 'declined':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Declined</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-gray-500">
            View your upcoming and past therapy sessions
          </p>
        </div>
        <Link href={`/portal/${token}/sessions/request`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Request Session
          </Button>
        </Link>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5" />
              Pending Requests ({pendingRequests.length})
            </CardTitle>
            <CardDescription>
              Waiting for your therapist to respond
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 bg-card rounded-lg border"
                >
                  <div>
                    <p className="font-medium">
                      {formatDate(req.preferred_date)}
                      {req.preferred_time && ` at ${formatTime(req.preferred_time)}`}
                    </p>
                    {req.alternative_date && (
                      <p className="text-sm text-gray-500">
                        Alt: {formatDate(req.alternative_date)}
                      </p>
                    )}
                  </div>
                  {getRequestStatusBadge(req.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-1">No upcoming sessions</h3>
                <p className="text-sm text-gray-500">
                  Contact your therapist to schedule your next session
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {pastSessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-1">No past sessions</h3>
                <p className="text-sm text-gray-500">
                  Your completed sessions will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
