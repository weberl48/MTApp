'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOrganization } from '@/contexts/organization-context'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { OrganizationSettings } from '@/types/database'
import { parseSettingNumber } from '@/lib/settings/input'

/**
 * Section 4 — policies & fees. Self-contained: mirrors `settings` into local state
 * (same pattern as `settings/business/page.tsx`) and saves through
 * `OrganizationContext.updateSettings()`. Fields below are moved verbatim (ids, labels,
 * helper text, parse functions) from the old Business Rules Sessions/Invoices tabs.
 */
export function PoliciesForm() {
  const { settings, updateSettings } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [localSettings, setLocalSettings] = useState<OrganizationSettings | null>(settings)

  useEffect(() => {
    if (settings) setLocalSettings(settings)
  }, [settings])

  async function saveSettings() {
    if (!localSettings) return
    setSaving(true)
    try {
      await updateSettings(localSettings)
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (!localSettings) return null

  return (
    <Card data-tour="pricing-policies">
      <CardHeader>
        <CardTitle>4 · Policies &amp; fees</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="no_show_fee">No-Show Fee ($)</Label>
          <Input
            id="no_show_fee"
            type="number"
            min="0"
            step="5"
            value={localSettings.pricing?.no_show_fee ?? 60}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                pricing: { ...localSettings.pricing, no_show_fee: parseSettingNumber(e.target.value, 60) },
              })
            }
          />
          <p className="text-xs text-muted-foreground">Flat fee charged for no-show sessions</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_base_minutes">Base Duration for Rate Scaling (minutes)</Label>
          <Input
            id="duration_base_minutes"
            type="number"
            min="15"
            max="120"
            value={localSettings.pricing?.duration_base_minutes ?? 30}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                pricing: { ...localSettings.pricing, duration_base_minutes: parseInt(e.target.value) || 30 },
              })
            }
          />
          <p className="text-xs text-muted-foreground">Service type base rates are for this many minutes</p>
        </div>

        <Separator />
        <h3 className="text-sm font-medium text-foreground">Square Processing Fee</h3>
        <div className="flex items-center justify-between">
          <div>
            <Label>Add Processing Fee to Square Invoices</Label>
            <p className="text-xs text-muted-foreground">Automatically add a service charge to cover Square processing fees</p>
          </div>
          <Switch
            checked={localSettings.pricing?.square_processing_fee_enabled ?? false}
            onCheckedChange={(checked) =>
              setLocalSettings({
                ...localSettings,
                pricing: { ...localSettings.pricing, square_processing_fee_enabled: checked },
              })
            }
          />
        </div>

        {localSettings.pricing?.square_processing_fee_enabled && (
          <div className="ml-6 space-y-4">
            <div className="space-y-2">
              <Label>Fee Type</Label>
              <Select
                value={localSettings.pricing?.square_processing_fee_type ?? 'fixed'}
                onValueChange={(val) =>
                  setLocalSettings({
                    ...localSettings,
                    pricing: {
                      ...localSettings.pricing,
                      square_processing_fee_type: val as 'fixed' | 'percentage',
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Dollar Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(localSettings.pricing?.square_processing_fee_type ?? 'fixed') === 'percentage' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sq_fee_pct">Percentage (%)</Label>
                  <Input
                    id="sq_fee_pct"
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={localSettings.pricing?.square_processing_fee_percentage ?? 0}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        pricing: {
                          ...localSettings.pricing,
                          square_processing_fee_percentage: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sq_fee_fixed_cents">+ Fixed Amount (cents)</Label>
                  <Input
                    id="sq_fee_fixed_cents"
                    type="number"
                    min="0"
                    max="100"
                    value={localSettings.pricing?.square_processing_fee_fixed_cents ?? 0}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        pricing: {
                          ...localSettings.pricing,
                          square_processing_fee_fixed_cents: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">e.g., 30 for $0.30 (Square standard is 2.9% + 30 cents)</p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="sq_fee_amount">Fee Amount ($)</Label>
                <Input
                  id="sq_fee_amount"
                  type="number"
                  min="0"
                  step="0.25"
                  value={localSettings.pricing?.square_processing_fee_amount ?? 0}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      pricing: {
                        ...localSettings.pricing,
                        square_processing_fee_amount: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Fixed dollar amount added as a service charge on each Square invoice</p>
              </div>
            )}
          </div>
        )}

        <Separator />
        <p className="text-xs text-muted-foreground">
          Session duration choices are in{' '}
          <Link href="/settings/business/" className="underline">
            Business Rules → Sessions
          </Link>
          ; they define the columns in the pay grids above.
        </p>

        <Button onClick={saveSettings} disabled={saving}>
          <Loader2
            aria-hidden="true"
            className={`mr-2 h-4 w-4 animate-spin ${saving ? '' : 'invisible'}`}
          />
          <Save className="mr-2 h-4 w-4" />
          Save Policies &amp; Fees
        </Button>
      </CardContent>
    </Card>
  )
}
