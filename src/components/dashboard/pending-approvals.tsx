'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle, Loader2, Clock } from 'lucide-react'
import { approveSession, bulkApproveSessions } from '@/app/actions/sessions'
import { RejectSessionDialog } from '@/components/sessions/reject-session-dialog'
import { useOrganization } from '@/contexts/organization-context'
import { toast } from 'sonner'
import { parseLocalDate } from '@/lib/dates'
import { formatCurrency } from '@/lib/pricing'
import { sessionDisplayTotal } from '@/lib/sessions/total'
import Link from 'next/link'

interface SubmittedSession {
  id: string
  date: string
  duration_minutes: number
  total_amount: number | null
  contractor: { id: string; name: string } | null
  service_type: { name: string } | null
  attendees: { individual_cost: number | null; client: { name: string } | null }[]
}

export function PendingApprovals() {
  const [sessions, setSessions] = useState<SubmittedSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectDialogSession, setRejectDialogSession] = useState<string | null>(null)
  // Two-phase row removal: an id lands here on approve/reject success and the row
  // animates its grid-rows/opacity to zero; the actual array removal happens in
  // handleRowTransitionEnd so the next row's button never jumps under the pointer.
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set())
  // Guards handleRowTransitionEnd against firing its removal twice — both
  // grid-template-rows and opacity finish transitioning at the same time, so
  // the wrapper dispatches two transitionend events for one logical exit.
  const handledExitsRef = useRef<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const { can } = useOrganization()
  const canApprove = can('session:approve')
  // Context `can` is grant-aware, so an admin given "see margins" passes here too.
  const showFinancialDetails = can('financial:view-details')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error: queryError } = await supabase
        .from('sessions')
        .select(`
          id, date, duration_minutes, total_amount,
          contractor:users!sessions_contractor_id_fkey(id, name),
          service_type:service_types(name),
          attendees:session_attendees(individual_cost, client:clients(name))
        `)
        .eq('status', 'submitted')
        .order('date', { ascending: false })
        .limit(20)

      if (queryError) {
        setError('Failed to load pending sessions')
      } else {
        setSessions((data as unknown as SubmittedSession[]) || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading || error || sessions.length === 0) return null

  const allSelected = sessions.length > 0 && sessions.every((s) => selectedIds.has(s.id))

  async function handleApprove(e: React.MouseEvent, sessionId: string) {
    e.preventDefault()
    e.stopPropagation()
    setApprovingId(sessionId)
    const result = await approveSession(sessionId)
    if (result.success) {
      setLeavingIds((prev) => new Set(prev).add(sessionId))
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(sessionId); return next })
      toast.success('Session approved')
    } else {
      toast.error('error' in result ? result.error : 'Failed to approve')
    }
    setApprovingId(null)
  }

  // Fires when a leaving row's grid-rows/opacity transition completes (or completes
  // near-instantly under prefers-reduced-motion, which still dispatches transitionend
  // per globals.css) — only then do we actually drop the session from the list.
  function handleRowTransitionEnd(e: React.TransitionEvent<HTMLDivElement>, sessionId: string) {
    if (e.target !== e.currentTarget) return
    if (e.propertyName !== 'grid-template-rows' && e.propertyName !== 'opacity') return
    if (handledExitsRef.current.has(sessionId)) return
    handledExitsRef.current.add(sessionId)
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    setLeavingIds((prev) => { const next = new Set(prev); next.delete(sessionId); return next })
  }

  function handleReject(e: React.MouseEvent, sessionId: string) {
    e.preventDefault()
    e.stopPropagation()
    setRejectDialogSession(sessionId)
  }

  function handleBulkApprove() {
    if (selectedIds.size === 0) return
    startTransition(async () => {
      const result = await bulkApproveSessions(Array.from(selectedIds))
      if (result.success) {
        toast.success(`Approved ${result.count} session${result.count !== 1 ? 's' : ''}`)
        // Only remove the sessions that were actually approved (others stay pending).
        setLeavingIds((prev) => {
          const next = new Set(prev)
          result.approvedIds.forEach((id) => next.add(id))
          return next
        })
        setSelectedIds(new Set())
      } else {
        toast.error('error' in result ? result.error : 'Failed to approve sessions')
      }
    })
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <>
      <Card className="border-info/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-info" />
              <CardTitle>Pending Approvals</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {canApprove && selectedIds.size > 0 && (
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  )}
                  Approve ({selectedIds.size})
                </Button>
              )}
              <Link href="/sessions/?status=submitted">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </div>
          <CardDescription>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} awaiting approval
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Select All */}
          <div className="flex items-center gap-2 px-3 py-1">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                if (checked) setSelectedIds(new Set(sessions.map((s) => s.id)))
                else setSelectedIds(new Set())
              }}
              aria-label="Select all"
            />
            <span className="text-xs text-muted-foreground">Select all</span>
          </div>

          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
            {sessions.map((session) => {
              const clientNames = session.attendees
                ?.slice(0, 2)
                .map((a) => a.client?.name)
                .filter(Boolean)
                .join(', ')
              const extraClients = session.attendees?.length > 2 ? ` +${session.attendees.length - 2}` : ''
              const total = sessionDisplayTotal(session)
              const isLeaving = leavingIds.has(session.id)

              return (
                <div
                  key={session.id}
                  className={`grid transition-[grid-template-rows,opacity] duration-[var(--motion-base)] ease-in ${
                    isLeaving ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                  }`}
                  onTransitionEnd={(e) => handleRowTransitionEnd(e, session.id)}
                >
                  <div className="overflow-hidden min-h-0">
                    <div
                      className={`p-3 rounded-lg transition-colors ${
                        selectedIds.has(session.id) ? 'bg-info-soft' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          className="mt-0.5 shrink-0"
                          checked={selectedIds.has(session.id)}
                          disabled={isLeaving}
                          onCheckedChange={(checked) => toggleSelect(session.id, !!checked)}
                          aria-label={`Select ${session.service_type?.name || 'session'} on ${parseLocalDate(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        />
                        <Link href={`/sessions/${session.id}/`} className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">
                              {session.service_type?.name || 'Unknown'}
                            </span>
                            {showFinancialDetails && (
                              <span className="font-medium text-sm shrink-0">
                                {total === null ? '—' : formatCurrency(total)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {parseLocalDate(session.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {' · '}{session.duration_minutes} min
                            {session.contractor ? ` · ${session.contractor.name}` : ''}
                          </p>
                          {clientNames && (
                            <p className="text-xs text-muted-foreground truncate">
                              {clientNames}{extraClients}
                            </p>
                          )}
                        </Link>
                      </div>
                      {canApprove && (
                        <div className="flex gap-2 mt-2 ml-8">
                          {/* Row actions stay quiet (outline) — the filled primary style is
                              reserved for the bulk Approve (N) in the card header. */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs text-success border-success/30 hover:bg-success-soft"
                            disabled={approvingId === session.id || isLeaving}
                            onClick={(e) => handleApprove(e, session.id)}
                          >
                            {approvingId === session.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs text-warning border-warning/30 hover:bg-warning-soft"
                            disabled={isLeaving}
                            onClick={(e) => handleReject(e, session.id)}
                          >
                            Revise
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <RejectSessionDialog
        sessionId={rejectDialogSession || ''}
        open={!!rejectDialogSession}
        onOpenChange={(open) => { if (!open) setRejectDialogSession(null) }}
        onRejected={() => {
          if (rejectDialogSession) {
            setLeavingIds((prev) => new Set(prev).add(rejectDialogSession))
            setSelectedIds((prev) => {
              const next = new Set(prev)
              next.delete(rejectDialogSession)
              return next
            })
          }
          setRejectDialogSession(null)
        }}
      />
    </>
  )
}
