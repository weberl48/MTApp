'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { X, Calculator, Repeat, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { calculateSessionPricing, formatCurrency, getPricingDescription } from '@/lib/pricing'
import type { ServiceType, Client } from '@/types/database'
import { toast } from 'sonner'
import { addWeeks, format, parseISO } from 'date-fns'
import { useOrganization } from '@/contexts/organization-context'
import { ClientMultiSelect } from '@/components/forms/client-multi-select'
import {
  clearSessionFormDefaults,
  getSessionFormDefaultsStorageKey,
  loadSessionFormDefaults,
  saveSessionFormDefaults,
} from '@/lib/session-form/defaults'

interface ExistingSession {
  id: string
  date: string
  time: string | null
  duration_minutes: number
  service_type_id: string
  status: string
  notes: string | null
  client_notes: string | null
  attendees: { client_id: string }[]
}

interface SessionFormProps {
  serviceTypes: ServiceType[]
  clients: Array<Pick<Client, 'id' | 'name'>>
  contractorId: string
  existingSession?: ExistingSession
}

export function SessionForm({ serviceTypes, clients, contractorId, existingSession }: SessionFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { organization } = useOrganization()
  const isEditMode = !!existingSession

  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(existingSession?.date || new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(existingSession?.time?.slice(0, 5) || '09:00')
  const [duration, setDuration] = useState(existingSession?.duration_minutes?.toString() || '30')
  const [serviceTypeId, setServiceTypeId] = useState(existingSession?.service_type_id || '')
  const [selectedClients, setSelectedClients] = useState<string[]>(
    existingSession?.attendees?.map(a => a.client_id) || []
  )
  const [notes, setNotes] = useState(existingSession?.notes || '')
  const [clientNotes, setClientNotes] = useState(existingSession?.client_notes || '')
  const [status, setStatus] = useState<'draft' | 'submitted'>(
    (existingSession?.status as 'draft' | 'submitted') || 'submitted'
  )

  const storageKey = useMemo(() => {
    if (!organization?.id) return null
    return getSessionFormDefaultsStorageKey({ organizationId: organization.id, contractorId })
  }, [organization?.id, contractorId])

  // Recurring session state
  const [isRecurring, setIsRecurring] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'weeks' | 'until'>('weeks')
  const [repeatWeeks, setRepeatWeeks] = useState('4')
  const [endDate, setEndDate] = useState('')

  // Get selected service type for pricing calculation
  const selectedServiceType = serviceTypes.find((st) => st.id === serviceTypeId)

  // Calculate pricing whenever service type, clients, or duration change
  const pricing = selectedServiceType && selectedClients.length > 0
    ? calculateSessionPricing(selectedServiceType, selectedClients.length, parseInt(duration))
    : null

  // Duplicate detection
  const [duplicateWarning, setDuplicateWarning] = useState<{
    sessionId: string
    clientName: string
    date: string
    serviceTypeName: string
  } | null>(null)

  // Check for duplicates when date, clients, or service type changes
  useEffect(() => {
    if (isEditMode) return // Don't check duplicates when editing
    if (!date || !serviceTypeId || selectedClients.length === 0) {
      setDuplicateWarning(null)
      return
    }

    const checkDuplicates = async () => {
      try {
        // Check if any of the selected clients already have a session on this date with this service type
        const { data, error } = await supabase
          .from('sessions')
          .select(`
            id,
            date,
            service_type:service_types(name),
            attendees:session_attendees(
              client:clients(id, name)
            )
          `)
          .eq('date', date)
          .eq('service_type_id', serviceTypeId)
          .neq('status', 'cancelled')
          .limit(10)

        if (error) {
          console.error('Error checking duplicates:', error)
          return
        }

        // Find if any selected client is already in a session on this date
        for (const session of data || []) {
          const sessionAttendees = session.attendees || []
          for (const attendee of sessionAttendees) {
            const client = Array.isArray(attendee.client) ? attendee.client[0] : attendee.client
            if (client && selectedClients.includes(client.id)) {
              const serviceType = Array.isArray(session.service_type) ? session.service_type[0] : session.service_type
              setDuplicateWarning({
                sessionId: session.id,
                clientName: client.name,
                date: session.date,
                serviceTypeName: serviceType?.name || 'Unknown',
              })
              return
            }
          }
        }

        setDuplicateWarning(null)
      } catch (err) {
        console.error('Error checking duplicates:', err)
      }
    }

    // Debounce the check
    const timeout = setTimeout(checkDuplicates, 300)
    return () => clearTimeout(timeout)
  }, [date, serviceTypeId, selectedClients, isEditMode, supabase])

  function removeClient(clientId: string) {
    setSelectedClients(selectedClients.filter((id) => id !== clientId))
  }

  // Load remembered defaults (new sessions only). Never persist/restore notes.
  const clientIdSet = useMemo(() => new Set(clients.map((c) => c.id)), [clients])
  const [didApplyDefaults, setDidApplyDefaults] = useState(false)

  useEffect(() => {
    if (isEditMode) return
    if (!storageKey) return
    if (didApplyDefaults) return

    const defaults = loadSessionFormDefaults(storageKey)
    if (!defaults) {
      setDidApplyDefaults(true)
      return
    }

    setTime(defaults.time)
    setDuration(defaults.duration)
    setServiceTypeId(defaults.serviceTypeId)
    setSelectedClients(defaults.selectedClientIds.filter((id) => clientIdSet.has(id)))
    setDidApplyDefaults(true)
  }, [clientIdSet, didApplyDefaults, isEditMode, storageKey])

  // Calculate all session dates for recurring sessions
  function getSessionDates(): string[] {
    const startDate = parseISO(date)
    const dates: string[] = [date]

    if (!isRecurring) return dates

    if (repeatMode === 'weeks') {
      const numWeeks = parseInt(repeatWeeks)
      for (let i = 1; i < numWeeks; i++) {
        dates.push(format(addWeeks(startDate, i), 'yyyy-MM-dd'))
      }
    } else if (repeatMode === 'until' && endDate) {
      const end = parseISO(endDate)
      let nextDate = addWeeks(startDate, 1)
      while (nextDate <= end) {
        dates.push(format(nextDate, 'yyyy-MM-dd'))
        nextDate = addWeeks(nextDate, 1)
      }
    }

    return dates
  }

  // Calculate number of sessions for preview
  const sessionCount = isRecurring ? getSessionDates().length : 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!serviceTypeId) {
      toast.error('Please select a service type')
      return
    }

    if (selectedClients.length === 0) {
      toast.error('Please add at least one client')
      return
    }

    setLoading(true)

    try {
      if (isEditMode && existingSession) {
        // UPDATE existing session
        const { error: sessionError } = await supabase
          .from('sessions')
          .update({
            date,
            time: time + ':00',
            duration_minutes: parseInt(duration),
            service_type_id: serviceTypeId,
            status,
            notes: notes || null,
            client_notes: clientNotes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSession.id)

        if (sessionError) throw sessionError

        // Delete old attendees and add new ones
        await supabase
          .from('session_attendees')
          .delete()
          .eq('session_id', existingSession.id)

        const attendees = selectedClients.map((clientId) => ({
          session_id: existingSession.id,
          client_id: clientId,
          individual_cost: pricing?.perPersonCost || 0,
        }))

        const { error: attendeesError } = await supabase
          .from('session_attendees')
          .insert(attendees)

        if (attendeesError) throw attendeesError

        toast.success('Session updated successfully!')
        router.push(`/sessions/${existingSession.id}/`)
        router.refresh()
      } else {
        // CREATE new session(s)
        // Get all session dates (single or recurring)
        const sessionDates = getSessionDates()

        // Get client payment methods for invoicing
        const clientData = await supabase
          .from('clients')
          .select('id, payment_method')
          .in('id', selectedClients)

        // Create each session
        for (const sessionDate of sessionDates) {
          // Create the session
          const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert({
              date: sessionDate,
              time: time + ':00',
              duration_minutes: parseInt(duration),
              service_type_id: serviceTypeId,
              contractor_id: contractorId,
              status,
              notes: notes || null,
              client_notes: clientNotes || null,
              organization_id: organization!.id,
            })
            .select()
            .single()

          if (sessionError) throw sessionError

          // Add attendees
          const attendees = selectedClients.map((clientId) => ({
            session_id: session.id,
            client_id: clientId,
            individual_cost: pricing?.perPersonCost || 0,
          }))

          const { error: attendeesError } = await supabase
            .from('session_attendees')
            .insert(attendees)

          if (attendeesError) throw attendeesError

          // If submitted, create invoices for each client
          if (status === 'submitted' && pricing) {
            const invoices = (clientData.data || []).map((client) => ({
              session_id: session.id,
              client_id: client.id,
              amount: pricing.perPersonCost,
              mca_cut: pricing.mcaCut / selectedClients.length,
              contractor_pay: pricing.contractorPay / selectedClients.length,
              rent_amount: pricing.rentAmount / selectedClients.length,
              payment_method: client.payment_method,
              status: 'pending' as const,
              organization_id: organization!.id,
            }))

            const { error: invoicesError } = await supabase
              .from('invoices')
              .insert(invoices)

            if (invoicesError) {
              console.error('Error creating invoices:', invoicesError)
              // Don't fail the whole submission, just log the error
            }
          }
        }

        const message = sessionDates.length > 1
          ? `${sessionDates.length} sessions logged successfully!`
          : 'Session logged successfully!'

        if (storageKey) {
          saveSessionFormDefaults(storageKey, {
            time,
            duration,
            serviceTypeId,
            selectedClientIds: selectedClients,
          })
        }

        toast.success(message)
        router.push('/sessions/')
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving session:', error)
      toast.error(isEditMode ? 'Failed to update session' : 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  // Get client name by ID
  function getClientName(clientId: string) {
    return clients.find((c) => c.id === clientId)?.name || 'Unknown'
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Recurring Session - only show for new sessions */}
          {!isEditMode && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
              <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer">
                <Repeat className="w-4 h-4" />
                Repeat Weekly
              </Label>
            </div>

            {isRecurring && (
              <div className="ml-8 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <RadioGroup value={repeatMode} onValueChange={(v) => setRepeatMode(v as 'weeks' | 'until')}>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="weeks" id="weeks" />
                    <Label htmlFor="weeks" className="flex items-center gap-2 cursor-pointer">
                      For
                      <Select value={repeatWeeks} onValueChange={setRepeatWeeks} disabled={repeatMode !== 'weeks'}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="8">8</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                        </SelectContent>
                      </Select>
                      weeks
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="until" id="until" />
                    <Label htmlFor="until" className="flex items-center gap-2 cursor-pointer">
                      Until
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={date}
                        disabled={repeatMode !== 'until'}
                        className="w-40"
                      />
                    </Label>
                  </div>
                </RadioGroup>

                {sessionCount > 1 && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    This will create {sessionCount} sessions
                  </p>
                )}
              </div>
            )}
          </div>
          )}

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type *</Label>
            <Select value={serviceTypeId} onValueChange={setServiceTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedServiceType && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getPricingDescription(selectedServiceType)}
              </p>
            )}
          </div>

          {/* Clients */}
          <div className="space-y-2">
            <Label>Clients *</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedClients.map((clientId) => (
                <Badge
                  key={clientId}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {getClientName(clientId)}
                  <button
                    type="button"
                    onClick={() => removeClient(clientId)}
                    className="ml-1 hover:text-red-500"
                    aria-label={`Remove ${getClientName(clientId)}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {clients.length > 0 && (
              <ClientMultiSelect
                clients={clients}
                selectedIds={selectedClients}
                onChange={setSelectedClients}
              />
            )}
            {clients.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                No clients found. Please add clients first.
              </p>
            )}
          </div>

          {/* Pricing Preview */}
          {pricing && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Pricing Breakdown
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(pricing.totalAmount)}</span>

                  <span className="text-gray-600 dark:text-gray-400">Per Person:</span>
                  <span className="font-medium">{formatCurrency(pricing.perPersonCost)}</span>

                  <span className="text-gray-600 dark:text-gray-400">MCA Cut:</span>
                  <span className="font-medium">{formatCurrency(pricing.mcaCut)}</span>

                  <span className="text-gray-600 dark:text-gray-400">Contractor Pay:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(pricing.contractorPay)}
                  </span>

                  {pricing.rentAmount > 0 && (
                    <>
                      <span className="text-gray-600 dark:text-gray-400">Rent:</span>
                      <span className="font-medium">{formatCurrency(pricing.rentAmount)}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Internal notes (not visible to client)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              These notes are for internal use only and will not be shared with the client.
            </p>
          </div>

          {/* Client-Facing Notes */}
          <div className="space-y-2">
            <Label htmlFor="clientNotes">Client Notes</Label>
            <Textarea
              id="clientNotes"
              placeholder="Notes to share with the client in their portal..."
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              These notes will be visible to the client in their portal.
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Save as</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="submitted"
                  checked={status === 'submitted'}
                  onChange={() => setStatus('submitted')}
                  className="w-4 h-4"
                />
                <span>Submit for approval</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                  className="w-4 h-4"
                />
                <span>Save as draft</span>
              </label>
            </div>
          </div>

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-200">Potential Duplicate Session</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                <strong>{duplicateWarning.clientName}</strong> already has a <strong>{duplicateWarning.serviceTypeName}</strong> session
                on <strong>{new Date(duplicateWarning.date).toLocaleDateString()}</strong>.
                <br />
                <a
                  href={`/sessions/${duplicateWarning.sessionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  View existing session →
                </a>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            {!isEditMode && storageKey && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 justify-start px-2 text-gray-500"
                disabled={loading}
                onClick={() => {
                  clearSessionFormDefaults(storageKey)
                  setTime('09:00')
                  setDuration('30')
                  setServiceTypeId('')
                  setSelectedClients([])
                  setIsRecurring(false)
                  setRepeatMode('weeks')
                  setRepeatWeeks('4')
                  setEndDate('')
                  toast.success('Remembered defaults cleared')
                }}
              >
                Reset remembered defaults
              </Button>
            )}
          </div>
          <Button type="submit" disabled={loading}>
            {loading
              ? isEditMode
                ? 'Updating session...'
                : `Creating ${sessionCount > 1 ? sessionCount + ' sessions' : 'session'}...`
              : isEditMode
                ? 'Update Session'
                : sessionCount > 1
                  ? `Submit ${sessionCount} Sessions`
                  : status === 'submitted'
                    ? 'Submit Session'
                    : 'Save Draft'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
