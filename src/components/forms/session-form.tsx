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
import { X, Calculator, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { calculateSessionPricing, formatCurrency, getPricingDescription, ContractorPricingOverrides, validateMinimumAttendees } from '@/lib/pricing'
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

  // Group session fields
  const [groupHeadcount, setGroupHeadcount] = useState(existingSession?.group_headcount?.toString() || '')
  // groupMemberNames removed — groups now use headcount only

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Success state for "Log Another" flow
  const [showSuccess, setShowSuccess] = useState(false)

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
  const [contractorPayIncrease, setContractorPayIncrease] = useState<number>(0)
  const [contractorCustomRates, setContractorCustomRates] = useState<Map<string, number>>(new Map())

  // Fetch contractor-specific rates on mount
  useEffect(() => {
    async function loadContractorRates() {
      // Fetch contractor's pay_increase
      const { data: contractor } = await supabase
        .from('users')
        .select('pay_increase')
        .eq('id', effectiveContractorId)
        .single()

      if (contractor?.pay_increase) {
        setContractorPayIncrease(contractor.pay_increase)
      }

      // Fetch any custom rates for this contractor
      const { data: rates } = await supabase
        .from('contractor_rates')
        .select('service_type_id, contractor_pay')
        .eq('contractor_id', effectiveContractorId)

      if (rates && rates.length > 0) {
        const ratesMap = new Map<string, number>()
        for (const rate of rates) {
          ratesMap.set(rate.service_type_id, rate.contractor_pay)
        }
        setContractorCustomRates(ratesMap)
      }
    }

    loadContractorRates()
  }, [effectiveContractorId, supabase])

  const storageKey = useMemo(() => {
    if (!organization?.id) return null
    return getSessionFormDefaultsStorageKey({ organizationId: organization.id, contractorId: effectiveContractorId })
  }, [organization?.id, effectiveContractorId])

  // Get selected service type for pricing calculation
  const selectedServiceType = serviceTypes.find((st) => st.id === serviceTypeId)

  // Check if this is a group service type (has per_person_rate > 0)
  const isGroupService = selectedServiceType && selectedServiceType.per_person_rate > 0

  // For groups, use headcount; for individuals, use selected clients count
  const attendeeCount = isGroupService
    ? parseInt(groupHeadcount) || 0
    : selectedClients.length

  // Build contractor pricing overrides for this service type
  const contractorOverrides: ContractorPricingOverrides | undefined = useMemo(() => {
    if (!serviceTypeId) return undefined
    const customPay = contractorCustomRates.get(serviceTypeId)
    if (!customPay && !contractorPayIncrease) return undefined
    return {
      customContractorPay: customPay,
      payIncrease: contractorPayIncrease,
    }
  }, [serviceTypeId, contractorCustomRates, contractorPayIncrease])

  // Check if custom rate exists for the selected service type
  const missingCustomRate = serviceTypeId && contractorCustomRates.size > 0
    ? !contractorCustomRates.has(serviceTypeId)
    : serviceTypeId && contractorCustomRates.size === 0

  // Determine payment method for pricing (scholarship affects pricing)
  // For single-client sessions, use that client's payment method
  // For groups/mixed, show normal pricing (scholarship handled per-client at invoice time)
  const selectedPaymentMethod = useMemo(() => {
    if (selectedClients.length === 1) {
      const client = clients.find(c => c.id === selectedClients[0])
      return client?.payment_method
    }
    return undefined
  }, [selectedClients, clients])

  // Calculate pricing whenever service type, attendees, or duration change
  const pricing = selectedServiceType && attendeeCount > 0
    ? calculateSessionPricing(selectedServiceType, attendeeCount, parseInt(duration), contractorOverrides, { paymentMethod: selectedPaymentMethod })
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

    if (selectedClients.length === 0) {
      setFieldError('clients', 'Please add at least one client')
      hasErrors = true
    }

    // Group session validation
    if (isGroupService) {
      const headcount = parseInt(groupHeadcount)
      if (!headcount || headcount < 1) {
        setFieldError('groupHeadcount', 'Please enter the number of attendees')
        hasErrors = true
      }
    }

    // Validate minimum attendees for service type (e.g., 8-week programs)
    if (selectedServiceType) {
      const minAttendeesError = validateMinimumAttendees(selectedServiceType, attendeeCount)
      if (minAttendeesError) {
        setFieldError('clients', minAttendeesError)
        hasErrors = true
      }
    }

    // Require notes when submitting (not for drafts)
    if (status === 'submitted') {
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

        // Delete old attendees and add new ones
        await supabase
          .from('session_attendees')
          .delete()
          .eq('session_id', existingSession.id)

        const attendees = selectedClients.map((clientId) => ({
          session_id: existingSession.id,
          client_id: clientId,
          individual_cost: pricing?.totalAmount || 0,
        }))

        const { error: attendeesError } = await supabase
          .from('session_attendees')
          .insert(attendees)

        if (attendeesError) throw attendeesError

        toast.success('Session updated successfully!')
        router.push(`/sessions/${existingSession.id}/`)
        router.refresh()
      } else {
        // CREATE new session
        // Get client payment methods for invoicing
        const clientData = await supabase
          .from('clients')
          .select('id, payment_method')
          .in('id', selectedClients)

        // Auto-approve: if automation enabled and user chose 'submitted', set to 'approved'
        const effectiveStatus =
          status === 'submitted' && settings?.automation?.auto_approve_sessions
            ? 'approved'
            : status

        // Create the session
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            date,
            time: time + ':00',
            duration_minutes: parseInt(duration),
            service_type_id: serviceTypeId,
            contractor_id: effectiveContractorId,
            status: effectiveStatus,
            notes: encryptedNotes,
            client_notes: encryptedClientNotes,
            group_headcount: isGroupService ? parseInt(groupHeadcount) || null : null,
            group_member_names: null,
            organization_id: organization!.id,
          })
          .select()
          .single()

        if (sessionError) throw sessionError

        // Add attendees
        const attendees = selectedClients.map((clientId) => ({
          session_id: session.id,
          client_id: clientId,
          individual_cost: pricing?.totalAmount || 0,
        }))

        const { error: attendeesError } = await supabase
          .from('session_attendees')
          .insert(attendees)

        if (attendeesError) throw attendeesError

        // If submitted, create invoices for each client
        if (status === 'submitted' && pricing && selectedServiceType) {
          const invoices = (clientData.data || [])
            .filter((client) => client.payment_method !== 'scholarship') // Scholarship clients get monthly batch invoices
            .map((client) => ({
              session_id: session.id,
              client_id: client.id,
              amount: pricing.totalAmount,
              mca_cut: pricing.mcaCut,
              contractor_pay: pricing.contractorPay,
              rent_amount: pricing.rentAmount,
              payment_method: client.payment_method,
              status: 'pending' as const,
              organization_id: organization!.id,
            }))

          const { error: invoicesError } = await supabase
            .from('invoices')
            .insert(invoices)

          if (invoicesError) {
            toast.error('Session saved but invoices could not be created. Please create invoices manually.')
          }
        }

        if (storageKey) {
          saveSessionFormDefaults(storageKey, {
            time,
            duration,
            serviceTypeId,
            selectedClientIds: selectedClients,
          })
        }

        toast.success('Session logged successfully!')
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
    setDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setClientNotes('')
    setGroupHeadcount('')
    setShowSuccess(false)
    clearAllErrors()
    // Keep: time, duration, serviceTypeId, selectedClients (remembered)
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
                Your session has been saved and submitted for approval.
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
          {/* Date and Time - stacks on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
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
              }}
            >
              <SelectTrigger className={errors.serviceType ? 'border-red-500' : ''}>
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

          {/* Clients - For billing entity (e.g., People Inc, BryLin) */}
          <div className="space-y-2">
            <Label>{isGroupService ? 'Billing Client *' : 'Clients *'}</Label>
            {isGroupService && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select the organization or client being billed for this group session.
              </p>
            )}
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
                  setSelectedClients(isGroupService ? ids.slice(-1) : ids)
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
          {pricing && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {showFinancialDetails ? 'Pricing Breakdown' : 'Session Summary'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {showFinancialDetails && (
                    <>
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
                    </>
                  )}

                  <span className="text-gray-600 dark:text-gray-400">
                    {showFinancialDetails ? 'Contractor Pay:' : 'Your Earnings:'}
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(pricing.contractorPay)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes {status === 'submitted' && '*'}</Label>
            <Textarea
              id="notes"
              placeholder="Internal notes (not visible to client)..."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                if (e.target.value.trim()) clearFieldError('notes')
              }}
              rows={3}
              className={errors.notes ? 'border-red-500' : ''}
            />
            {errors.notes ? (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.notes}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                These notes are for internal use only and will not be shared with the client.
              </p>
            )}
          </div>

          {/* Client-Facing Notes */}
          <div className="space-y-2">
            <Label htmlFor="clientNotes">Client Notes {status === 'submitted' && '*'}</Label>
            <Textarea
              id="clientNotes"
              placeholder="Notes to share with the client in their portal..."
              value={clientNotes}
              onChange={(e) => {
                setClientNotes(e.target.value)
                if (e.target.value.trim()) clearFieldError('clientNotes')
              }}
              rows={3}
              className={errors.clientNotes ? 'border-red-500' : ''}
            />
            {errors.clientNotes ? (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.clientNotes}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                These notes will be visible to the client in their portal.
              </p>
            )}
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
