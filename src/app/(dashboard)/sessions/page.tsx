'use client'

import { useEffect, useState, useMemo, useTransition } from 'react'
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
import { Plus, Calendar, List, Search, X, Filter, Loader2, CheckCircle, ArrowUpDown } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import { parseLocalDate } from '@/lib/dates'
import { Checkbox } from '@/components/ui/checkbox'
import { approveSession, bulkApproveSessions } from '@/app/actions/sessions'
import { RejectSessionDialog } from '@/components/sessions/reject-session-dialog'
import { toast } from 'sonner'
import { startOfMonth, endOfMonth, subMonths, subDays, format } from 'date-fns'
import { SessionsCalendar } from '@/components/sessions/sessions-calendar'
import { SessionExportDialog } from '@/components/sessions/export-dialog'
import { SessionsListSkeleton } from '@/components/ui/skeleton'
import { useOrganization } from '@/contexts/organization-context'
import { sessionStatusColors, sessionStatusLabels } from '@/lib/constants/display'

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkPending, startBulkTransition] = useTransition()

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
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'client_asc' | 'client_desc'>('date_desc')

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

  function handleBulkApprove() {
    if (selectedIds.size === 0) return
    startBulkTransition(async () => {
      const result = await bulkApproveSessions(Array.from(selectedIds))
      if (result.success) {
        toast.success(`Approved ${result.count} session${result.count !== 1 ? 's' : ''}`)
        setSessions((prev) =>
          prev.map((s) => (selectedIds.has(s.id) ? { ...s, status: 'approved' } : s))
        )
        setSelectedIds(new Set())
      } else {
        toast.error('error' in result ? result.error : 'Failed to approve sessions')
      }
    })
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

  // Sort filtered sessions
  const sortedSessions = useMemo(() => {
    if (sortBy === 'date_desc') return filteredSessions // Already sorted by date desc from DB
    const sorted = [...filteredSessions]
    switch (sortBy) {
      case 'date_asc':
        sorted.sort((a, b) => a.date.localeCompare(b.date))
        break
      case 'client_asc':
      case 'client_desc': {
        const getClientName = (s: Session) =>
          s.attendees?.[0]?.client?.name?.toLowerCase() || '\uffff' // push no-client sessions to end
        sorted.sort((a, b) => {
          const cmp = getClientName(a).localeCompare(getClientName(b))
          return sortBy === 'client_asc' ? cmp : -cmp
        })
        break
      }
    }
    return sorted
  }, [filteredSessions, sortBy])

  // Paginated sessions (show only up to visibleCount)
  const paginatedSessions = useMemo(() => {
    return sortedSessions.slice(0, visibleCount)
  }, [sortedSessions, visibleCount])

  const hasMoreSessions = sortedSessions.length > visibleCount

  // Submitted sessions visible in current view (for select-all)
  const submittedInView = useMemo(
    () => paginatedSessions.filter((s) => s.status === 'submitted'),
    [paginatedSessions]
  )
  const allSubmittedSelected = submittedInView.length > 0 && submittedInView.every((s) => selectedIds.has(s.id))

  function loadMoreSessions() {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE)
  }

  function clearFilters() {
    setSearchQuery('')
    setStatusFilter('all')
    setContractorFilter('all')
    setDateFrom('')
    setDateTo('')
    setSortBy('date_desc')
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
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[160px]">
                    <ArrowUpDown className="w-4 h-4 mr-2 shrink-0" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">Date (Newest)</SelectItem>
                    <SelectItem value="date_asc">Date (Oldest)</SelectItem>
                    <SelectItem value="client_asc">Client (A-Z)</SelectItem>
                    <SelectItem value="client_desc">Client (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Bulk Action Bar */}
      {isAdmin && selectedIds.size > 0 && (
        <Card className="sticky top-0 z-10 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedIds.size} session{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={isBulkPending}
                >
                  {isBulkPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  )}
                  Approve ({selectedIds.size})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={isBulkPending}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'list' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Sessions</CardTitle>
                <CardDescription>
                  {filteredSessions.length === sessions.length
                    ? `${sessions.length} sessions total`
                    : `${filteredSessions.length} of ${sessions.length} sessions`}
                  {hasMoreSessions && ` (showing ${paginatedSessions.length})`}
                </CardDescription>
              </div>
              {isAdmin && submittedInView.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSubmittedSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIds(new Set(submittedInView.map((s) => s.id)))
                      } else {
                        setSelectedIds(new Set())
                      }
                    }}
                    aria-label="Select all submitted sessions"
                  />
                  <span className="text-xs text-gray-500">
                    Select all submitted ({submittedInView.length})
                  </span>
                </div>
              )}
            </div>
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
                      <div className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${selectedIds.has(session.id) ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        {isAdmin && session.status === 'submitted' && (
                          <div className="mr-3 shrink-0" onClick={(e) => e.preventDefault()}>
                            <Checkbox
                              checked={selectedIds.has(session.id)}
                              onCheckedChange={(checked) => {
                                setSelectedIds((prev) => {
                                  const next = new Set(prev)
                                  if (checked) next.add(session.id)
                                  else next.delete(session.id)
                                  return next
                                })
                              }}
                              aria-label={`Select session`}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium truncate">
                              {session.service_type?.name || 'Unknown Service'}
                            </span>
                            <Badge className={
                              session.status === 'draft' && session.rejection_reason
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : sessionStatusColors[session.status]
                            }>
                              {session.status === 'draft' && session.rejection_reason
                                ? 'Needs Revision'
                                : sessionStatusLabels[session.status] || session.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>
                              {parseLocalDate(session.date).toLocaleDateString('en-US', {
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
