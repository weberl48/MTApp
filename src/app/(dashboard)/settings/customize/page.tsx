'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOrganization } from '@/contexts/organization-context'
import { ListCustomizer } from '@/components/settings/list-customizer'
import { paymentMethodLabels, billingMethodLabels } from '@/lib/constants/display'
import {
  ArrowLeft,
  Loader2,
  Save,
  List,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { OrganizationSettings } from '@/types/database'

export default function CustomizeSettingsPage() {
  const { organization, can, settings, updateSettings } = useOrganization()
  const isOwner = can('settings:edit')
  const [saving, setSaving] = useState(false)
  const [localSettings, setLocalSettings] = useState<OrganizationSettings | null>(settings)

  useEffect(() => {
    if (settings) setLocalSettings(settings)
  }, [settings])

  async function handleSave() {
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="text-center py-12 text-gray-500">
        Only the practice owner can manage customization settings.
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customize & Automate</h1>
          <p className="text-gray-500 dark:text-gray-400">Custom labels, visibility, and workflow automation</p>
        </div>
      </div>

      <Tabs defaultValue="lists" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lists" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Custom Lists
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automation
          </TabsTrigger>
        </TabsList>

        {/* Custom Lists Tab */}
        <TabsContent value="lists">
          <div className="space-y-6 max-w-2xl">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Customize labels and toggle visibility for payment methods and billing methods.
              Hidden options won't appear in forms. The internal key (shown in gray) stays the same.
            </p>

            {localSettings && (
              <>
                <ListCustomizer
                  title="Payment Methods"
                  description="How clients pay for sessions"
                  items={localSettings.custom_lists?.payment_methods || {}}
                  defaultLabels={paymentMethodLabels}
                  onChange={(items) =>
                    setLocalSettings({
                      ...localSettings,
                      custom_lists: {
                        ...localSettings.custom_lists,
                        payment_methods: items,
                        billing_methods: localSettings.custom_lists?.billing_methods || {},
                      },
                    })
                  }
                />

                <ListCustomizer
                  title="Billing Methods"
                  description="How invoices are sent to clients"
                  items={localSettings.custom_lists?.billing_methods || {}}
                  defaultLabels={billingMethodLabels}
                  onChange={(items) =>
                    setLocalSettings({
                      ...localSettings,
                      custom_lists: {
                        ...localSettings.custom_lists,
                        payment_methods: localSettings.custom_lists?.payment_methods || {},
                        billing_methods: items,
                      },
                    })
                  }
                />

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Custom Lists
                </Button>
              </>
            )}
          </div>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation">
          <div className="space-y-6 max-w-2xl">
            {localSettings && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Session Automation</CardTitle>
                    <CardDescription>Automate the session approval workflow</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Approve Sessions</Label>
                        <p className="text-sm text-gray-500">
                          Automatically approve sessions when contractors submit them
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.automation?.auto_approve_sessions ?? false}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            automation: {
                              ...localSettings.automation,
                              auto_approve_sessions: checked,
                              auto_send_invoice_on_approve: localSettings.automation?.auto_send_invoice_on_approve ?? false,
                              auto_send_invoice_method: localSettings.automation?.auto_send_invoice_method ?? 'none',
                              auto_generate_scholarship_invoices: localSettings.automation?.auto_generate_scholarship_invoices ?? false,
                              scholarship_invoice_day: localSettings.automation?.scholarship_invoice_day ?? 1,
                            },
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Invoice Automation</CardTitle>
                    <CardDescription>Automate invoice sending after session approval</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Send Invoice on Approval</Label>
                        <p className="text-sm text-gray-500">
                          Automatically send the invoice when a session is approved
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.automation?.auto_send_invoice_on_approve ?? false}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            automation: {
                              ...localSettings.automation,
                              auto_approve_sessions: localSettings.automation?.auto_approve_sessions ?? false,
                              auto_send_invoice_on_approve: checked,
                              auto_send_invoice_method: checked
                                ? (localSettings.automation?.auto_send_invoice_method === 'none' ? 'email' : localSettings.automation?.auto_send_invoice_method ?? 'email')
                                : 'none',
                              auto_generate_scholarship_invoices: localSettings.automation?.auto_generate_scholarship_invoices ?? false,
                              scholarship_invoice_day: localSettings.automation?.scholarship_invoice_day ?? 1,
                            },
                          })
                        }
                      />
                    </div>

                    {localSettings.automation?.auto_send_invoice_on_approve && (
                      <div className="space-y-2 ml-6">
                        <Label htmlFor="send_method">Send Method</Label>
                        <select
                          id="send_method"
                          aria-label="Invoice send method"
                          value={localSettings.automation?.auto_send_invoice_method ?? 'email'}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              automation: {
                                ...localSettings.automation,
                                auto_approve_sessions: localSettings.automation?.auto_approve_sessions ?? false,
                                auto_send_invoice_on_approve: true,
                                auto_send_invoice_method: e.target.value as 'email' | 'square',
                                auto_generate_scholarship_invoices: localSettings.automation?.auto_generate_scholarship_invoices ?? false,
                                scholarship_invoice_day: localSettings.automation?.scholarship_invoice_day ?? 1,
                              },
                            })
                          }
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="email">Email</option>
                          <option value="square">Square</option>
                        </select>
                        <p className="text-xs text-gray-500">
                          Choose how invoices are automatically sent after approval
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Scholarship Automation</CardTitle>
                    <CardDescription>Auto-generate monthly scholarship batch invoices</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Generate Scholarship Invoices</Label>
                        <p className="text-sm text-gray-500">
                          Automatically generate batch invoices for scholarship clients each month
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.automation?.auto_generate_scholarship_invoices ?? false}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            automation: {
                              ...localSettings.automation,
                              auto_approve_sessions: localSettings.automation?.auto_approve_sessions ?? false,
                              auto_send_invoice_on_approve: localSettings.automation?.auto_send_invoice_on_approve ?? false,
                              auto_send_invoice_method: localSettings.automation?.auto_send_invoice_method ?? 'none',
                              auto_generate_scholarship_invoices: checked,
                              scholarship_invoice_day: localSettings.automation?.scholarship_invoice_day ?? 1,
                            },
                          })
                        }
                      />
                    </div>

                    {localSettings.automation?.auto_generate_scholarship_invoices && (
                      <div className="space-y-2 ml-6">
                        <Label htmlFor="scholarship_day">Day of Month</Label>
                        <Input
                          id="scholarship_day"
                          type="number"
                          min={1}
                          max={28}
                          value={localSettings.automation?.scholarship_invoice_day ?? 1}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              automation: {
                                ...localSettings.automation,
                                auto_approve_sessions: localSettings.automation?.auto_approve_sessions ?? false,
                                auto_send_invoice_on_approve: localSettings.automation?.auto_send_invoice_on_approve ?? false,
                                auto_send_invoice_method: localSettings.automation?.auto_send_invoice_method ?? 'none',
                                auto_generate_scholarship_invoices: true,
                                scholarship_invoice_day: parseInt(e.target.value) || 1,
                              },
                            })
                          }
                        />
                        <p className="text-xs text-gray-500">
                          Scholarship invoices will be generated on this day each month (1-28)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Automation Settings
                </Button>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
