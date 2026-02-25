'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createAdminWork, updateAdminWork } from '@/app/actions/admin-work'
import { useOrganization } from '@/contexts/organization-context'
import { calculateSessionPricing, formatCurrency } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'
import type { AdminWork, ServiceType } from '@/types/database'
import type { ContractorPricingOverrides } from '@/lib/pricing'

interface AdminWorkFormProps {
  admins: Array<{ id: string; name: string }>
  adminServiceType: ServiceType | null
  existingEntry?: AdminWork
  onSuccess: () => void
  onCancel: () => void
}

export function AdminWorkForm({ admins, adminServiceType, existingEntry, onSuccess, onCancel }: AdminWorkFormProps) {
  const { organization } = useOrganization()
  const settings = organization?.settings

  const [adminUserId, setAdminUserId] = useState(existingEntry?.admin_user_id ?? '')
  const [date, setDate] = useState(existingEntry?.date ?? new Date().toISOString().split('T')[0])
  const [durationMinutes, setDurationMinutes] = useState(String(existingEntry?.duration_minutes ?? 30))
  const [description, setDescription] = useState(existingEntry?.description ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contractorOverrides, setContractorOverrides] = useState<ContractorPricingOverrides | undefined>()

  const durationOptions = settings?.session?.duration_options ?? [30, 45, 60, 90]
  const durationBase = settings?.pricing?.duration_base_minutes ?? 30

  // Fetch contractor rates when admin user changes
  const loadContractorRates = useCallback(async (userId: string) => {
    if (!adminServiceType || !userId) {
      setContractorOverrides(undefined)
      return
    }

    const supabase = createClient()
    const { data: rates } = await supabase
      .from('contractor_rates')
      .select('contractor_pay, duration_increment')
      .eq('contractor_id', userId)
      .eq('service_type_id', adminServiceType.id)
      .single()

    if (rates) {
      setContractorOverrides({
        customContractorPay: rates.contractor_pay,
        durationIncrement: rates.duration_increment,
      })
    } else {
      setContractorOverrides(undefined)
    }
  }, [adminServiceType])

  useEffect(() => {
    if (adminUserId) {
      void loadContractorRates(adminUserId)
    }
  }, [adminUserId, loadContractorRates])

  // Calculate pay from service type + contractor rates
  const calculatedPay = adminServiceType && adminUserId
    ? calculateSessionPricing(
        adminServiceType,
        1,
        parseInt(durationMinutes),
        contractorOverrides,
        { durationBaseMinutes: durationBase }
      ).contractorPay
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!adminUserId) {
      toast.error('Please select an admin')
      return
    }
    if (!description.trim()) {
      toast.error('Please enter a description')
      return
    }
    if (!calculatedPay || calculatedPay <= 0) {
      toast.error('Unable to calculate pay — check that this admin has a rate configured')
      return
    }

    setIsSubmitting(true)

    try {
      const data = {
        admin_user_id: adminUserId,
        date,
        duration_minutes: parseInt(durationMinutes),
        description: description.trim(),
        pay_amount: calculatedPay,
      }

      const result = existingEntry
        ? await updateAdminWork(existingEntry.id, data)
        : await createAdminWork(data)

      if (result.success) {
        toast.success(existingEntry ? 'Admin work updated' : 'Admin work created')
        onSuccess()
      } else {
        toast.error(result.error || 'Something went wrong')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="adminUser">Admin *</Label>
        <Select value={adminUserId} onValueChange={setAdminUserId}>
          <SelectTrigger id="adminUser">
            <SelectValue placeholder="Select admin" />
          </SelectTrigger>
          <SelectContent>
            {admins.map((admin) => (
              <SelectItem key={admin.id} value={admin.id}>
                {admin.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          <Label htmlFor="duration">Duration *</Label>
          <Select value={durationMinutes} onValueChange={setDurationMinutes}>
            <SelectTrigger id="duration">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map((mins) => (
                <SelectItem key={mins} value={String(mins)}>
                  {mins} minutes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What admin work was performed?"
          rows={3}
          required
        />
      </div>

      {adminUserId && (
        <div className="flex items-center justify-between py-3 px-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pay Amount</span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {calculatedPay != null ? formatCurrency(calculatedPay) : '—'}
          </span>
        </div>
      )}
      {adminUserId && calculatedPay == null && adminServiceType && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          No rate configured for this admin. Check their contractor rates in Settings.
        </p>
      )}
      {adminUserId && !adminServiceType && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          No admin work service type found. Create a service type with &quot;Requires Client&quot; turned off.
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {existingEntry ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            existingEntry ? 'Update' : 'Create'
          )}
        </Button>
      </div>
    </form>
  )
}
