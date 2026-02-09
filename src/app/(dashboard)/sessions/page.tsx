'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { Plus, Calendar, List, Search, X, Filter, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import { approveSession } from '@/app/actions/sessions'
import { RejectSessionDialog } from '@/components/sessions/reject-session-dialog'
import { toast } from 'sonner'
import { startOfMonth, endOfMonth, subMonths, subDays, format } from 'date-fns'
import { SessionsCalendar } from '@/components/sessions/sessions-calendar'
import { SessionExportDialog } from '@/components/sessions/export-dialog'
import { SessionsListSkeleton } from '@/components/ui/skeleton'
import { useOrganization } from '@/contexts/organization-context'

interface Session {
  id: string
  date: string
  time: string | null
  duration_minutes: number
  status: string
  notes: string | null
  created_at: string
  group_headcount: number | null
  rejection_reason: string | null
  service_type: { id: string; name: string; base_rate: number; per_person_rate: number } | null
  contractor: { id: string; name: string } | null
  attendees: {
    id: string
    individual_cost: number
    client: { id: string; name: string } | null
  }[]
}

interface Contractor {
  id: string
  name: string
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

const ITEMS_PER_PAGE = 50

export default function SessionsPage() {
  useRouter() // Used for navigation context
  const { can, effectiveUserId, viewAsContractor, organization } = useOrganization()
  const [sessions, setSessions] = useState<Session[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectDialogSession, setRejectDialogSession] = useState<string | null>(null)

  // Use effective permissions (respects "view as" role)
  const isAdmin = can('session:view-all')
  // When viewing as a specific contractor, filter to their sessions even if effective role is still admin
  const shouldFilterByContractor = viewAsContractor || !isAdmin
  const contractorIdToFilter = viewAsContractor?.id || effectiveUserId

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

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [contractorFilter, setContractorFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

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

      // Fetch sessions with related data
      let query = supabase
        .from('sessions')
        .select(`
          id,
          date,
          time,
          duration_minutes,
          status,
          notes,
          created_at,
          group_headcount,
          rejection_reason,
          service_type:service_types(id, name, base_rate, per_person_rate),
          contractor:users(id, name),
          attendees:session_attendees(
            id,
            individual_cost,
            client:clients(id, name)
          )
        `)
        .order('date', { ascending: false })

      if (shouldFilterByContractor && contractorIdToFilter) {
        query = query.eq('contractor_id', contractorIdToFilter)
      }

      const { data } = await query
      setSessions((data as unknown as Session[]) || [])

      // Fetch contractors for filter (admin only, not when viewing as contractor)
      if (!shouldFilterByContractor) {
        const { data: contractorData } = await supabase
          .from('users')
          .select('id, name')
          .in('role', ['contractor', 'admin', 'owner'])
          .order('name')
        setContractors(contractorData || [])
      } else {
        setContractors([])
      }

      setLoading(false)
    }

    loadSessions()
  }, [refreshTrigger, shouldFilterByContractor, contractorIdToFilter])

  async function handleInlineApprove(e: React.MouseEvent, sessionId: string) {
    e.preventDefault()
    e.stopPropagation()
    setApprovingId(sessionId)
    const result = await approveSession(sessionId)
    if (result.success) {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'approved' } : s))
      toast.success('Session approved')
      const sq = result.squareAutoSend
      if (sq) {
        if (sq.sent > 0) toast.success(`${sq.sent} invoice${sq.sent > 1 ? 's' : ''} sent via Square`)
        if (sq.failed.length > 0) toast.warning(`Failed to send Square invoice for: ${sq.failed.join(', ')}`)
        if (sq.skipped > 0) toast.info(`${sq.skipped} invoice${sq.skipped > 1 ? 's' : ''} skipped`)
      }
    } else {
      toast.error('Failed to approve session')
    }
    setApprovingId(null)
  }

  function handleInlineReject(e: React.MouseEvent, sessionId: string) {
    e.preventDefault()
    e.stopPropagation()
    setRejectDialogSession(sessionId)
  }

  // Filter sessions based on current filters
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Search filter - search in service type, client names, contractor name
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesServiceType = session.service_type?.name.toLowerCase().includes(query)
        const matchesContractor = session.contractor?.name.toLowerCase().includes(query)
        const matchesClient = session.attendees?.some(
          (a) => a.client?.name.toLowerCase().includes(query)
        )
        if (!matchesServiceType && !matchesContractor && !matchesClient) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== 'all' && session.status !== statusFilter) {
        return false
      }

      // Contractor filter
      if (contractorFilter !== 'all' && session.contractor?.id !== contractorFilter) {
        return false
      }

      // Date range filter
      if (dateFrom && session.date < dateFrom) {
        return false
      }
      if (dateTo && session.date > dateTo) {
        return false
      }

      return true
    })
  }, [sessions, searchQuery, statusFilter, contractorFilter, dateFrom, dateTo])

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || contractorFilter !== 'all' || dateFrom || dateTo

  // Paginated sessions (show only up to visibleCount)
  const paginatedSessions = useMemo(() => {
    return filteredSessions.slice(0, visibleCount)
  }, [filteredSessions, visibleCount])

  const hasMoreSessions = filteredSessions.length > visibleCount

  function loadMoreSessions() {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE)
  }

  function clearFilters() {
    setSearchQuery('')
    setStatusFilter('all')
    setContractorFilter('all')
    setDateFrom('')
    setDateTo('')
    setVisibleCount(ITEMS_PER_PAGE) // Reset pagination when clearing filters
  }

  if (loading) {
    return <SessionsListSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sessions</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isAdmin ? 'View and manage all sessions' : 'Your session history'}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
          <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')} className="w-full sm:w-[200px]">
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
          {organization?.id && (
            <SessionExportDialog
              organizationId={organization.id}
              contractorId={shouldFilterByContractor ? contractorIdToFilter || undefined : undefined}
            />
          )}
          <Link href="/sessions/new/">
            <Button className="w-full sm:w-auto justify-center">
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      {view === 'list' && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-4">
              {/* Search and filter toggle */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by service, client, or contractor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant={showFilters ? 'secondary' : 'outline'}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  )}
                </Button>
                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Expanded filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isAdmin && contractors.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contractor</label>
                      <Select value={contractorFilter} onValueChange={setContractorFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All contractors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All contractors</SelectItem>
                          {contractors.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date range</label>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date()
                          setDateFrom(format(startOfMonth(today), 'yyyy-MM-dd'))
                          setDateTo(format(endOfMonth(today), 'yyyy-MM-dd'))
                        }}
                      >
                        This Month
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const lastMonth = subMonths(new Date(), 1)
                          setDateFrom(format(startOfMonth(lastMonth), 'yyyy-MM-dd'))
                          setDateTo(format(endOfMonth(lastMonth), 'yyyy-MM-dd'))
                        }}
                      >
                        Last Month
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date()
                          setDateFrom(format(subDays(today, 90), 'yyyy-MM-dd'))
                          setDateTo(format(today, 'yyyy-MM-dd'))
                        }}
                      >
                        Last 90 Days
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">From date</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">To date</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle>All Sessions</CardTitle>
            <CardDescription>
              {filteredSessions.length === sessions.length
                ? `${sessions.length} sessions total`
                : `${filteredSessions.length} of ${sessions.length} sessions`}
              {hasMoreSessions && ` (showing ${paginatedSessions.length})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paginatedSessions.length > 0 ? (
              <div className="space-y-4">
                {paginatedSessions.map((session) => {
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
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium truncate">
                              {session.service_type?.name || 'Unknown Service'}
                            </span>
                            <Badge className={
                              session.status === 'draft' && session.rejection_reason
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : statusColors[session.status]
                            }>
                              {session.status === 'draft' && session.rejection_reason
                                ? 'Needs Revision'
                                : statusLabels[session.status] || session.status}
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
                            {(() => {
                              const count = session.group_headcount || session.attendees?.length || 0
                              return count > 0 ? (
                                <span>
                                  {count} attendee{count !== 1 ? 's' : ''}
                                </span>
                              ) : null
                            })()}
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
                        <div className="flex items-center gap-3 ml-4">
                          <span className="font-medium">{formatCurrency(totalCost)}</span>
                          {isAdmin && session.status === 'submitted' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 px-2 text-xs"
                                disabled={approvingId === session.id}
                                onClick={(e) => handleInlineApprove(e, session.id)}
                              >
                                {approvingId === session.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Approve'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-amber-600 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-950"
                                onClick={(e) => handleInlineReject(e, session.id)}
                              >
                                Revise
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}

                {/* Load More Button */}
                {hasMoreSessions && (
                  <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={loadMoreSessions}>
                      Load More ({filteredSessions.length - paginatedSessions.length} remaining)
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                {hasActiveFilters ? (
                  <>
                    <p className="mb-4">No sessions match your filters</p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="mb-4">No sessions found</p>
                    <Link href="/sessions/new/">
                      <Button>Log your first session</Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <SessionsCalendar sessions={sessions} isAdmin={isAdmin} />
      )}
      {rejectDialogSession && (
        <RejectSessionDialog
          sessionId={rejectDialogSession}
          open={!!rejectDialogSession}
          onOpenChange={(open) => { if (!open) setRejectDialogSession(null) }}
          onRejected={() => {
            setSessions(prev => prev.map(s =>
              s.id === rejectDialogSession ? { ...s, status: 'draft', rejection_reason: 'revised' } : s
            ))
            setRejectDialogSession(null)
          }}
        />
      )}
    </div>
  )
}
