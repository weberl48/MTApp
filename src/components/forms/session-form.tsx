'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
import { X, Calculator, AlertTriangle, AlertCircle, CheckCircle2, Pencil, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { calculateSessionPricing, formatCurrency, getPricingDescription, validateMinimumAttendees } from '@/lib/pricing'
import { useContractorRates } from '@/hooks/use-contractor-rates'
import { parseLocalDate, todayLocal } from '@/lib/dates'
import type { ServiceType, Client } from '@/types/database'
import { toast } from 'sonner'
import { useOrganization } from '@/contexts/organization-context'
import { ClientMultiSelect } from '@/components/forms/client-multi-select'
import {
  clearSessionFormDefaults,
  getSessionFormDefaultsStorageKey,
  loadSessionFormDefaults,
  saveSessionFormDefaults,
} from '@/lib/session-form/defaults'
import { createNewSession } from '@/lib/session-form/create-session'
import { encryptPHI } from '@/lib/crypto/actions'

interface ExistingSession {
  id: string
  date: string
  time: string | null
  duration_minutes: number
  service_type_id: string
  status: string
  notes: string | null
  client_notes: string | null
  group_headcount: number | null
  group_member_names: string | null
  attendees: { client_id: string }[]
}

interface SessionFormProps {
  serviceTypes: ServiceType[]
  clients: Array<Pick<Client, 'id' | 'name' | 'payment_method'>>
  contractorId: string
  existingSession?: ExistingSession
}

export function SessionForm({ serviceTypes, clients, contractorId, existingSession }: SessionFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { organization, settings, can, viewAsContractor } = useOrganization()

  // When "view as" a specific contractor, use their ID for new sessions
  const effectiveContractorId = (!existingSession && viewAsContractor?.id) ? viewAsContractor.id : contractorId
  const showFinancialDetails = can('financial:view-details')
  const isEditMode = !!existingSession

  // Filter service types by contractor restrictions (admins see all)
  const visibleServiceTypes = useMemo(() => {
    if (showFinancialDetails) return serviceTypes // Admins/owners see all
    return serviceTypes.filter((st) =>
      !st.allowed_contractor_ids || st.allowed_contractor_ids.length === 0 || st.allowed_contractor_ids.includes(effectiveContractorId)
    )
  }, [serviceTypes, effectiveContractorId, showFinancialDetails])

  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(existingSession?.date || todayLocal())
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

  // Group session fields
  const [groupHeadcount, setGroupHeadcount] = useState(existingSession?.group_headcount?.toString() || '')
  // groupMemberNames removed — groups now use headcount only

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Success state for "Log Another" flow
  const [showSuccess, setShowSuccess] = useState(false)
  const wasScholarshipRef = useRef(false)

  function setFieldError(field: string, message: string) {
    setErrors(prev => ({ ...prev, [field]: message }))
  }

  function clearFieldError(field: string) {
    setErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function clearAllErrors() {
    setErrors({})
  }

  // Contractor-specific pricing overrides
  const { getOverrides: getContractorOverrides, hasMissingRate } = useContractorRates(effectiveContractorId)

  const storageKey = useMemo(() => {
    if (!organization?.id) return null
    return getSessionFormDefaultsStorageKey({ organizationId: organization.id, contractorId: effectiveContractorId })
  }, [organization?.id, effectiveContractorId])

  // Get selected service type for pricing calculation
  const selectedServiceType = serviceTypes.find((st) => st.id === serviceTypeId)

  // Check if this is a group service type (has per_person_rate > 0)
  const isGroupService = selectedServiceType && selectedServiceType.per_person_rate > 0

  // Check if this service type requires a client (admin work does not)
  const requiresClient = selectedServiceType?.requires_client !== false

  // Whether notes are required on submit (configurable via org settings)
  const notesRequired = settings?.session?.require_notes !== false

  // For groups, use headcount; for no-client services, default to 1; for individuals, use selected clients count
  const attendeeCount = isGroupService
    ? parseInt(groupHeadcount) || 0
    : !requiresClient
      ? 1
      : selectedClients.length

  // Build contractor pricing overrides for this service type
  const contractorOverrides = serviceTypeId ? getContractorOverrides(serviceTypeId) : undefined

  // Check if custom rate exists for the selected service type
  const missingCustomRate = serviceTypeId ? hasMissingRate(serviceTypeId) : false

  // Determine payment method for pricing (scholarship affects pricing)
  // Service types flagged as scholarship always use scholarship pricing
  // For single-client sessions, use that client's payment method
  // For groups/mixed, show normal pricing (scholarship handled per-client at invoice time)
  const selectedPaymentMethod = useMemo(() => {
    if (selectedServiceType?.is_scholarship) return 'scholarship'
    if (selectedClients.length === 1) {
      const client = clients.find(c => c.id === selectedClients[0])
      return client?.payment_method
    }
    return undefined
  }, [selectedClients, clients, selectedServiceType?.is_scholarship])

  // Calculate pricing whenever service type, attendees, or duration change
  const pricing = selectedServiceType && attendeeCount > 0
    ? calculateSessionPricing(selectedServiceType, attendeeCount, parseInt(duration), contractorOverrides, { paymentMethod: selectedPaymentMethod, durationBaseMinutes: settings?.pricing?.duration_base_minutes })
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
      } catch {
        // Duplicate check is non-critical; silently ignore
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
    setDidApplyDefaults(true)
  }, [didApplyDefaults, isEditMode, storageKey])

  // Collapsible setup: contractors with remembered defaults start collapsed on mobile
  const hasPopulatedDefaults = didApplyDefaults && !isEditMode && !showFinancialDetails
    && !!serviceTypeId
  const [setupExpanded, setSetupExpanded] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearAllErrors()

    let hasErrors = false

    if (!serviceTypeId) {
      setFieldError('serviceType', 'Please select a service type')
      hasErrors = true
    }

    if (serviceTypeId && missingCustomRate) {
      setFieldError('serviceType', 'No custom rate set for this contractor and service type. Please set a rate in Team > Rates.')
      hasErrors = true
    }

    if (isGroupService) {
      const headcount = parseInt(groupHeadcount)
      if (!headcount || headcount < 1) {
        setFieldError('groupHeadcount', 'Please enter the number of attendees')
        hasErrors = true
      }
    } else if (requiresClient) {
      if (selectedClients.length === 0) {
        setFieldError('clients', 'Please add at least one client')
        hasErrors = true
      }

      // Validate minimum attendees for service type (e.g., 8-week programs)
      if (selectedServiceType) {
        const minAttendeesError = validateMinimumAttendees(selectedServiceType, attendeeCount)
        if (minAttendeesError) {
          setFieldError('clients', minAttendeesError)
          hasErrors = true
        }
      }
    }

    // Require notes when submitting (not for drafts), if enabled in settings
    if (status === 'submitted' && notesRequired) {
      if (!notes.trim()) {
        setFieldError('notes', 'Internal notes are required when submitting')
        hasErrors = true
      }
      if (!clientNotes.trim()) {
        setFieldError('clientNotes', 'Client notes are required when submitting')
        hasErrors = true
      }
    }

    if (hasErrors) {
      toast.error('Please fix the errors below')
      return
    }

    setLoading(true)

    try {
      // Encrypt PHI fields before saving (server action has access to ENCRYPTION_KEY)
      const encrypted = await encryptPHI({ notes, clientNotes })
      const encryptedNotes = encrypted.notes
      const encryptedClientNotes = encrypted.clientNotes

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
            notes: encryptedNotes,
            client_notes: encryptedClientNotes,
            group_headcount: isGroupService ? parseInt(groupHeadcount) || null : null,
            group_member_names: null,
            rejection_reason: status === 'submitted' ? null : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSession.id)

        if (sessionError) throw sessionError

        // Delete old attendees and add new ones (individual sessions only)
        await supabase
          .from('session_attendees')
          .delete()
          .eq('session_id', existingSession.id)

        if (!isGroupService && selectedClients.length > 0) {
          const attendees = selectedClients.map((clientId) => ({
            session_id: existingSession.id,
            client_id: clientId,
            individual_cost: pricing?.totalAmount || 0,
          }))

          const { error: attendeesError } = await supabase
            .from('session_attendees')
            .insert(attendees)

          if (attendeesError) throw attendeesError
        }

        toast.success('Session updated successfully!')
        router.push(`/sessions/${existingSession.id}/`)
        router.refresh()
      } else {
        // CREATE new session
        // Auto-approve: if automation enabled and user chose 'submitted', set to 'approved'
        const effectiveStatus =
          status === 'submitted' && settings?.automation?.auto_approve_sessions
            ? 'approved'
            : status

        const result = await createNewSession({
          supabase,
          date,
          time,
          durationMinutes: parseInt(duration),
          serviceTypeId,
          contractorId: effectiveContractorId,
          organizationId: organization!.id,
          clientIds: isGroupService || !requiresClient ? [] : selectedClients,
          encryptedNotes,
          encryptedClientNotes,
          status: effectiveStatus,
          groupHeadcount: isGroupService ? parseInt(groupHeadcount) || null : null,
          pricing: pricing!,
          isScholarshipService: selectedServiceType?.is_scholarship ?? false,
        })

        if (result.invoiceError) {
          toast.error('Session saved but invoices could not be created. Please create invoices manually.')
        }

        if (storageKey) {
          saveSessionFormDefaults(storageKey, {
            time,
            duration,
            serviceTypeId,
          })
        }

        toast.success('Session logged successfully!')
        wasScholarshipRef.current = selectedPaymentMethod === 'scholarship'
        setShowSuccess(true)
      }
    } catch {
      toast.error(isEditMode ? 'Failed to update session' : 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  // Get client name by ID
  function getClientName(clientId: string) {
    return clients.find((c) => c.id === clientId)?.name || 'Unknown'
  }

  // Reset form for logging another session
  function handleLogAnother() {
    setDate(todayLocal())
    setNotes('')
    setClientNotes('')
    setGroupHeadcount('')
    setSelectedClients([])
    setShowSuccess(false)
    clearAllErrors()
    // Keep: time, duration, serviceTypeId (remembered)
  }

  // Show success state with options after submission
  if (showSuccess) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Logged!</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {wasScholarshipRef.current
                  ? 'This scholarship session will appear on the Invoices \u203A Scholarship tab for monthly batch invoicing.'
                  : 'Your session has been saved and submitted for approval.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                type="button"
                size="lg"
                onClick={handleLogAnother}
                className="order-1 sm:order-2"
              >
                Log Another Session
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.push('/sessions/')}
                className="order-2 sm:order-1"
              >
                View All Sessions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Collapsed summary for contractors with remembered defaults (mobile only) */}
          {hasPopulatedDefaults && !setupExpanded && (
            <button
              type="button"
              onClick={() => setSetupExpanded(true)}
              className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 lg:hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {date === todayLocal() ? 'Today' : parseLocalDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {', '}{new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {' \u00B7 '}{duration} min
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {selectedServiceType?.name || 'Unknown Service'}
                    {' \u00B7 '}
                    {isGroupService
                      ? `${groupHeadcount || '?'} attendees`
                      : selectedClients.map(id => getClientName(id)).join(', ')}
                  </p>
                  {pricing && (
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Your Earnings: {formatCurrency(pricing.contractorPay)}
                    </p>
                  )}
                </div>
                <Pencil className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              </div>
            </button>
          )}

          {/* Setup fields: always visible on desktop, collapsible on mobile for contractors */}
          <div className={hasPopulatedDefaults && !setupExpanded ? 'hidden lg:contents' : 'contents'}>
          {/* Date and Time - always side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                Date *
                {date === todayLocal() && (
                  <span className="text-xs font-normal text-green-600 dark:text-green-400">Today</span>
                )}
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="text-base" // Prevents zoom on iOS
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
                className="text-base" // Prevents zoom on iOS
              />
            </div>
          </div>

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
            <Select
              value={serviceTypeId}
              onValueChange={(val) => {
                setServiceTypeId(val)
                clearFieldError('serviceType')
                // Clear client selection when switching to a group service
                const st = serviceTypes.find((s) => s.id === val)
                if (st && st.per_person_rate > 0) {
                  setSelectedClients([])
                }
              }}
            >
              <SelectTrigger className={errors.serviceType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {visibleServiceTypes.map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceType && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.serviceType}
              </p>
            )}
            {missingCustomRate && !errors.serviceType && (
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                No custom rate set for this service type. Set one in Team &gt; Rates.
              </p>
            )}
            {selectedServiceType && showFinancialDetails && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getPricingDescription(selectedServiceType)}
              </p>
            )}
          </div>

          {/* Clients - Only for individual (non-group) sessions that require a client */}
          {!isGroupService && requiresClient && (
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
                onChange={(ids) => {
                  setSelectedClients(ids)
                  if (ids.length > 0) clearFieldError('clients')
                }}
              />
            )}
            {errors.clients && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.clients}
              </p>
            )}
            {clients.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                No clients found. Please add clients first.
              </p>
            )}
          </div>
          )}

          {/* Scholarship info banner */}
          {selectedPaymentMethod === 'scholarship' && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Scholarship sessions are invoiced monthly in batch — no per-session invoice will be created.
              </AlertDescription>
            </Alert>
          )}

          {/* Group Headcount - Only show for group service types */}
          {isGroupService && (
            <div className="space-y-2">
              <Label htmlFor="groupHeadcount">Number of Attendees *</Label>
              <Input
                id="groupHeadcount"
                type="number"
                min="1"
                max="50"
                value={groupHeadcount}
                onChange={(e) => {
                  setGroupHeadcount(e.target.value)
                  if (e.target.value) clearFieldError('groupHeadcount')
                }}
                placeholder="Enter headcount"
                className={errors.groupHeadcount ? 'border-red-500' : ''}
              />
              {errors.groupHeadcount && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.groupHeadcount}
                </p>
              )}
            </div>
          )}

          {/* Pricing Preview */}
          {pricing && showFinancialDetails && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Pricing Breakdown</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(pricing.totalAmount)}</span>

                  <span className="text-gray-600 dark:text-gray-400">Per Person:</span>
                  <span className="font-medium">{formatCurrency(pricing.perPersonCost)}</span>

                  <span className="text-gray-600 dark:text-gray-400">MCA Cut:</span>
                  <span className="font-medium">{formatCurrency(pricing.mcaCut)}</span>

                  {pricing.rentAmount > 0 && (
                    <>
                      <span className="text-gray-600 dark:text-gray-400">Rent:</span>
                      <span className="font-medium">{formatCurrency(pricing.rentAmount)}</span>
                    </>
                  )}

                  <span className="text-gray-600 dark:text-gray-400">Contractor Pay:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(pricing.contractorPay)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          {pricing && !showFinancialDetails && (
            <div className="flex items-center justify-between py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
              <span className="text-gray-600 dark:text-gray-400">Your Earnings</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(pricing.contractorPay)}
              </span>
            </div>
          )}
          </div>{/* end collapsible setup fields wrapper */}

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes {notesRequired && status === 'submitted' && '*'}</Label>
            <Textarea
              id="notes"
              placeholder="Internal notes (not visible to client)..."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                if (e.target.value.trim()) clearFieldError('notes')
              }}
              rows={2}
              className={errors.notes ? 'border-red-500' : ''}
            />
            {errors.notes && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.notes}
              </p>
            )}
          </div>

          {/* Client-Facing Notes */}
          <div className="space-y-2">
            <Label htmlFor="clientNotes">Client Notes {notesRequired && status === 'submitted' && '*'}</Label>
            <Textarea
              id="clientNotes"
              placeholder="Notes visible to client in their portal..."
              value={clientNotes}
              onChange={(e) => {
                setClientNotes(e.target.value)
                if (e.target.value.trim()) clearFieldError('clientNotes')
              }}
              rows={2}
              className={errors.clientNotes ? 'border-red-500' : ''}
            />
            {errors.clientNotes && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.clientNotes}
              </p>
            )}
          </div>

          {/* Status */}
          {showFinancialDetails ? (
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
          ) : (
            status === 'draft' ? (
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-amber-600 dark:text-amber-400">Saving as draft (not submitted)</span>
                <button type="button" onClick={() => setStatus('submitted')} className="text-blue-600 dark:text-blue-400 underline">
                  Submit instead
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setStatus('draft')} className="text-xs text-gray-500 dark:text-gray-400 underline">
                Save as draft instead?
              </button>
            )
          )}

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-200">Potential Duplicate Session</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                <strong>{duplicateWarning.clientName}</strong> already has a <strong>{duplicateWarning.serviceTypeName}</strong> session
                on <strong>{parseLocalDate(duplicateWarning.date).toLocaleDateString()}</strong>.
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
                : 'Creating session...'
              : isEditMode
                ? 'Update Session'
                : status === 'submitted'
                  ? 'Submit Session'
                  : 'Save Draft'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
