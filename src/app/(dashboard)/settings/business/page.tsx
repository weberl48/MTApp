'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ServiceTypeForm } from '@/components/forms/service-type-form'
import { useOrganization } from '@/contexts/organization-context'
import {
  ArrowLeft,
  DollarSign,
  FileText,
  Settings2,
  Bell,
  ToggleLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog'
import type {
  ServiceType,
  OrganizationSettings,
  FeatureFlags,
} from '@/types/database'
import { FEATURE_DEFINITIONS } from '@/lib/features'

export default function BusinessSettingsPage() {
  const { organization, can, settings, feature, updateSettings } = useOrganization()
  const isOwner = can('settings:edit')
  const isAdmin = can('session:view-all')
  const [saving, setSaving] = useState(false)
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null)
  const [isServiceTypeFormOpen, setIsServiceTypeFormOpen] = useState(false)
  const [localSettings, setLocalSettings] = useState<OrganizationSettings | null>(settings)
  const { dialogProps: confirmDialogProps, confirm: openConfirm } = useConfirmDialog()

  useEffect(() => {
    if (settings) setLocalSettings(settings)
  }, [settings])

  const loadData = useCallback(async () => {
    if (!organization) return
    const supabase = createClient()
    const { data: types } = await supabase
      .from('service_types')
      .select('*')
      .eq('organization_id', organization.id)
      .order('display_order', { ascending: true })
    setServiceTypes(types || [])
  }, [organization])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  function handleDeleteServiceType(serviceType: ServiceType) {
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
          loadData()
        } catch {
          toast.error('Failed to delete service type. It may be in use by existing sessions.')
        }
      },
    })
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-gray-500">
        You do not have permission to manage business settings.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon" aria-label="Back to settings">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Rules</h1>
          <p className="text-gray-500 dark:text-gray-400">Services, invoicing, sessions, notifications, and features</p>
        </div>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="features" className="flex items-center gap-2">
              <ToggleLeft className="w-4 h-4" />
              Features
            </TabsTrigger>
          )}
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Service Types</CardTitle>
                <CardDescription>Configure pricing rules for each service type</CardDescription>
              </div>
              <Button onClick={() => { setEditingServiceType(null); setIsServiceTypeFormOpen(true) }} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Service Type
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serviceTypes.map((st) => (
                  <div
                    key={st.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      st.is_active ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800 opacity-60'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{st.name}</p>
                        {!st.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ${st.base_rate}
                        {st.per_person_rate > 0 && ` + $${st.per_person_rate}/person`}
                        {st.mca_percentage > 0 && ` | ${st.mca_percentage}% cut`}
                        {st.contractor_cap && ` | Max $${st.contractor_cap}`}
                        {st.rent_percentage > 0 && ` | ${st.rent_percentage}% rent`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{st.location.replace('_', ' ')}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => { setEditingServiceType(st); setIsServiceTypeFormOpen(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteServiceType(st)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {serviceTypes.length === 0 && (
                  <p className="text-center py-8 text-gray-500">
                    No service types configured. Add your first service type to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <ServiceTypeForm
            key={editingServiceType?.id || 'new'}
            serviceType={editingServiceType}
            isOpen={isServiceTypeFormOpen}
            onClose={() => setIsServiceTypeFormOpen(false)}
            onSaved={loadData}
          />
        </TabsContent>

        {/* Invoice Settings Tab */}
        {localSettings && (
          <TabsContent value="invoices">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Invoice Settings</CardTitle>
                <CardDescription>Configure how invoices are generated</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="due_days">Default Due Days</Label>
                  <Input
                    id="due_days"
                    type="number"
                    min="1"
                    max="90"
                    value={localSettings.invoice.due_days}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        invoice: { ...localSettings.invoice, due_days: parseInt(e.target.value) || 30 },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer_text">Invoice Footer Text</Label>
                  <Textarea
                    id="footer_text"
                    value={localSettings.invoice.footer_text}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        invoice: { ...localSettings.invoice, footer_text: e.target.value },
                      })
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_instructions">Payment Instructions</Label>
                  <Textarea
                    id="payment_instructions"
                    value={localSettings.invoice.payment_instructions}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        invoice: { ...localSettings.invoice, payment_instructions: e.target.value },
                      })
                    }
                    rows={3}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Send Payment Reminders</Label>
                    <p className="text-xs text-gray-500">Automatically send email reminders for unpaid invoices</p>
                  </div>
                  <Switch
                    checked={localSettings.invoice.send_reminders}
                    onCheckedChange={(checked) =>
                      setLocalSettings({
                        ...localSettings,
                        invoice: { ...localSettings.invoice, send_reminders: checked },
                      })
                    }
                  />
                </div>
                {localSettings.invoice.send_reminders && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="reminder_days">Reminder Days Before Due</Label>
                    <Input
                      id="reminder_days"
                      value={(localSettings.invoice.reminder_days || [7, 1]).join(', ')}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          invoice: {
                            ...localSettings.invoice,
                            reminder_days: e.target.value
                              .split(',')
                              .map((v) => parseInt(v.trim()))
                              .filter((v) => !isNaN(v)),
                          },
                        })
                      }
                      placeholder="7, 1"
                    />
                    <p className="text-xs text-gray-500">Comma-separated list of days before due date to send reminders</p>
                  </div>
                )}
                <Button onClick={saveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Invoice Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Session Settings Tab */}
        {localSettings && (
          <TabsContent value="sessions">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Session Settings</CardTitle>
                <CardDescription>Configure defaults for session logging</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default_duration">Default Duration (minutes)</Label>
                  <Input
                    id="default_duration"
                    type="number"
                    min="15"
                    max="180"
                    value={localSettings.session.default_duration}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        session: { ...localSettings.session, default_duration: parseInt(e.target.value) || 30 },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_options">Duration Options</Label>
                  <Input
                    id="duration_options"
                    value={localSettings.session.duration_options.join(', ')}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        session: {
                          ...localSettings.session,
                          duration_options: e.target.value.split(',').map((v) => parseInt(v.trim())).filter((v) => !isNaN(v)),
                        },
                      })
                    }
                    placeholder="30, 45, 60, 90"
                  />
                  <p className="text-xs text-gray-500">Comma-separated list of duration options</p>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Session Notes</Label>
                    <p className="text-xs text-gray-500">Contractors must add notes before submitting</p>
                  </div>
                  <Switch
                    checked={localSettings.session.require_notes}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, session: { ...localSettings.session, require_notes: checked } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Submit Sessions</Label>
                    <p className="text-xs text-gray-500">Sessions are submitted automatically</p>
                  </div>
                  <Switch
                    checked={localSettings.session.auto_submit}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, session: { ...localSettings.session, auto_submit: checked } })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Send Session Reminders</Label>
                    <p className="text-xs text-gray-500">Email contractors before their sessions</p>
                  </div>
                  <Switch
                    checked={localSettings.session.send_reminders ?? true}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, session: { ...localSettings.session, send_reminders: checked } })
                    }
                  />
                </div>
                {localSettings.session.send_reminders !== false && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="reminder_hours">Reminder Lead Time (hours)</Label>
                    <Input
                      id="reminder_hours"
                      type="number"
                      min="1"
                      max="72"
                      value={localSettings.session.reminder_hours ?? 24}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          session: { ...localSettings.session, reminder_hours: parseInt(e.target.value) || 24 },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">Reminders will be sent this many hours before the session</p>
                  </div>
                )}
                <Separator />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Pricing</h3>
                <div className="space-y-2">
                  <Label htmlFor="no_show_fee">No-Show Fee ($)</Label>
                  <Input
                    id="no_show_fee"
                    type="number"
                    min="0"
                    step="5"
                    value={localSettings.pricing?.no_show_fee ?? 60}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, pricing: { ...localSettings.pricing, no_show_fee: parseFloat(e.target.value) || 60 } })
                    }
                  />
                  <p className="text-xs text-gray-500">Flat fee charged for no-show sessions</p>
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
                      setLocalSettings({ ...localSettings, pricing: { ...localSettings.pricing, duration_base_minutes: parseInt(e.target.value) || 30 } })
                    }
                  />
                  <p className="text-xs text-gray-500">Service type base rates are for this many minutes</p>
                </div>
                {feature('client_portal') && (
                  <>
                    <Separator />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Client Portal</h3>
                    <div className="space-y-2">
                      <Label htmlFor="token_expiry_days">Portal Link Expiry (days)</Label>
                      <Input
                        id="token_expiry_days"
                        type="number"
                        min="1"
                        max="365"
                        value={localSettings.portal?.token_expiry_days ?? 90}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, portal: { ...localSettings.portal, token_expiry_days: parseInt(e.target.value) || 90 } })
                        }
                      />
                      <p className="text-xs text-gray-500">How many days before client portal access links expire</p>
                    </div>
                  </>
                )}
                <Button onClick={saveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Session Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Notification Settings Tab */}
        {localSettings && (
          <TabsContent value="notifications">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure email notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_email">Admin Notification Email</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={localSettings.notification.admin_email}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, notification: { ...localSettings.notification, admin_email: e.target.value } })
                    }
                    placeholder="admin@yourpractice.com"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email on Session Submit</Label>
                    <p className="text-xs text-gray-500">Send email when a contractor submits a session</p>
                  </div>
                  <Switch
                    checked={localSettings.notification.email_on_session_submit}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, notification: { ...localSettings.notification, email_on_session_submit: checked } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email on Invoice Paid</Label>
                    <p className="text-xs text-gray-500">Send email when an invoice is marked as paid</p>
                  </div>
                  <Switch
                    checked={localSettings.notification.email_on_invoice_paid}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, notification: { ...localSettings.notification, email_on_invoice_paid: checked } })
                    }
                  />
                </div>
                <Button onClick={saveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Features Tab */}
        {isOwner && localSettings && (
          <TabsContent value="features">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Feature Toggles</CardTitle>
                <CardDescription>
                  Enable or disable major features for your organization. Disabled features are hidden from all users.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(Object.entries(FEATURE_DEFINITIONS) as [keyof FeatureFlags, (typeof FEATURE_DEFINITIONS)[keyof FeatureFlags]][]).map(
                  ([key, def]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{def.label}</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{def.description}</p>
                      </div>
                      <Switch
                        checked={localSettings.features?.[key] ?? true}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            features: { ...localSettings.features, [key]: checked },
                          })
                        }
                      />
                    </div>
                  )
                )}
                <Separator />
                <Button onClick={saveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Feature Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      <ConfirmDialog {...confirmDialogProps} />
    </div>
  )
}
