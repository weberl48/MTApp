'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHelp } from '@/components/help/page-help'
import { ServiceTypeForm } from '@/components/forms/service-type-form'
import { BillingTable } from '@/components/pricing/billing-table'
import { BusinessCutTable } from '@/components/pricing/business-cut-table'
import { PayScheduleGrid } from '@/components/pricing/pay-schedule-grid'
import { GroupPayGrid } from '@/components/pricing/group-pay-grid'
import { PoliciesForm } from '@/components/pricing/policies-form'
import { Simulator } from '@/components/pricing/simulator'
import { PayRateMatrix } from '@/components/team/pay-rate-matrix'
import { useOrganization } from '@/contexts/organization-context'
import { useWalkthrough } from '@/components/walkthroughs/walkthrough-provider'
import { isGroupService } from '@/lib/pricing/simulate'
import { resolveDurationOptions } from '@/lib/settings/input'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ServiceType } from '@/types/database'

interface ContractorRate {
  contractor_pay: number
  duration_increment: number | null
}

export default function PricingHubPage() {
  const { organization, can, settings } = useOrganization()
  const { activeWalkthrough, stepIndex } = useWalkthrough()
  const searchParams = useSearchParams()
  const canEdit = can('settings:edit')
  const { dialogProps: confirmDialogProps, confirm: openConfirm } = useConfirmDialog()

  const [loadingData, setLoadingData] = useState(true)
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [contractors, setContractors] = useState<{ id: string; name: string | null }[]>([])
  const [rates, setRates] = useState<Map<string, ContractorRate>>(new Map())

  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null)
  const [isServiceTypeFormOpen, setIsServiceTypeFormOpen] = useState(false)

  // Hold the service type form open for the walkthrough that tours its fields. Re-asserted
  // while the tour is live rather than once per mount: dismissing the dialog used to be
  // unrecoverable — the tour kept advancing through steps whose fields no longer existed.
  // Moved here verbatim from settings/business/page.tsx, retargeted to this page.
  const editServiceTourActive = activeWalkthrough?.id === 'edit-service-type'
  useEffect(() => {
    if (!editServiceTourActive) return
    if (searchParams.get('tour') !== 'edit-service') return
    if (serviceTypes.length === 0) return
    setEditingServiceType((current) => current ?? serviceTypes[0])
    setIsServiceTypeFormOpen(true)
  }, [editServiceTourActive, stepIndex, isServiceTypeFormOpen, searchParams, serviceTypes])

  const refreshServiceTypes = useCallback(async () => {
    if (!organization) return
    const supabase = createClient()
    const { data } = await supabase
      .from('service_types')
      .select('*')
      .eq('organization_id', organization.id)
      .order('display_order', { ascending: true })
    setServiceTypes((data as ServiceType[]) || [])
  }, [organization])

  useEffect(() => {
    if (!organization || !canEdit) return
    let cancelled = false

    async function loadAll() {
      setLoadingData(true)
      const supabase = createClient()
      const [{ data: types }, { data: users }, { data: contractorRates }] = await Promise.all([
        supabase
          .from('service_types')
          .select('*')
          .eq('organization_id', organization!.id)
          .order('display_order', { ascending: true }),
        supabase
          .from('users')
          .select('id, name')
          .eq('organization_id', organization!.id)
          .eq('role', 'contractor')
          .order('name'),
        supabase
          .from('contractor_rates')
          .select('id, contractor_id, service_type_id, contractor_pay, duration_increment'),
      ])

      if (cancelled) return

      setServiceTypes((types as ServiceType[]) || [])
      setContractors(users || [])

      const ratesMap = new Map<string, ContractorRate>()
      for (const r of contractorRates || []) {
        ratesMap.set(`${r.contractor_id}:${r.service_type_id}`, {
          contractor_pay: r.contractor_pay,
          duration_increment: r.duration_increment,
        })
      }
      setRates(ratesMap)
      setLoadingData(false)
    }

    loadAll()
    return () => {
      cancelled = true
    }
  }, [organization, canEdit])

  const onUpdate = useCallback(async (id: string, patch: Partial<ServiceType>) => {
    const supabase = createClient()
    let previous: ServiceType[] = []
    setServiceTypes((cur) => {
      previous = cur
      return cur.map((st) => (st.id === id ? { ...st, ...patch } : st))
    })

    const { error } = await supabase.from('service_types').update(patch).eq('id', id)
    if (error) {
      setServiceTypes(previous)
      toast.error('Failed to save')
    } else {
      toast.success('Saved')
    }
  }, [])

  const onScheduleUpdate = useCallback(
    (id: string, schedule: Record<string, number> | null) =>
      onUpdate(id, { contractor_pay_schedule: schedule }),
    [onUpdate]
  )

  const onGroupUpdate = useCallback(
    (id: string, matrix: Record<string, number> | null) => onUpdate(id, { group_contractor_pay: matrix }),
    [onUpdate]
  )

  function handleAdd() {
    setEditingServiceType(null)
    setIsServiceTypeFormOpen(true)
  }

  function handleEdit(st: ServiceType) {
    setEditingServiceType(st)
    setIsServiceTypeFormOpen(true)
  }

  function handleDelete(serviceType: ServiceType) {
    openConfirm({
      title: 'Delete Service Type',
      description: `Are you sure you want to delete "${serviceType.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        const supabase = createClient()
        try {
          const { error } = await supabase.from('service_types').delete().eq('id', serviceType.id)
          if (error) throw error
          toast.success('Service type deleted')
          refreshServiceTypes()
        } catch {
          toast.error('Failed to delete service type. It may be in use by existing sessions.')
        }
      },
    })
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        You do not have permission to manage pricing.
      </div>
    )
  }

  const durations = resolveDurationOptions(settings?.session?.duration_options)
  const groupServices = serviceTypes.filter(isGroupService)
  const activeServiceTypes = serviceTypes.filter((st) => st.is_active)
  const durationBase = settings?.pricing?.duration_base_minutes ?? 30
  const nextDisplayOrder = serviceTypes.length
    ? Math.max(...serviceTypes.map((st) => st.display_order)) + 1
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/">
          <Button variant="ghost" size="icon" aria-label="Back to settings">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold text-foreground">Pricing</h1>
            <PageHelp article="pricing-hub" />
          </div>
          <p className="text-muted-foreground">How a session price becomes contractor pay and business margin</p>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Rate changes affect new sessions only.{' '}
        <Link href="/sessions/" className="font-medium text-foreground underline">
          Re-price existing sessions →
        </Link>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
          <div className="space-y-6 min-w-0">
            <BillingTable
              serviceTypes={serviceTypes}
              canEdit={canEdit}
              onUpdate={onUpdate}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            <Card data-tour="pay-rate-matrix-section">
              <CardHeader>
                <CardTitle>2 · What the contractor earns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <PayScheduleGrid
                  serviceTypes={serviceTypes}
                  durations={durations}
                  canEdit={canEdit}
                  onUpdate={onScheduleUpdate}
                />
                {groupServices.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Group pay matrices</h4>
                    {groupServices.map((st) => (
                      <GroupPayGrid
                        key={st.id}
                        serviceType={st}
                        durations={durations}
                        canEdit={canEdit}
                        onUpdate={onGroupUpdate}
                      />
                    ))}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium mb-2">Per-contractor overrides</h3>
                  <PayRateMatrix organizationId={organization.id} canEdit={true} />
                </div>
              </CardContent>
            </Card>

            <BusinessCutTable
              serviceTypes={serviceTypes}
              canEdit={canEdit}
              onUpdate={onUpdate}
              durationBase={durationBase}
            />

            <PoliciesForm />
          </div>

          {/* order-first on mobile so the calculator is reachable without scrolling
              past every table; lg:order-none restores normal (second column) order
              on desktop, where it's pinned via lg:sticky instead. */}
          <div className="order-first lg:order-none lg:sticky lg:top-4">
            <Simulator serviceTypes={activeServiceTypes} contractors={contractors} rates={rates} />
          </div>
        </div>
      )}

      <ServiceTypeForm
        key={editingServiceType?.id || 'new'}
        serviceType={editingServiceType}
        isOpen={isServiceTypeFormOpen}
        onClose={() => setIsServiceTypeFormOpen(false)}
        onSaved={refreshServiceTypes}
        nextDisplayOrder={nextDisplayOrder}
      />

      <ConfirmDialog {...confirmDialogProps} />
    </div>
  )
}
