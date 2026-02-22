'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { ServiceType, ServiceCategory, LocationType } from '@/types/database'
import { useOrganization } from '@/contexts/organization-context'
import { calculateSessionPricing, formatCurrency } from '@/lib/pricing'

interface ServiceTypeFormProps {
  serviceType?: ServiceType | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

const SERVICE_CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'music_individual', label: 'Music - Individual' },
  { value: 'music_group', label: 'Music - Group' },
  { value: 'art_individual', label: 'Art - Individual' },
  { value: 'art_group', label: 'Art - Group' },
]

const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: 'in_home', label: 'In-Home' },
  { value: 'matts_music', label: "Matt's Music" },
  { value: 'other', label: 'Other' },
]

export function ServiceTypeForm({ serviceType, isOpen, onClose, onSaved }: ServiceTypeFormProps) {
  const { organization } = useOrganization()
  const [loading, setLoading] = useState(false)
  const durationOptions = organization?.settings?.session?.duration_options || [30, 45, 60, 90]

  // Initialize pay schedule from existing data, or empty strings for all durations
  const initPaySchedule = (): Record<string, string> => {
    const schedule: Record<string, string> = {}
    for (const dur of durationOptions) {
      const existing = serviceType?.contractor_pay_schedule?.[String(dur)]
      schedule[String(dur)] = existing !== undefined ? String(existing) : ''
    }
    return schedule
  }

  const [formData, setFormData] = useState({
    name: serviceType?.name || '',
    category: serviceType?.category || ('music_individual' as ServiceCategory),
    location: serviceType?.location || ('in_home' as LocationType),
    base_rate: serviceType?.base_rate?.toString() || '',
    per_person_rate: serviceType?.per_person_rate?.toString() || '0',
    mca_percentage: serviceType?.mca_percentage?.toString() || '0',
    contractor_cap: serviceType?.contractor_cap?.toString() || '',
    total_cap: serviceType?.total_cap?.toString() || '',
    rent_percentage: serviceType?.rent_percentage?.toString() || '0',
    scholarship_rate: serviceType?.scholarship_rate?.toString() || '',
    is_active: serviceType?.is_active ?? true,
    is_scholarship: serviceType?.is_scholarship ?? false,
    requires_client: serviceType?.requires_client ?? true,
    allowed_contractor_ids: serviceType?.allowed_contractor_ids || ([] as string[]),
    pay_schedule: initPaySchedule(),
  })

  // Fetch contractors for restriction selector
  const [contractors, setContractors] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    if (!isOpen) return
    const supabase = createClient()
    supabase
      .from('users')
      .select('id, name')
      .in('role', ['contractor', 'admin', 'owner'])
      .order('name')
      .then(({ data }) => setContractors(data || []))
  }, [isOpen])

  const isEditing = !!serviceType

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    // Build contractor_pay_schedule from form values (only include filled-in durations)
    const paySchedule: Record<string, number> = {}
    let hasAnyScheduleValue = false
    for (const [dur, val] of Object.entries(formData.pay_schedule)) {
      const parsed = parseFloat(val)
      if (!isNaN(parsed) && parsed > 0) {
        paySchedule[dur] = parsed
        hasAnyScheduleValue = true
      }
    }

    const data = {
      name: formData.name,
      category: formData.category,
      location: formData.location,
      base_rate: parseFloat(formData.base_rate),
      per_person_rate: parseFloat(formData.per_person_rate) || 0,
      mca_percentage: parseFloat(formData.mca_percentage),
      contractor_cap: formData.contractor_cap ? parseFloat(formData.contractor_cap) : null,
      total_cap: formData.total_cap ? parseFloat(formData.total_cap) : null,
      rent_percentage: parseFloat(formData.rent_percentage) || 0,
      scholarship_rate: formData.scholarship_rate ? parseFloat(formData.scholarship_rate) : null,
      is_active: formData.is_active,
      is_scholarship: formData.is_scholarship,
      requires_client: formData.requires_client,
      allowed_contractor_ids: formData.allowed_contractor_ids.length > 0 ? formData.allowed_contractor_ids : null,
      contractor_pay_schedule: hasAnyScheduleValue ? paySchedule : null,
    }

    try {
      if (isEditing && serviceType) {
        const { error } = await supabase
          .from('service_types')
          .update(data)
          .eq('id', serviceType.id)

        if (error) throw error
        toast.success('Service type updated')
      } else {
        const { error } = await supabase.from('service_types').insert({
          ...data,
          organization_id: organization!.id,
        })

        if (error) throw error
        toast.success('Service type created')
      }

      onSaved()
      onClose()
    } catch (error) {
      console.error('[MCA] Error saving service type')
      toast.error('Failed to save service type')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Service Type' : 'Add Service Type'}</DialogTitle>
          <DialogDescription>
            Configure pricing rules for this service type. Changes affect new sessions only.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., In-Home Individual Music"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v as ServiceCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location *</Label>
              <Select
                value={formData.location}
                onValueChange={(v) => setFormData({ ...formData, location: v as LocationType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((loc) => (
                    <SelectItem key={loc.value} value={loc.value}>
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_rate">Base Rate ($) *</Label>
              <Input
                id="base_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.base_rate}
                onChange={(e) => setFormData({ ...formData, base_rate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="per_person_rate">Per Person Rate ($)</Label>
              <Input
                id="per_person_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.per_person_rate}
                onChange={(e) => setFormData({ ...formData, per_person_rate: e.target.value })}
                placeholder="0 for individual"
              />
            </div>
          </div>

          {/* Contractor Cap */}
          <div className="space-y-2">
            <Label htmlFor="contractor_cap">Contractor Cap ($)</Label>
            <Input
              id="contractor_cap"
              type="number"
              step="0.01"
              min="0"
              value={formData.contractor_cap}
              onChange={(e) => setFormData({ ...formData, contractor_cap: e.target.value })}
              placeholder="Leave empty for no cap"
            />
            <p className="text-xs text-gray-500">
              Maximum contractor pay per session. Leave empty for no cap.
            </p>
          </div>

          {/* Total Cap */}
          <div className="space-y-2">
            <Label htmlFor="total_cap">Total Cap ($)</Label>
            <Input
              id="total_cap"
              type="number"
              step="0.01"
              min="0"
              value={formData.total_cap}
              onChange={(e) => setFormData({ ...formData, total_cap: e.target.value })}
              placeholder="Leave empty for no cap"
            />
            <p className="text-xs text-gray-500">
              Maximum total billed amount per session. Leave empty for no cap.
            </p>
          </div>

          {/* Rent */}
          <div className="space-y-2">
            <Label htmlFor="rent_percentage">Rent Percentage (%)</Label>
            <Input
              id="rent_percentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.rent_percentage}
              onChange={(e) => setFormData({ ...formData, rent_percentage: e.target.value })}
              placeholder="0"
            />
            <p className="text-xs text-gray-500">
              Percentage of session that goes to rent (e.g., for Matt&apos;s Music location)
            </p>
          </div>

          {/* Scholarship Rate */}
          <div className="space-y-2">
            <Label htmlFor="scholarship_rate">Scholarship Rate ($)</Label>
            <Input
              id="scholarship_rate"
              type="number"
              step="0.01"
              min="0"
              value={formData.scholarship_rate}
              onChange={(e) => setFormData({ ...formData, scholarship_rate: e.target.value })}
              placeholder="Leave empty to use normal rate"
            />
            <p className="text-xs text-gray-500">
              Flat rate charged to scholarship clients. Contractor still gets normal pay; MCA absorbs the discount.
            </p>
          </div>

          {/* Contractor Pay by Duration */}
          <div className="space-y-2">
            <Label>Contractor Pay by Duration</Label>
            <p className="text-xs text-gray-500">
              Set the default contractor pay for each session duration. Leave empty to calculate automatically from MCA %.
            </p>
            <div className="border rounded-lg divide-y">
              {durationOptions.map((dur) => {
                const durKey = String(dur)
                // Calculate what auto-formula would give
                const autoCalc = calculateSessionPricing(
                  {
                    ...({} as ServiceType),
                    base_rate: parseFloat(formData.base_rate) || 0,
                    per_person_rate: 0,
                    mca_percentage: parseFloat(formData.mca_percentage) || 0,
                    contractor_cap: formData.contractor_cap ? parseFloat(formData.contractor_cap) : null,
                    total_cap: formData.total_cap ? parseFloat(formData.total_cap) : null,
                    contractor_pay_schedule: null,
                    rent_percentage: 0,
                    scholarship_rate: null,
                    scholarship_discount_percentage: 0,
                    minimum_attendees: 1,
                  } as ServiceType,
                  1,
                  dur
                )
                return (
                  <div key={dur} className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium w-14">{dur} min</span>
                      <span className="text-xs text-gray-400">
                        auto: {formatCurrency(autoCalc.contractorPay)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500">$</span>
                      <Input
                        type="number"
                        step="0.50"
                        min="0"
                        value={formData.pay_schedule[durKey] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pay_schedule: { ...formData.pay_schedule, [durKey]: e.target.value },
                          })
                        }
                        placeholder={autoCalc.contractorPay.toFixed(2)}
                        className="w-24 h-8 text-sm"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Scholarship Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label htmlFor="is_scholarship">Scholarship Service</Label>
              <p className="text-xs text-gray-500">
                Sessions are batch-invoiced monthly on the Scholarship tab instead of per-session
              </p>
            </div>
            <Switch
              id="is_scholarship"
              checked={formData.is_scholarship}
              onCheckedChange={(checked) => setFormData({ ...formData, is_scholarship: checked })}
            />
          </div>

          {/* Requires Client Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label htmlFor="requires_client">Requires Client</Label>
              <p className="text-xs text-gray-500">
                Turn off for admin work or tasks that don&apos;t need a client
              </p>
            </div>
            <Switch
              id="requires_client"
              checked={formData.requires_client}
              onCheckedChange={(checked) => setFormData({ ...formData, requires_client: checked })}
            />
          </div>

          {/* Contractor Restrictions */}
          <div className="space-y-2">
            <Label>Restrict to Contractors</Label>
            <p className="text-xs text-gray-500">
              Only selected contractors can use this service type. Leave all unchecked for no restriction.
            </p>
            {contractors.length > 0 ? (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {contractors.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Checkbox
                      checked={formData.allowed_contractor_ids.includes(c.id)}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          allowed_contractor_ids: checked
                            ? [...formData.allowed_contractor_ids, c.id]
                            : formData.allowed_contractor_ids.filter((id) => id !== c.id),
                        })
                      }}
                    />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Loading contractors...</p>
            )}
            {formData.allowed_contractor_ids.length > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Restricted to {formData.allowed_contractor_ids.length} contractor{formData.allowed_contractor_ids.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label htmlFor="is_active">Active</Label>
              <p className="text-xs text-gray-500">
                Inactive service types won&apos;t appear in session form
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Service Type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
