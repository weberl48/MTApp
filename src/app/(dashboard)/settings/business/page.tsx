'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHelp } from '@/components/help/page-help'
import { useOrganization } from '@/contexts/organization-context'
import {
  ArrowLeft,
  FileText,
  Settings2,
  Bell,
  ToggleLeft,
  Loader2,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type {
  OrganizationSettings,
  FeatureFlags,
} from '@/types/database'
import { FEATURE_DEFINITIONS } from '@/lib/features'
import { clampSettingNumber } from '@/lib/settings/input'

export default function BusinessSettingsPage() {
  const { organization, can, settings, feature, updateSettings } = useOrganization()
  const isOwner = can('settings:edit')
  const isAdmin = can('session:view-all')
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

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        You do not have permission to manage business settings.
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold text-foreground">Business Rules</h1>
            <PageHelp article="generating-invoices" />
          </div>
          <p className="text-muted-foreground">Invoicing, sessions, notifications, and features</p>
        </div>
      </div>

      {isOwner && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-medium">Service pricing has moved</p>
              <p className="text-sm text-muted-foreground">Rates, contractor pay, and fees now live on the Pricing page.</p>
            </div>
            <Link href="/settings/pricing/">
              <Button variant="outline">Open Pricing</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="invoices" className="space-y-4">
        <div className="relative">
          <TabsList className="h-auto w-full justify-start overflow-x-auto">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="sessions" data-tour="business-tab-sessions" className="flex items-center gap-2">
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
          {/* Scroll affordance: fades the trailing edge so a clipped tab reads as
              "more to scroll to" instead of "cut off". Mobile only — desktop
              always has room for every trigger. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-(--canvas) to-transparent sm:hidden"
          />
        </div>

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
                        invoice: { ...localSettings.invoice, due_days: clampSettingNumber(e.target.value, 30, 1, 90) },
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
                    <p className="text-xs text-muted-foreground">Automatically send email reminders for unpaid invoices</p>
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
                    <p className="text-xs text-muted-foreground">Comma-separated list of days before due date to send reminders</p>
                  </div>
                )}
                <Separator />
                <p className="text-xs text-muted-foreground">
                  Square processing fee settings moved to <Link href="/settings/pricing/" className="underline">Settings › Pricing</Link>.
                </p>

                <Button onClick={saveSettings} disabled={saving}>
                  <Loader2
                    aria-hidden="true"
                    className={`mr-2 h-4 w-4 animate-spin ${saving ? '' : 'invisible'}`}
                  />
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
                  <p className="text-xs text-muted-foreground">Comma-separated list of duration options</p>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Session Notes</Label>
                    <p className="text-xs text-muted-foreground">Contractors must add notes before submitting</p>
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
                    <p className="text-xs text-muted-foreground">Sessions are submitted automatically</p>
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
                    <p className="text-xs text-muted-foreground">Email contractors before their sessions</p>
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
                    <p className="text-xs text-muted-foreground">Reminders will be sent this many hours before the session</p>
                  </div>
                )}
                <Separator />
                <p className="text-xs text-muted-foreground">
                  No-show fee and rate scaling moved to <Link href="/settings/pricing/" className="underline">Settings › Pricing</Link>.
                </p>

                {feature('client_portal') && (
                  <>
                    <Separator />
                    <h3 className="text-sm font-medium text-foreground">Client Portal</h3>
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
                      <p className="text-xs text-muted-foreground">How many days before client portal access links expire</p>
                    </div>
                  </>
                )}
                <Button onClick={saveSettings} disabled={saving}>
                  <Loader2
                    aria-hidden="true"
                    className={`mr-2 h-4 w-4 animate-spin ${saving ? '' : 'invisible'}`}
                  />
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
                    <p className="text-xs text-muted-foreground">Send email when a contractor submits a session</p>
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
                    <p className="text-xs text-muted-foreground">Send email when an invoice is marked as paid</p>
                  </div>
                  <Switch
                    checked={localSettings.notification.email_on_invoice_paid}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, notification: { ...localSettings.notification, email_on_invoice_paid: checked } })
                    }
                  />
                </div>
                <Button onClick={saveSettings} disabled={saving}>
                  <Loader2
                    aria-hidden="true"
                    className={`mr-2 h-4 w-4 animate-spin ${saving ? '' : 'invisible'}`}
                  />
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
                        <p className="text-sm text-muted-foreground">{def.description}</p>
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
                  <Loader2
                    aria-hidden="true"
                    className={`mr-2 h-4 w-4 animate-spin ${saving ? '' : 'invisible'}`}
                  />
                  <Save className="mr-2 h-4 w-4" />
                  Save Feature Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
