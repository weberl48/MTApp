'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePortal } from '@/contexts/portal-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, FileText, Target, ChevronRight, Clock, CheckCircle2 } from 'lucide-react'

interface Session {
  id: string
  date: string
  time: string | null
  duration_minutes: number
  client_notes: string | null
  status: string
  service_type: { name: string } | null
  contractor: { name: string } | null
}

interface Resource {
  id: string
  title: string
  resource_type: 'homework' | 'file' | 'link'
  due_date: string | null
  is_completed: boolean
}

interface GoalSummary {
  total: number
  active: number
  met: number
}

export default function PortalDashboard() {
  const { token, client } = usePortal()
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([])
  const [recentResources, setRecentResources] = useState<Resource[]>([])
  const [goalSummary, setGoalSummary] = useState<GoalSummary>({ total: 0, active: 0, met: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const headers = { Authorization: `Bearer ${token}` }

        const [sessionsRes, resourcesRes, goalsRes] = await Promise.all([
          fetch('/api/portal/sessions', { headers }),
          fetch('/api/portal/resources', { headers }),
          fetch('/api/portal/goals', { headers }),
        ])

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json()
          // Filter to upcoming sessions and take first 3
          const today = new Date().toISOString().split('T')[0]
          const upcoming = (sessionsData.sessions || [])
            .filter((s: Session) => s.date >= today)
            .sort((a: Session, b: Session) => a.date.localeCompare(b.date))
            .slice(0, 3)
          setUpcomingSessions(upcoming)
        }

        if (resourcesRes.ok) {
          const resourcesData = await resourcesRes.json()
          // Get recent incomplete homework and resources
          const recent = (resourcesData.resources || [])
            .filter((r: Resource) => !r.is_completed)
            .slice(0, 4)
          setRecentResources(recent)
        }

        if (goalsRes.ok) {
          const goalsData = await goalsRes.json()
          setGoalSummary(goalsData.summary || { total: 0, active: 0, met: 0 })
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [token])

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatTime(timeStr: string | null) {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {client?.name?.split(' ')[0]}!</h2>
          <p className="text-blue-100">
            View your sessions, track your goals, and access your resources all in one place.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Sessions
              </CardTitle>
              <Link href={`/portal/${token}/sessions`}>
                <Button variant="ghost" size="sm">
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : upcomingSessions.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming sessions</p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {session.service_type?.name || 'Session'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(session.date)}
                        {session.time && ` at ${formatTime(session.time)}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {session.duration_minutes} min
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goals Progress
              </CardTitle>
              <Link href={`/portal/${token}/goals`}>
                <Button variant="ghost" size="sm">
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : goalSummary.total === 0 ? (
              <p className="text-sm text-gray-500">No goals set yet</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{
                          width: `${goalSummary.total > 0 ? (goalSummary.met / goalSummary.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {goalSummary.met}/{goalSummary.total}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{goalSummary.active}</p>
                    <p className="text-xs text-gray-600">Active</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{goalSummary.met}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Resources */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                To Do
              </CardTitle>
              <Link href={`/portal/${token}/resources`}>
                <Button variant="ghost" size="sm">
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription>Homework and resources to review</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : recentResources.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        resource.resource_type === 'homework'
                          ? 'bg-orange-500'
                          : resource.resource_type === 'file'
                          ? 'bg-blue-500'
                          : 'bg-purple-500'
                      }`}
                    />
                    <span className="flex-1 text-sm truncate">{resource.title}</span>
                    {resource.due_date && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(resource.due_date)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
