'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { rejectSession } from '@/app/actions/sessions'

interface RejectSessionDialogProps {
  sessionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRejected: () => void
}

export function RejectSessionDialog({ sessionId, open, onOpenChange, onRejected }: RejectSessionDialogProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReject() {
    if (!reason.trim()) {
      toast.error('Please enter a reason for requesting revision')
      return
    }
    setLoading(true)
    const result = await rejectSession(sessionId, reason.trim())
    setLoading(false)
    if (result.success) {
      toast.success('Session sent back to contractor for revision')
      setReason('')
      onOpenChange(false)
      onRejected()
    } else {
      toast.error(result.error || 'Failed to reject session')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Revision</DialogTitle>
          <DialogDescription>
            This session will be sent back to the contractor as a draft. They can edit and resubmit it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="rejection-reason">Reason *</Label>
          <Textarea
            id="rejection-reason"
            placeholder="What needs to be fixed..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleReject} disabled={loading} variant="destructive">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : 'Request Revision'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
