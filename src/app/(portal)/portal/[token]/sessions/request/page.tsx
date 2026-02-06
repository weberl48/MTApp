'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePortal } from '@/contexts/portal-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Calendar, Clock, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function RequestSessionPage() {
  const { token } = usePortal()

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [alternativeDate, setAlternativeDate] = useState('')
  const [alternativeTime, setAlternativeTime] = useState('')
  const [duration, setDuration] = useState('30')
  const [notes, setNotes] = useState('')

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!preferredDate) {
      toast.error('Please select a preferred date')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/portal/session-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferred_date: preferredDate,
          preferred_time: preferredTime || null,
          alternative_date: alternativeDate || null,
          alternative_time: alternativeTime || null,
          duration_minutes: parseInt(duration),
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request')
      }

      setSubmitted(true)
      toast.success('Session request submitted!')
    } catch (error) {
      console.error('[MCA] Error submitting request')
      toast.error(error instanceof Error ? error.message : 'Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Request Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Your session request has been sent to your therapist. They&apos;ll
                review it and get back to you soon.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false)
                    setPreferredDate('')
                    setPreferredTime('')
                    setAlternativeDate('')
                    setAlternativeTime('')
                    setNotes('')
                  }}
                >
                  Request Another
                </Button>
                <Link href={`/portal/${token}/sessions`}>
                  <Button>View Sessions</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/portal/${token}/sessions`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Request a Session</h1>
          <p className="text-gray-500">Submit your preferred times</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Details</CardTitle>
          <CardDescription>
            Let your therapist know when you&apos;d like to schedule a session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Preferred Date/Time */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Preferred Date & Time
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredDate">Date *</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    min={today}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Time (optional)</Label>
                  <Input
                    id="preferredTime"
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Alternative Date/Time */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                Alternative Date & Time (optional)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alternativeDate">Date</Label>
                  <Input
                    id="alternativeDate"
                    type="date"
                    min={today}
                    value={alternativeDate}
                    onChange={(e) => setAlternativeDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternativeTime">Time</Label>
                  <Input
                    id="alternativeTime"
                    type="time"
                    value={alternativeTime}
                    onChange={(e) => setAlternativeTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Session Length</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information or preferences..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Link href={`/portal/${token}/sessions`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500 text-center">
        Your therapist will review your request and confirm the session time.
      </p>
    </div>
  )
}
