'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle, Loader2, Clock } from 'lucide-react'
import { approveSession, bulkApproveSessions } from '@/app/actions/sessions'
import { RejectSessionDialog } from '@/components/sessions/reject-session-dialog'
import { useOrganization } from '@/contexts/organization-context'
import { toast } from 'sonner'
import Link from 'next/link'

interface SubmittedSession {
  id: string
  date: string
  duration_minutes: number
  contractor: { id: string; name: string } | null
  service_type: { name: string } | null
  attendees: { client: { name: string } | null }[]
}

export function PendingApprovals() {
  const [sessions, setSessions] = useState<SubmittedSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectDialogSession, setRejectDialogSession] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { can } = useOrganization()
  const canApprove = can('session:approve')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error: queryError } = await supabase
        .from('sessions')
        .select(`
          id, date, duration_minutes,
          contractor:users!sessions_contractor_id_fkey(id, name),
          service_type:service_types(name),
          attendees:session_attendees(client:clients(name))
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
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(sessionId); return next })
      toast.success('Session approved')
    } else {
      toast.error('error' in result ? result.error : 'Failed to approve')
    }
    setApprovingId(null)
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
        setSessions((prev) => prev.filter((s) => !selectedIds.has(s.id)))
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
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
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
              <Link href="/sessions?status=submitted">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </div>
          <CardDescription>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} awaiting approval
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
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
              <span className="text-xs text-gray-500">Select all</span>
            </div>

            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedIds.has(session.id)
                    ? 'bg-blue-50 dark:bg-blue-950/30'
                    : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <Checkbox
                  checked={selectedIds.has(session.id)}
                  onCheckedChange={(checked) => toggleSelect(session.id, !!checked)}
                  aria-label={`Select session`}
                />
                <Link href={`/sessions/${session.id}/`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate text-sm">
                      {session.service_type?.name || 'Unknown'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {session.duration_minutes} min
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span>
                      {new Date(session.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {session.contractor && <span>by {session.contractor.name}</span>}
                    {session.attendees?.length > 0 && (
                      <span>
                        {session.attendees
                          .slice(0, 2)
                          .map((a) => a.client?.name)
                          .filter(Boolean)
                          .join(', ')}
                        {session.attendees.length > 2 && ` +${session.attendees.length - 2}`}
                      </span>
                    )}
                  </div>
                </Link>
                {canApprove && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={approvingId === session.id}
                      onClick={(e) => handleApprove(e, session.id)}
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
                      onClick={(e) => handleReject(e, session.id)}
                    >
                      Revise
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <RejectSessionDialog
        sessionId={rejectDialogSession || ''}
        open={!!rejectDialogSession}
        onOpenChange={(open) => { if (!open) setRejectDialogSession(null) }}
        onRejected={() => {
          if (rejectDialogSession) {
            setSessions((prev) => prev.filter((s) => s.id !== rejectDialogSession))
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
