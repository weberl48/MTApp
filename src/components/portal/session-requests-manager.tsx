'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Calendar,
  Clock,
  User,
  Check,
  X,
  Loader2,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface SessionRequest {
  id: string
  preferred_date: string
  preferred_time: string | null
  alternative_date: string | null
  alternative_time: string | null
  duration_minutes: number
  notes: string | null
  status: 'pending' | 'approved' | 'declined' | 'cancelled'
  response_notes: string | null
  created_at: string
  client: { id: string; name: string } | null
}

interface SessionRequestsManagerProps {
  organizationId: string
  onRequestProcessed?: () => void
}

export function SessionRequestsManager({
  organizationId,
  onRequestProcessed,
}: SessionRequestsManagerProps) {
  const [requests, setRequests] = useState<SessionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<SessionRequest | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'decline' | null>(null)
  const [responseNotes, setResponseNotes] = useState('')

  useEffect(() => {
    async function loadRequests() {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('session_requests')
        .select(`
          id,
          preferred_date,
          preferred_time,
          alternative_date,
          alternative_time,
          duration_minutes,
          notes,
          status,
          response_notes,
          created_at,
          client:clients(id, name)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading session requests:', error)
      } else {
        const transformed = (data || []).map((req) => ({
          ...req,
          client: Array.isArray(req.client) ? req.client[0] : req.client,
        }))
        setRequests(transformed as SessionRequest[])
      }

      setLoading(false)
    }
    loadRequests()
  }, [organizationId])

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
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

  function openActionDialog(request: SessionRequest, action: 'approve' | 'decline') {
    setSelectedRequest(request)
    setActionType(action)
    setResponseNotes('')
  }

  function closeDialog() {
    setSelectedRequest(null)
    setActionType(null)
    setResponseNotes('')
  }

  async function handleAction() {
    if (!selectedRequest || !actionType) return

    setProcessingId(selectedRequest.id)

    try {
      const response = await fetch(
        `/api/session-requests/${selectedRequest.id}/${actionType}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            response_notes: responseNotes || null,
            // For approve, we're just approving without creating session
            // In a full implementation, you'd show a dialog to set session details
            create_session: false,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${actionType} request`)
      }

      toast.success(
        actionType === 'approve'
          ? 'Request approved!'
          : 'Request declined'
      )

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id))
      closeDialog()
      onRequestProcessed?.()
    } catch (error) {
      console.error(`Error ${actionType}ing request:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${actionType} request`)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Loading requests...</p>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">No pending requests</h3>
          <p className="text-sm text-gray-500">
            Session requests from clients will appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Session Requests ({requests.length})
          </CardTitle>
          <CardDescription>
            Review and respond to client session requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {request.client?.name || 'Unknown Client'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(request.preferred_date)}
                      </span>
                      {request.preferred_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(request.preferred_time)}
                        </span>
                      )}
                      <Badge variant="outline">{request.duration_minutes} min</Badge>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                </div>

                {request.alternative_date && (
                  <p className="text-sm text-gray-500">
                    Alternative: {formatDate(request.alternative_date)}
                    {request.alternative_time && ` at ${formatTime(request.alternative_time)}`}
                  </p>
                )}

                {request.notes && (
                  <div className="flex items-start gap-2 text-sm bg-gray-50 rounded p-2">
                    <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p className="text-gray-600">{request.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => openActionDialog(request, 'approve')}
                    disabled={processingId === request.id}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openActionDialog(request, 'decline')}
                    disabled={processingId === request.id}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Decline'} Request
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? `Approve ${selectedRequest?.client?.name}'s session request for ${selectedRequest?.preferred_date ? formatDate(selectedRequest.preferred_date) : ''}`
                : `Decline ${selectedRequest?.client?.name}'s session request`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="response_notes">
                Message to client (optional)
              </Label>
              <Textarea
                id="response_notes"
                placeholder={
                  actionType === 'approve'
                    ? "e.g., Confirmed! See you then."
                    : "e.g., Sorry, I'm not available that day. Please try another date."
                }
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processingId !== null}
              variant={actionType === 'decline' ? 'destructive' : 'default'}
            >
              {processingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : actionType === 'approve' ? (
                'Approve Request'
              ) : (
                'Decline Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
