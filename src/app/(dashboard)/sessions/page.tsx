'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Plus, Calendar, List, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import { SessionsCalendar } from '@/components/sessions/sessions-calendar'

interface Session {
  id: string
  date: string
  duration_minutes: number
  status: string
  notes: string | null
  created_at: string
  service_type: { id: string; name: string; base_rate: number; per_person_rate: number } | null
  contractor: { id: string; name: string } | null
  attendees: {
    id: string
    individual_cost: number
    client: { id: string; name: string } | null
  }[]
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'calendar'>('list')

  useEffect(() => {
    async function loadSessions() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Get user role
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>()

      const admin = userProfile?.role === 'admin'
      setIsAdmin(admin)

      // Fetch sessions with related data
      let query = supabase
        .from('sessions')
        .select(`
          id,
          date,
          duration_minutes,
          status,
          notes,
          created_at,
          service_type:service_types(id, name, base_rate, per_person_rate),
          contractor:users(id, name),
          attendees:session_attendees(
            id,
            individual_cost,
            client:clients(id, name)
          )
        `)
        .order('date', { ascending: false })

      if (!admin) {
        query = query.eq('contractor_id', user.id)
      }

      const { data } = await query
      setSessions((data as unknown as Session[]) || [])
      setLoading(false)
    }

    loadSessions()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sessions</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isAdmin ? 'View and manage all sessions' : 'Your session history'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')} className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">
                <List className="w-4 h-4 mr-2" />
                List
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Link href="/sessions/new/">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </Link>
        </div>
      </div>

      {view === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle>All Sessions</CardTitle>
            <CardDescription>
              {sessions?.length || 0} sessions total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const totalCost = session.attendees?.reduce(
                    (sum, a) => sum + (a.individual_cost || 0),
                    0
                  ) || 0

                  return (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}/`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium truncate">
                              {session.service_type?.name || 'Unknown Service'}
                            </span>
                            <Badge className={statusColors[session.status]}>
                              {session.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>
                              {new Date(session.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span>{session.duration_minutes} min</span>
                            {session.attendees?.length > 0 && (
                              <span>
                                {session.attendees.length} attendee
                                {session.attendees.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {isAdmin && session.contractor && (
                              <span>by {session.contractor.name}</span>
                            )}
                          </div>
                          {session.attendees?.length > 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                              {session.attendees
                                .map((a) => a.client?.name)
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <span className="font-medium">{formatCurrency(totalCost)}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No sessions found</p>
                <Link href="/sessions/new/">
                  <Button>Log your first session</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <SessionsCalendar sessions={sessions} isAdmin={isAdmin} />
      )}
    </div>
  )
}
