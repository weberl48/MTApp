'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, Users, FileText, DollarSign, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import { parseLocalDate } from '@/lib/dates'
import { useOrganization } from '@/contexts/organization-context'
import { DashboardSkeleton } from '@/components/ui/skeleton'
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'
import { PendingApprovals } from '@/components/dashboard/pending-approvals'
import { UnbilledSessions } from '@/components/dashboard/unbilled-sessions'
import { UnsentInvoices } from '@/components/dashboard/unsent-invoices'
import { OverdueInvoices } from '@/components/dashboard/overdue-invoices'
import { MissingRates } from '@/components/dashboard/missing-rates'
import { AnalyticsSummary } from '@/components/dashboard/analytics-summary'

interface DashboardStats {
  sessionsCount: number
  clientsCount: number
  pendingInvoicesCount: number
  pendingAmount: number
  isAdmin: boolean
  organizationId: string | null
}

interface RecentSession {
  id: string
  date: string
  status: string
  notes: string | null
  service_type: { name: string } | null
  attendees: { client: { name: string } | null }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { viewAsContractor, viewAsRole } = useOrganization()

  // Determine if viewing as a contractor
  const isViewingAsContractor = viewAsRole === 'contractor' || !!viewAsContractor

  // Refetch when page becomes visible (e.g., after navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshTrigger(prev => prev + 1)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Get user role and organization
      const { data: userProfile } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('id', user.id)
        .single<{ role: string; organization_id: string }>()

      const isAdmin = can(userProfile?.role as UserRole, 'session:view-all')

      // When viewing as contractor, use their ID for filtering
      const effectiveContractorId = viewAsContractor
        ? viewAsContractor.id
        : user.id
      const effectiveIsAdmin = isViewingAsContractor ? false : isAdmin

      // Fetch statistics
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]

      // Sessions this month
      let sessionsQuery = supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .gte('date', firstDayOfMonth)

      if (!effectiveIsAdmin) {
        sessionsQuery = sessionsQuery.eq('contractor_id', effectiveContractorId)
      }

      const { count: sessionsCount } = await sessionsQuery

      // Clients count
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('id', { count: 'exact' })

      // Pending invoices (admin only, not when impersonating)
      let pendingInvoicesCount = 0
      let pendingAmount = 0

      if (effectiveIsAdmin) {
        const { data: pendingInvoices } = await supabase
          .from('invoices')
          .select('amount')
          .eq('status', 'pending')

        pendingInvoicesCount = pendingInvoices?.length || 0
        pendingAmount = pendingInvoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0
      }

      setStats({
        sessionsCount: sessionsCount || 0,
        clientsCount: clientsCount || 0,
        pendingInvoicesCount,
        pendingAmount,
        isAdmin: effectiveIsAdmin,
        organizationId: userProfile?.organization_id || null,
      })

      // Recent sessions
      let recentSessionsQuery = supabase
        .from('sessions')
        .select(`
          id,
          date,
          status,
          notes,
          service_type:service_types(name),
          attendees:session_attendees(client:clients(name))
        `)
        .order('date', { ascending: false })
        .limit(5)

      if (!effectiveIsAdmin) {
        recentSessionsQuery = recentSessionsQuery.eq('contractor_id', effectiveContractorId)
      }

      const { data: sessions } = await recentSessionsQuery
      setRecentSessions((sessions as unknown as RecentSession[]) || [])
      setLoading(false)
    }

    loadDashboard()
  }, [viewAsContractor, isViewingAsContractor, refreshTrigger])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {viewAsContractor
              ? `Viewing ${viewAsContractor.name}'s dashboard`
              : "Welcome back! Here's an overview of your practice."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/sessions/new/">
            <Button className="w-full sm:w-auto justify-center">
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid - Clickable */}
      <div data-tour="dashboard-stats" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/sessions">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sessions This Month
              </CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.sessionsCount || 0}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clients">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clients
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.clientsCount || 0}</div>
            </CardContent>
          </Card>
        </Link>

        {stats?.isAdmin && (
          <>
            <Link href="/invoices">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Invoices
                  </CardTitle>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingInvoicesCount}</div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/invoices">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Amount
                  </CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      {/* Analytics Summary - Admin Only */}
      {stats?.isAdmin && <AnalyticsSummary />}

      {/* Action Center - Admin Only */}
      {stats?.isAdmin && (
        <div className="space-y-4">
          <MissingRates />
          <PendingApprovals />
          <UnbilledSessions organizationId={stats.organizationId || ''} />
          <UnsentInvoices />
          <OverdueInvoices />
        </div>
      )}

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Your latest session entries</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {session.service_type?.name || 'Unknown Service'}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          session.status === 'approved'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : session.status === 'submitted'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {parseLocalDate(session.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {session.attendees?.length > 0 && (
                        <span className="ml-2">
                          with{' '}
                          {session.attendees
                            .slice(0, 2)
                            .map((a) => a.client?.name)
                            .filter(Boolean)
                            .join(', ')}
                          {session.attendees.length > 2 &&
                            ` +${session.attendees.length - 2} more`}
                        </span>
                      )}
                    </p>
                  </div>
                  <Link href={`/sessions/${session.id}/`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sessions yet</p>
              <Link href="/sessions/new/">
                <Button variant="link">Log your first session</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
