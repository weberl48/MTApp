'use client'

import { useState } from 'react'
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
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { ServiceType, ServiceCategory, LocationType } from '@/types/database'

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
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: serviceType?.name || '',
    category: serviceType?.category || ('music_individual' as ServiceCategory),
    location: serviceType?.location || ('in_home' as LocationType),
    base_rate: serviceType?.base_rate?.toString() || '50',
    per_person_rate: serviceType?.per_person_rate?.toString() || '0',
    mca_percentage: serviceType?.mca_percentage?.toString() || '25',
    contractor_cap: serviceType?.contractor_cap?.toString() || '',
    rent_percentage: serviceType?.rent_percentage?.toString() || '0',
    is_active: serviceType?.is_active ?? true,
  })

  const isEditing = !!serviceType

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    const data = {
      name: formData.name,
      category: formData.category,
      location: formData.location,
      base_rate: parseFloat(formData.base_rate),
      per_person_rate: parseFloat(formData.per_person_rate) || 0,
      mca_percentage: parseFloat(formData.mca_percentage),
      contractor_cap: formData.contractor_cap ? parseFloat(formData.contractor_cap) : null,
      rent_percentage: parseFloat(formData.rent_percentage) || 0,
      is_active: formData.is_active,
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
        const { error } = await supabase.from('service_types').insert(data)

        if (error) throw error
        toast.success('Service type created')
      }

      onSaved()
      onClose()
    } catch (error) {
      console.error('Error saving service type:', error)
      toast.error('Failed to save service type')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
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

          {/* MCA Cut */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mca_percentage">MCA Percentage (%) *</Label>
              <Input
                id="mca_percentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.mca_percentage}
                onChange={(e) => setFormData({ ...formData, mca_percentage: e.target.value })}
                required
              />
            </div>

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
            </div>
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
