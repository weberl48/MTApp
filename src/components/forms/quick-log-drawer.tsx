'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useOrganization } from '@/contexts/organization-context'
import { useContractorRates } from '@/hooks/use-contractor-rates'
import {
  getSessionFormDefaultsStorageKey,
  loadSessionFormDefaults,
  saveSessionFormDefaults,
} from '@/lib/session-form/defaults'
import { createNewSession } from '@/lib/session-form/create-session'
import { encryptPHI } from '@/lib/crypto/actions'
import { calculateSessionPricing, formatCurrency } from '@/lib/pricing'
import type { ServiceType, Client } from '@/types/database'

interface QuickLogDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickLogDrawer({ open, onOpenChange }: QuickLogDrawerProps) {
  const supabase = createClient()
  const { organization, settings, user } = useOrganization()
  const contractorId = user?.id || ''
  const { getOverrides } = useContractorRates(contractorId)

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [clients, setClients] = useState<Array<Pick<Client, 'id' | 'name' | 'payment_method'>>>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [clientNotes, setClientNotes] = useState('')

  // Load defaults from localStorage
  const storageKey = useMemo(() => {
    if (!organization?.id || !contractorId) return null
    return getSessionFormDefaultsStorageKey({ organizationId: organization.id, contractorId })
  }, [organization?.id, contractorId])

  const defaults = useMemo(() => {
    if (!storageKey) return null
    return loadSessionFormDefaults(storageKey)
  }, [storageKey])

  // Fetch service types and clients when drawer opens
  useEffect(() => {
    if (!open) return

    let cancelled = false
    async function load() {
      const [{ data: st }, { data: cl }] = await Promise.all([
        supabase.from('service_types').select('*').order('name'),
        supabase.from('clients').select('id, name, payment_method').order('name'),
      ])
      if (cancelled) return
      setServiceTypes((st as ServiceType[]) || [])
      setClients(cl || [])
      setDataLoading(false)
    }

    setDataLoading(true)
    load()
    return () => { cancelled = true }
  }, [open, supabase])

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().split('T')[0])
      setNotes('')
      setClientNotes('')
    }
  }, [open])

  // Resolve defaults to names
  const serviceType = serviceTypes.find(st => st.id === defaults?.serviceTypeId)
  const clientNames = (defaults?.selectedClientIds || [])
    .map(id => clients.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(', ')
  const hasValidDefaults = !!defaults && !!serviceType && clientNames.length > 0

  // Calculate pricing
  const selectedPaymentMethod = useMemo(() => {
    if (!defaults || defaults.selectedClientIds.length !== 1) return undefined
    return clients.find(c => c.id === defaults.selectedClientIds[0])?.payment_method
  }, [defaults, clients])

  const contractorOverrides = defaults?.serviceTypeId ? getOverrides(defaults.serviceTypeId) : undefined
  const pricing = serviceType && defaults
    ? calculateSessionPricing(
        serviceType,
        defaults.selectedClientIds.length || 1,
        parseInt(defaults.duration) || 30,
        contractorOverrides,
        { paymentMethod: selectedPaymentMethod }
      )
    : null

  const notesRequired = settings?.session?.require_notes !== false

  async function handleSubmit() {
    if (!defaults || !serviceType || !pricing || !organization) return

    if (notesRequired && !notes.trim()) {
      toast.error('Please add internal notes')
      return
    }
    if (notesRequired && !clientNotes.trim()) {
      toast.error('Please add client notes')
      return
    }

    setSubmitting(true)
    try {
      const encrypted = await encryptPHI({ notes, clientNotes })

      const effectiveStatus =
        settings?.automation?.auto_approve_sessions ? 'approved' : 'submitted'

      await createNewSession({
        supabase,
        date,
        time: defaults.time,
        durationMinutes: parseInt(defaults.duration) || 30,
        serviceTypeId: defaults.serviceTypeId,
        contractorId,
        organizationId: organization.id,
        clientIds: defaults.selectedClientIds,
        encryptedNotes: encrypted.notes,
        encryptedClientNotes: encrypted.clientNotes,
        status: effectiveStatus as 'submitted' | 'approved',
        groupHeadcount: null,
        pricing,
      })

      // Re-save defaults so they persist
      if (storageKey) {
        saveSessionFormDefaults(storageKey, {
          time: defaults.time,
          duration: defaults.duration,
          serviceTypeId: defaults.serviceTypeId,
          selectedClientIds: defaults.selectedClientIds,
        })
      }

      toast.success('Session logged!')
      onOpenChange(false)
    } catch {
      toast.error('Failed to log session')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Quick Log</DrawerTitle>
          <DrawerDescription>Log a session with your saved settings</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-4 overflow-y-auto">
          {dataLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : !hasValidDefaults ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-gray-500">
                Log your first session to enable quick logging.
              </p>
              <Link href="/sessions/new/" onClick={() => onOpenChange(false)}>
                <Button>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Full Form
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Session summary from defaults */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {serviceType?.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {clientNames}
                  {' \u00B7 '}
                  {defaults?.duration || 30} min
                  {' \u00B7 '}
                  {new Date(`2000-01-01T${defaults?.time || '09:00'}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
                {pricing && (
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Your Earnings: {formatCurrency(pricing.contractorPay)}
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="quick-date" className="flex items-center gap-2">
                  Date
                  {date === new Date().toISOString().split('T')[0] && (
                    <span className="text-xs font-normal text-green-600 dark:text-green-400">Today</span>
                  )}
                </Label>
                <Input
                  id="quick-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-base"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="quick-notes">Internal Notes {notesRequired && '*'}</Label>
                <Textarea
                  id="quick-notes"
                  placeholder="Internal notes (not visible to client)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-client-notes">Client Notes {notesRequired && '*'}</Label>
                <Textarea
                  id="quick-client-notes"
                  placeholder="Notes visible to client in their portal..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <DrawerFooter>
          {hasValidDefaults && !dataLoading && (
            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Session
            </Button>
          )}
          <Link href="/sessions/new/" onClick={() => onOpenChange(false)} className="w-full">
            <Button variant="outline" className="w-full">
              Full Form
            </Button>
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
