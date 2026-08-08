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

interface ServiceTypeFormProps {
  serviceType?: ServiceType | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  // Passed by the pricing hub so a newly created service sorts after the
  // existing ones. Omitted elsewhere — the insert then relies on the
  // database default for display_order.
  nextDisplayOrder?: number
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

export function ServiceTypeForm({ serviceType, isOpen, onClose, onSaved, nextDisplayOrder }: ServiceTypeFormProps) {
  const { organization } = useOrganization()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: serviceType?.name || '',
    category: serviceType?.category || ('music_individual' as ServiceCategory),
    location: serviceType?.location || ('in_home' as LocationType),
    base_rate: serviceType?.base_rate?.toString() || '',
    per_person_rate: serviceType?.per_person_rate?.toString() || '0',
    mca_percentage: serviceType?.mca_percentage?.toString() || '',
    is_active: serviceType?.is_active ?? true,
    is_scholarship: serviceType?.is_scholarship ?? false,
    requires_client: serviceType?.requires_client ?? true,
    admin_only: serviceType?.admin_only ?? false,
    requires_classroom: serviceType?.requires_classroom ?? false,
    allowed_contractor_ids: serviceType?.allowed_contractor_ids || ([] as string[]),
  })

  // Fetch contractors for restriction selector. Must be org-scoped explicitly:
  // RLS alone isn't enough because developer accounts can read users across
  // ALL organizations, which would leak other tenants' staff into this list.
  const [contractors, setContractors] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    if (!isOpen || !organization?.id) return
    const supabase = createClient()
    supabase
      .from('users')
      .select('id, name')
      .eq('organization_id', organization.id)
      .in('role', ['contractor', 'admin', 'owner'])
      .order('name')
      .then(({ data }) => setContractors(data || []))
  }, [isOpen, organization?.id])

  const isEditing = !!serviceType

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    // Identity & behavior fields only. Money fields (base_rate, per_person_rate,
    // mca_percentage, contractor_cap, total_cap, pay schedule, group matrix, etc.)
    // are edited on the Pricing page's rate tables now — an edit-mode save here
    // must never touch them, or it would clobber a table edit made elsewhere.
    const identityData = {
      name: formData.name,
      category: formData.category,
      location: formData.location,
      is_active: formData.is_active,
      is_scholarship: formData.is_scholarship,
      requires_client: formData.requires_client,
      admin_only: formData.admin_only,
      requires_classroom: formData.requires_classroom,
      allowed_contractor_ids: formData.allowed_contractor_ids.length > 0 ? formData.allowed_contractor_ids : null,
    }

    try {
      if (isEditing && serviceType) {
        const { error } = await supabase
          .from('service_types')
          .update(identityData)
          .eq('id', serviceType.id)

        if (error) throw error
        toast.success('Service type updated')
      } else {
        const { error } = await supabase.from('service_types').insert({
          ...identityData,
          base_rate: parseFloat(formData.base_rate),
          per_person_rate: parseFloat(formData.per_person_rate) || 0,
          mca_percentage: parseFloat(formData.mca_percentage),
          ...(nextDisplayOrder !== undefined ? { display_order: nextDisplayOrder } : {}),
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
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        // During a guided tour (driver.js puts .driver-active on body) clicks
        // on the dimmed page or the tour popover count as outside interactions
        // — don't let them dismiss the form mid-step. Esc still closes.
        onInteractOutside={(e) => {
          if (document.body.classList.contains('driver-active')) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Service Type' : 'Add Service Type'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this service type's identity and behavior. Changes affect new sessions only."
              : "Set up a new service type's identity and behavior. Changes affect new sessions only."}
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

          <div className="grid grid-cols-2 gap-4" data-tour="category-location">
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

          {/* Pricing: create only. Editing a service's rates happens on the
              Pricing page's rate tables, never in this dialog. */}
          {isEditing ? (
            <p className="text-xs text-muted-foreground">
              Rates for this service are edited on the Pricing page.
            </p>
          ) : (
            <div className="space-y-4 rounded-lg border p-4">
              <Label className="text-sm font-medium">Pricing</Label>
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
                <p className="text-xs text-muted-foreground">
                  The organization&apos;s cut. Contractor pay defaults to total minus this.
                </p>
              </div>
            </div>
          )}

          {/* Scholarship Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label htmlFor="is_scholarship">Scholarship Service</Label>
              <p className="text-xs text-muted-foreground">
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
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label htmlFor="requires_client">Requires Client</Label>
              <p className="text-xs text-muted-foreground">
                Turn off for admin work or tasks that don&apos;t need a client
              </p>
            </div>
            <Switch
              id="requires_client"
              checked={formData.requires_client}
              onCheckedChange={(checked) => setFormData({ ...formData, requires_client: checked })}
            />
          </div>

          {/* Admin-only: role rule, unlike the per-contractor allowlist below */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="admin_only">Admin Only</Label>
              <p className="text-xs text-muted-foreground">
                Hide this service from contractors when they log a session. Admins and owners always see it.
              </p>
            </div>
            <Switch
              id="admin_only"
              checked={formData.admin_only}
              onCheckedChange={(checked) => setFormData({ ...formData, admin_only: checked })}
            />
          </div>

          {/* Requires Classroom */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requires_classroom">Requires Classroom</Label>
              <p className="text-xs text-muted-foreground">
                Sessions of this service must record a classroom (e.g. in-school groups). It prints on the invoice.
              </p>
            </div>
            <Switch
              id="requires_classroom"
              checked={formData.requires_classroom}
              onCheckedChange={(checked) => setFormData({ ...formData, requires_classroom: checked })}
            />
          </div>

          {/* Contractor Restrictions */}
          <div className="space-y-2" data-tour="contractor-restrictions">
            <Label>Restrict to Contractors</Label>
            <p className="text-xs text-muted-foreground">
              Only selected contractors can use this service type. Leave all unchecked for no restriction.
            </p>
            {contractors.length > 0 ? (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {contractors.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted">
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
              <p className="text-xs text-muted-foreground">Loading contractors...</p>
            )}
            {formData.allowed_contractor_ids.length > 0 && (
              <p className="text-xs text-info">
                Restricted to {formData.allowed_contractor_ids.length} contractor{formData.allowed_contractor_ids.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label htmlFor="is_active">Active</Label>
              <p className="text-xs text-muted-foreground">
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
              <Loader2
                aria-hidden="true"
                className={`mr-2 h-4 w-4 animate-spin ${loading ? '' : 'invisible'}`}
              />
              {isEditing ? 'Save Changes' : 'Create Service Type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
