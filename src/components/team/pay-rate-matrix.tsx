'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { Loader2, Check, X, Pencil, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { ServiceType } from '@/types/database'

interface PayRateMatrixProps {
  organizationId: string
  canEdit: boolean
}

interface Contractor {
  id: string
  name: string | null
  email: string
}

interface RateEntry {
  id: string
  contractor_id: string
  service_type_id: string
  contractor_pay: number
}

type EditingCell = { contractorId: string; serviceTypeId: string } | null

export function PayRateMatrix({ organizationId, canEdit }: PayRateMatrixProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [rates, setRates] = useState<Map<string, RateEntry>>(new Map())
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editValue, setEditValue] = useState('')

  // Composite key for the rates map
  const rateKey = (contractorId: string, serviceTypeId: string) =>
    `${contractorId}:${serviceTypeId}`

  const loadData = useCallback(async () => {
    const supabase = createClient()

    const [
      { data: contractorsData },
      { data: serviceTypesData },
      { data: ratesData },
    ] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, email')
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

    setContractors(contractorsData || [])
    setServiceTypes((serviceTypesData as ServiceType[]) || [])

    const ratesMap = new Map<string, RateEntry>()
    for (const rate of ratesData || []) {
      ratesMap.set(rateKey(rate.contractor_id, rate.service_type_id), rate)
    }
    setRates(ratesMap)
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    loadData()
  }, [loadData])

  function getDefaultPay(serviceType: ServiceType): number {
    const pricing = calculateSessionPricing(serviceType, 1, 30)
    return pricing.contractorPay
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
    const value = parseFloat(editValue)
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
    cancelEditing()

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

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Custom pay rates per contractor per service type (30-min base). Rates scale with session duration.
      </p>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-white dark:bg-gray-950 z-10 min-w-[140px]">
                Contractor
              </TableHead>
              {serviceTypes.map((st) => (
                <TableHead key={st.id} className="text-center min-w-[120px]">
                  <div className="text-xs font-medium">{st.name}</div>
                  <div className="text-[10px] text-gray-400 font-normal">
                    default: {formatCurrency(getDefaultPay(st))}
                  </div>
                </TableHead>
              ))}
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

                {serviceTypes.map((st) => {
                  const key = rateKey(contractor.id, st.id)
                  const rateEntry = rates.get(key)
                  const isEditing =
                    editingCell?.contractorId === contractor.id &&
                    editingCell?.serviceTypeId === st.id

                  return (
                    <TableCell key={st.id} className="text-center p-1">
                      {isEditing ? (
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
                            {canEdit && contractors.length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-1.5 text-[10px]"
                                onClick={() => setAllForServiceType(st.id)}
                                disabled={saving}
                                title="Set this rate for all contractors"
                              >
                                Set all
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-0.5 group">
                          {rateEntry ? (
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              {formatCurrency(rateEntry.contractor_pay)}
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
