'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, calculateSessionPricing } from '@/lib/pricing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Check, X, Pencil, RotateCcw, Users } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { ServiceType } from '@/types/database'
import { useOrganization } from '@/contexts/organization-context'

interface PayRateMatrixProps {
  organizationId: string
  canEdit: boolean
}

interface Contractor {
  id: string
  name: string | null
  email: string
  pay_increase: number
}

interface RateEntry {
  id: string
  contractor_id: string
  service_type_id: string
  contractor_pay: number
}

type EditingCell = { contractorId: string; serviceTypeId: string } | null

export function PayRateMatrix({ organizationId, canEdit }: PayRateMatrixProps) {
  const { organization } = useOrganization()
  const durationOptions = organization?.settings?.session?.duration_options || [30, 45, 60, 90]
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [rates, setRates] = useState<Map<string, RateEntry>>(new Map())
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editValue, setEditValue] = useState('')
  const [setAllColumn, setSetAllColumn] = useState<string | null>(null)
  const [setAllValue, setSetAllValue] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(30)
  const [editingBonusId, setEditingBonusId] = useState<string | null>(null)
  const [bonusValue, setBonusValue] = useState('')

  // Composite key for the rates map
  const rateKey = (contractorId: string, serviceTypeId: string) =>
    `${contractorId}:${serviceTypeId}`

  // Initial data load
  useEffect(() => {
    let cancelled = false

    async function init() {
      const supabase = createClient()

      const [
        { data: contractorsData },
        { data: serviceTypesData },
        { data: ratesData },
      ] = await Promise.all([
        supabase
          .from('users')
          .select('id, name, email, pay_increase')
          .eq('organization_id', organizationId)
          .eq('role', 'contractor')
          .order('name'),
        supabase
          .from('service_types')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('contractor_rates')
          .select('id, contractor_id, service_type_id, contractor_pay'),
      ])

      if (cancelled) return

      setContractors(contractorsData || [])
      setServiceTypes((serviceTypesData as ServiceType[]) || [])

      const ratesMap = new Map<string, RateEntry>()
      for (const rate of ratesData || []) {
        ratesMap.set(rateKey(rate.contractor_id, rate.service_type_id), rate)
      }
      setRates(ratesMap)
      setLoading(false)
    }

    init()
    return () => { cancelled = true }
  }, [organizationId])

  function getDefaultPay(serviceType: ServiceType): number {
    const pricing = calculateSessionPricing(serviceType, 1, 30)
    return pricing.contractorPay
  }

  /** Get the contractor pay for a given duration, including custom rate + bonus */
  function getPayForDuration(
    serviceType: ServiceType,
    contractorId: string,
    duration: number
  ): number {
    const key = rateKey(contractorId, serviceType.id)
    const rateEntry = rates.get(key)
    const contractor = contractors.find((c) => c.id === contractorId)
    const bonus = contractor?.pay_increase || 0

    const overrides = rateEntry
      ? { customContractorPay: rateEntry.contractor_pay, payIncrease: bonus }
      : bonus > 0
        ? { payIncrease: bonus }
        : undefined

    const pricing = calculateSessionPricing(serviceType, 1, duration, overrides)
    return pricing.contractorPay
  }

  async function saveBonus(contractorId: string) {
    const value = parseFloat(bonusValue)
    if (isNaN(value) || value < 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('users')
      .update({ pay_increase: value, updated_at: new Date().toISOString() })
      .eq('id', contractorId)

    if (error) {
      toast.error('Failed to update bonus')
    } else {
      setContractors((prev) =>
        prev.map((c) => (c.id === contractorId ? { ...c, pay_increase: value } : c))
      )
      toast.success('Bonus updated')
    }

    setSaving(false)
    setEditingBonusId(null)
    setBonusValue('')
  }

  function startEditing(contractorId: string, serviceTypeId: string) {
    const key = rateKey(contractorId, serviceTypeId)
    const existing = rates.get(key)
    const defaultPay = getDefaultPay(
      serviceTypes.find((s) => s.id === serviceTypeId)!
    )
    setEditingCell({ contractorId, serviceTypeId })
    setEditValue((existing?.contractor_pay ?? defaultPay).toString())
  }

  function cancelEditing() {
    setEditingCell(null)
    setEditValue('')
  }

  async function saveRate(contractorId: string, serviceTypeId: string) {
    const value = parseFloat(editValue)
    if (isNaN(value) || value < 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const key = rateKey(contractorId, serviceTypeId)
    const existing = rates.get(key)

    if (existing) {
      const { error } = await supabase
        .from('contractor_rates')
        .update({
          contractor_pay: value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) {
        toast.error('Failed to update rate')
      } else {
        const updated = new Map(rates)
        updated.set(key, { ...existing, contractor_pay: value })
        setRates(updated)
        toast.success('Rate updated')
      }
    } else {
      const { data, error } = await supabase
        .from('contractor_rates')
        .insert({
          contractor_id: contractorId,
          service_type_id: serviceTypeId,
          contractor_pay: value,
        })
        .select()
        .single()

      if (error) {
        toast.error('Failed to create rate')
      } else {
        const updated = new Map(rates)
        updated.set(key, data)
        setRates(updated)
        toast.success('Rate created')
      }
    }

    setSaving(false)
    cancelEditing()
  }

  async function removeRate(contractorId: string, serviceTypeId: string) {
    const key = rateKey(contractorId, serviceTypeId)
    const existing = rates.get(key)
    if (!existing) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('contractor_rates')
      .delete()
      .eq('id', existing.id)

    if (error) {
      toast.error('Failed to remove rate')
    } else {
      const updated = new Map(rates)
      updated.delete(key)
      setRates(updated)
      toast.success('Reset to default')
    }

    setSaving(false)
  }

  async function setAllForServiceType(serviceTypeId: string) {
    const value = parseFloat(setAllValue)
    if (isNaN(value) || value < 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const updated = new Map(rates)
    let errorCount = 0

    for (const contractor of contractors) {
      const key = rateKey(contractor.id, serviceTypeId)
      const existing = rates.get(key)

      if (existing) {
        const { error } = await supabase
          .from('contractor_rates')
          .update({
            contractor_pay: value,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (error) {
          errorCount++
        } else {
          updated.set(key, { ...existing, contractor_pay: value })
        }
      } else {
        const { data, error } = await supabase
          .from('contractor_rates')
          .insert({
            contractor_id: contractor.id,
            service_type_id: serviceTypeId,
            contractor_pay: value,
          })
          .select()
          .single()

        if (error) {
          errorCount++
        } else if (data) {
          updated.set(key, data)
        }
      }
    }

    setRates(updated)
    setSaving(false)
    setSetAllColumn(null)
    setSetAllValue('')

    if (errorCount > 0) {
      toast.error(`Failed to update ${errorCount} rate(s)`)
    } else {
      toast.success(`Set all contractors to ${formatCurrency(value)}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (contractors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No contractors found
      </div>
    )
  }

  if (serviceTypes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No active service types found. Add service types in Settings first.
      </div>
    )
  }

  const isBaseDuration = selectedDuration === 30

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isBaseDuration
            ? 'Custom pay rates per contractor per service type. Click to edit.'
            : `Pay preview at ${selectedDuration} min (read-only). Edit rates on the 30 min tab.`}
        </p>
        <Tabs
          value={String(selectedDuration)}
          onValueChange={(v) => {
            setSelectedDuration(Number(v))
            cancelEditing()
          }}
        >
          <TabsList className="h-8">
            {durationOptions.map((dur) => (
              <TabsTrigger key={dur} value={String(dur)} className="text-xs px-2 h-6">
                {dur} min
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-white dark:bg-gray-950 z-10 min-w-[140px]">
                Contractor
              </TableHead>
              <TableHead className="text-center min-w-[80px]">
                <div className="text-xs font-medium">Bonus</div>
                <div className="text-[10px] text-gray-400 font-normal">per session</div>
              </TableHead>
              {serviceTypes.map((st) => {
                const defaultPayAtDuration = calculateSessionPricing(st, 1, selectedDuration).contractorPay
                return (
                <TableHead key={st.id} className="text-center min-w-[120px]">
                  <div className="text-xs font-medium">{st.name}</div>
                  <div className="text-[10px] text-gray-400 font-normal">
                    default: {formatCurrency(defaultPayAtDuration)}
                  </div>
                  {canEdit && isBaseDuration && contractors.length > 1 && (
                    <Popover
                      open={setAllColumn === st.id}
                      onOpenChange={(open) => {
                        if (open) {
                          setSetAllColumn(st.id)
                          setSetAllValue(getDefaultPay(st).toString())
                        } else {
                          setSetAllColumn(null)
                          setSetAllValue('')
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1.5 text-[10px] font-normal text-gray-400 hover:text-gray-600"
                        >
                          <Users className="w-3 h-3 mr-0.5" />
                          Set all
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-3" align="center">
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">
                            Set rate for all {contractors.length} contractors
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">$</span>
                            <Input
                              type="number"
                              step="0.50"
                              min="0"
                              value={setAllValue}
                              onChange={(e) => setSetAllValue(e.target.value)}
                              className="h-8 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setAllForServiceType(st.id)
                                if (e.key === 'Escape') setSetAllColumn(null)
                              }}
                            />
                          </div>
                          <Button
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => setAllForServiceType(st.id)}
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : null}
                            Apply to all
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {contractors.map((contractor) => (
              <TableRow key={contractor.id}>
                <TableCell className="sticky left-0 bg-white dark:bg-gray-950 z-10">
                  <Link
                    href={`/team/${contractor.id}`}
                    className="hover:underline"
                  >
                    <div className="font-medium text-sm">
                      {contractor.name || 'Unnamed'}
                    </div>
                  </Link>
                </TableCell>

                {/* Bonus cell */}
                <TableCell className="text-center p-1">
                  {editingBonusId === contractor.id ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs">$</span>
                        <Input
                          type="number"
                          step="0.50"
                          min="0"
                          value={bonusValue}
                          onChange={(e) => setBonusValue(e.target.value)}
                          className="w-16 h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveBonus(contractor.id)
                            if (e.key === 'Escape') {
                              setEditingBonusId(null)
                              setBonusValue('')
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => saveBonus(contractor.id)}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3 text-green-600" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditingBonusId(null)
                            setBonusValue('')
                          }}
                          disabled={saving}
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-0.5 group">
                      <span className={`text-sm font-medium ${contractor.pay_increase > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        {contractor.pay_increase > 0
                          ? `+${formatCurrency(contractor.pay_increase)}`
                          : '$0'}
                      </span>
                      {canEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setEditingBonusId(contractor.id)
                            setBonusValue(contractor.pay_increase.toString())
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>

                {serviceTypes.map((st) => {
                  const key = rateKey(contractor.id, st.id)
                  const rateEntry = rates.get(key)
                  const isEditing =
                    editingCell?.contractorId === contractor.id &&
                    editingCell?.serviceTypeId === st.id

                  const payAtDuration = getPayForDuration(st, contractor.id, selectedDuration)

                  return (
                    <TableCell key={st.id} className="text-center p-1">
                      {isBaseDuration && isEditing ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs">$</span>
                            <Input
                              type="number"
                              step="0.50"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20 h-8 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter')
                                  saveRate(contractor.id, st.id)
                                if (e.key === 'Escape') cancelEditing()
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() =>
                                saveRate(contractor.id, st.id)
                              }
                              disabled={saving}
                            >
                              {saving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3 text-green-600" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={cancelEditing}
                              disabled={saving}
                            >
                              <X className="w-3 h-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ) : isBaseDuration ? (
                        <div className="flex items-center justify-center gap-0.5 group">
                          {rateEntry ? (
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              {formatCurrency(payAtDuration)}
                            </span>
                          ) : (
                            <span className="text-sm text-amber-500 dark:text-amber-400">
                              default
                            </span>
                          )}
                          {canEdit && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  startEditing(contractor.id, st.id)
                                }
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              {rateEntry && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    removeRate(contractor.id, st.id)
                                  }
                                  disabled={saving}
                                  title="Reset to default"
                                >
                                  <RotateCcw className="w-3 h-3 text-gray-400" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Non-base duration: read-only preview */
                        <span className="text-sm font-medium">
                          {formatCurrency(payAtDuration)}
                        </span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
