'use client'

import { useEffect, useState } from 'react'
import { usePortal } from '@/contexts/portal-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, CheckCircle2, Circle, XCircle } from 'lucide-react'

interface Goal {
  id: string
  description: string
  status: 'active' | 'met' | 'not_met'
  created_at: string
  completed_at: string | null
}

interface GoalSummary {
  total: number
  active: number
  met: number
  not_met: number
}

export default function PortalGoalsPage() {
  const { token } = usePortal()
  const [goals, setGoals] = useState<Goal[]>([])
  const [summary, setSummary] = useState<GoalSummary>({
    total: 0,
    active: 0,
    met: 0,
    not_met: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGoals() {
      try {
        const response = await fetch('/api/portal/goals', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setGoals(data.goals || [])
          setSummary(data.summary || { total: 0, active: 0, met: 0, not_met: 0 })
        }
      } catch (error) {
        console.error('Error loading goals:', error)
      } finally {
        setLoading(false)
      }
    }

    loadGoals()
  }, [token])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'met':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'not_met':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Circle className="h-5 w-5 text-blue-500" />
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'met':
        return <Badge className="bg-green-100 text-green-700">Goal Met</Badge>
      case 'not_met':
        return <Badge className="bg-red-100 text-red-700">Not Met</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>
    }
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status !== 'active')

  function GoalCard({ goal }: { goal: Goal }) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 pt-1">{getStatusIcon(goal.status)}</div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`font-medium ${
                    goal.status === 'met' ? 'text-gray-500' : ''
                  }`}
                >
                  {goal.description}
                </p>
                {getStatusBadge(goal.status)}
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>Started {formatDate(goal.created_at)}</span>
                {goal.completed_at && (
                  <span>
                    {goal.status === 'met' ? 'Achieved' : 'Closed'}{' '}
                    {formatDate(goal.completed_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Goals</h1>
        <p className="text-gray-500">Loading your goals...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Treatment Goals</h1>
        <p className="text-gray-500">Track your progress towards your therapy goals</p>
      </div>

      {/* Progress Summary */}
      {summary.total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${(summary.met / summary.total) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-red-400 transition-all"
                      style={{
                        width: `${(summary.not_met / summary.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                  {summary.met} of {summary.total} met
                </span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{summary.active}</p>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{summary.met}</p>
                  <p className="text-xs text-gray-600">Met</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{summary.not_met}</p>
                  <p className="text-xs text-gray-600">Not Met</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No goals yet</h3>
            <p className="text-sm text-gray-500">
              Your therapist will set treatment goals with you
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Active ({activeGoals.length})</TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedGoals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-3">
            {activeGoals.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">
                    All goals completed!
                  </h3>
                  <p className="text-sm text-gray-500">
                    Great work! Talk to your therapist about new goals.
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-3">
            {completedGoals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No completed goals yet
              </p>
            ) : (
              completedGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
