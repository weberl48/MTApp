'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, calculateSessionPricing } from '@/lib/pricing'
import { Loader2, DollarSign, Pencil, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { ServiceType } from '@/types/database'

interface ContractorRatesFormProps {
  contractorId: string
  contractorName: string
  organizationId: string
  currentPayIncrease: number
  onPayIncreaseUpdate?: (newValue: number) => void
}

interface ContractorRate {
  id: string
  service_type_id: string
  contractor_pay: number
}

export function ContractorRatesForm({
  contractorId,
  contractorName,
  organizationId,
  currentPayIncrease,
  onPayIncreaseUpdate,
}: ContractorRatesFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [contractorRates, setContractorRates] = useState<Map<string, ContractorRate>>(new Map())
  const [payIncrease, setPayIncrease] = useState(currentPayIncrease.toString())
  const [editingPayIncrease, setEditingPayIncrease] = useState(false)
  const [editingRateId, setEditingRateId] = useState<string | null>(null)
  const [editingRateValue, setEditingRateValue] = useState('')

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      // Fetch service types
      const { data: servicesData } = await supabase
        .from('service_types')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      setServiceTypes(servicesData || [])

      // Fetch existing contractor rates
      const { data: ratesData } = await supabase
        .from('contractor_rates')
        .select('*')
        .eq('contractor_id', contractorId)

      const ratesMap = new Map<string, ContractorRate>()
      for (const rate of ratesData || []) {
        ratesMap.set(rate.service_type_id, rate)
      }
      setContractorRates(ratesMap)

      setLoading(false)
    }

    loadData()
  }, [contractorId, organizationId])

  async function handleSavePayIncrease() {
    setSaving(true)
    const supabase = createClient()
    const newValue = parseFloat(payIncrease) || 0

    const { error } = await supabase
      .from('users')
      .update({ pay_increase: newValue, updated_at: new Date().toISOString() })
      .eq('id', contractorId)

    if (error) {
      toast.error('Failed to update pay increase')
    } else {
      toast.success('Pay increase updated')
      onPayIncreaseUpdate?.(newValue)
    }

    setSaving(false)
    setEditingPayIncrease(false)
  }

  async function handleSaveCustomRate(serviceTypeId: string) {
    const customPay = parseFloat(editingRateValue)
    if (isNaN(customPay) || customPay < 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const existingRate = contractorRates.get(serviceTypeId)

    if (existingRate) {
      // Update existing rate
      const { error } = await supabase
        .from('contractor_rates')
        .update({ contractor_pay: customPay, updated_at: new Date().toISOString() })
        .eq('id', existingRate.id)

      if (error) {
        toast.error('Failed to update rate')
      } else {
        const updated = new Map(contractorRates)
        updated.set(serviceTypeId, { ...existingRate, contractor_pay: customPay })
        setContractorRates(updated)
        toast.success('Rate updated')
      }
    } else {
      // Create new rate
      const { data, error } = await supabase
        .from('contractor_rates')
        .insert({
          contractor_id: contractorId,
          service_type_id: serviceTypeId,
          contractor_pay: customPay,
        })
        .select()
        .single()

      if (error) {
        toast.error('Failed to create custom rate')
      } else {
        const updated = new Map(contractorRates)
        updated.set(serviceTypeId, data)
        setContractorRates(updated)
        toast.success('Custom rate created')
      }
    }

    setSaving(false)
    setEditingRateId(null)
    setEditingRateValue('')
  }

  async function handleRemoveCustomRate(serviceTypeId: string) {
    const existingRate = contractorRates.get(serviceTypeId)
    if (!existingRate) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('contractor_rates')
      .delete()
      .eq('id', existingRate.id)

    if (error) {
      toast.error('Failed to remove custom rate')
    } else {
      const updated = new Map(contractorRates)
      updated.delete(serviceTypeId)
      setContractorRates(updated)
      toast.success('Custom rate removed, using default')
    }

    setSaving(false)
  }

  function startEditingRate(serviceTypeId: string, currentValue: number) {
    setEditingRateId(serviceTypeId)
    setEditingRateValue(currentValue.toString())
  }

  function getDefaultContractorPay(serviceType: ServiceType): number {
    // Calculate default pay for 1 attendee, 30 min
    const pricing = calculateSessionPricing(serviceType, 1, 30)
    return pricing.contractorPay
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pay Increase Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pay Increase Bonus
          </CardTitle>
          <CardDescription>
            Additional amount added to each session for this contractor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label className="text-sm text-gray-600">Per-session bonus:</Label>
            {editingPayIncrease ? (
              <div className="flex items-center gap-2">
                <span className="text-lg">$</span>
                <Input
                  type="number"
                  step="0.50"
                  min="0"
                  value={payIncrease}
                  onChange={(e) => setPayIncrease(e.target.value)}
                  className="w-24"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSavePayIncrease}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-600" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingPayIncrease(false)
                    setPayIncrease(currentPayIncrease.toString())
                  }}
                  disabled={saving}
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  +{formatCurrency(parseFloat(payIncrease) || 0)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingPayIncrease(true)}
                  className="h-8 w-8"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            This bonus is added on top of the calculated contractor pay for each session.
          </p>
        </CardContent>
      </Card>

      {/* Custom Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Type Rates</CardTitle>
          <CardDescription>
            Set custom pay rates for {contractorName} per service type. A rate is required for each active service type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Type</TableHead>
                <TableHead className="text-right">Default Pay (30 min)</TableHead>
                <TableHead className="text-right">Custom Pay</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceTypes.map((serviceType) => {
                const customRate = contractorRates.get(serviceType.id)
                const defaultPay = getDefaultContractorPay(serviceType)
                const isEditing = editingRateId === serviceType.id

                return (
                  <TableRow key={serviceType.id} className={!customRate ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                    <TableCell className="font-medium">
                      {serviceType.name}
                      {!customRate && (
                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-normal">Rate required</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-gray-500">
                      {formatCurrency(defaultPay)}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <span>$</span>
                          <Input
                            type="number"
                            step="0.50"
                            min="0"
                            value={editingRateValue}
                            onChange={(e) => setEditingRateValue(e.target.value)}
                            className="w-24"
                          />
                        </div>
                      ) : customRate ? (
                        <span className="font-bold text-green-600">
                          {formatCurrency(customRate.contractor_pay)}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSaveCustomRate(serviceType.id)}
                            disabled={saving}
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-600" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingRateId(null)
                              setEditingRateValue('')
                            }}
                            disabled={saving}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditingRate(serviceType.id, customRate?.contractor_pay || defaultPay)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {customRate && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveCustomRate(serviceType.id)}
                              disabled={saving}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
