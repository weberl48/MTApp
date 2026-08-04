'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { MfaSetup } from '@/components/forms/mfa-setup'
import { PageHelp } from '@/components/help/page-help'
import { useOrganization } from '@/contexts/organization-context'
import { roleLabels } from '@/lib/constants/display'
import { toast } from 'sonner'
import Link from 'next/link'
import type { OrganizationSettings } from '@/types/database'

/**
 * The owner-facing switches, in the order they appear. Each key is a
 * `settings.permissions` flag; `adminGrantsFromSettings()` maps it to the
 * permission it grants, so the wording here is the only thing to keep in sync.
 */
// The Account card's role text and badge both read from the central
// `roleLabels` map (never derive the label independently) — they used to
// disagree: the text was a 2-way ternary that silently fell back to
// "Contractor" for any role it didn't recognize, e.g. "developer", while the
// badge printed user.role verbatim.
const ADMIN_VISIBILITY_SWITCHES: {
  key: keyof OrganizationSettings['permissions']
  label: string
  description: string
}[] = [
  {
    key: 'admin_view_contractor_pay',
    label: 'Contractor pay & rates',
    description:
      "What each contractor earns and their pay rates — the Team page's earnings columns and the Rates tab.",
  },
  {
    key: 'admin_view_margins',
    label: 'Session & invoice margins',
    description:
      'Pricing breakdowns on sessions and the Financial Breakdown on invoices (your cut and contractor pay).',
  },
  {
    key: 'admin_view_analytics',
    label: 'Analytics & revenue',
    description: 'The Analytics page and the revenue summary on the dashboard.',
  },
  {
    key: 'admin_view_payroll',
    label: 'Payroll',
    description: 'The Payroll page, contractor payouts and the tax summary exports.',
  },
]

export default function ProfileSettingsPage() {
  const { organization, user, settings, can, updateSettings, refreshOrganization } = useOrganization()
  const isOwner = can('settings:edit')
  const [saving, setSaving] = useState(false)

  // Profile form state
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profilePhone, setProfilePhone] = useState(user?.phone || '')

  // Security settings
  const [localSettings, setLocalSettings] = useState<OrganizationSettings | null>(settings)

  useEffect(() => {
    if (settings) setLocalSettings(settings)
  }, [settings])

  async function saveProfile() {
    setSaving(true)
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: profileName, phone: profilePhone || null })
        .eq('id', user?.id)
      if (error) throw error
      toast.success('Profile updated')
      refreshOrganization()
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function saveSecuritySettings() {
    if (!localSettings) return
    setSaving(true)
    try {
      await updateSettings(localSettings)
      toast.success('Security settings saved')
    } catch {
      toast.error('Failed to save security settings')
    } finally {
      setSaving(false)
    }
  }

  async function saveAdminVisibility() {
    if (!localSettings) return
    setSaving(true)
    try {
      await updateSettings(localSettings)
      toast.success('Admin visibility saved')
    } catch {
      toast.error('Failed to save admin visibility')
    } finally {
      setSaving(false)
    }
  }

  if (!organization || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
            <h1 className="text-2xl font-bold text-foreground">Profile & Security</h1>
            <PageHelp article="profile-and-security" />
          </div>
          <p className="text-muted-foreground">Your personal information and security settings</p>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile Card */}
        <Card data-tour="profile-card">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile_name">Name</Label>
              <Input
                id="profile_name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile_phone">Phone</Label>
              <Input
                id="profile_phone"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground">
                  {roleLabels[user.role] ?? user.role}
                </p>
              </div>
              <Badge variant={user.role === 'owner' ? 'default' : user.role === 'admin' ? 'secondary' : 'outline'}>
                {roleLabels[user.role] ?? user.role}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Organization</p>
                <p className="text-sm text-muted-foreground">{organization.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MFA Setup */}
        <MfaSetup />

        {/* Security Settings - Owner only */}
        {isOwner && localSettings && (
          <Card data-tour="security-policies">
            <CardHeader>
              <CardTitle>Session Security</CardTitle>
              <CardDescription>
                Configure automatic session timeout and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min={5}
                  max={120}
                  value={localSettings.security?.session_timeout_minutes ?? 30}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      security: {
                        ...localSettings.security,
                        session_timeout_minutes: parseInt(e.target.value) || 30,
                      },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Users will be logged out after this many minutes of inactivity
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Admins and owners must set up 2FA before using the app (contractors are not blocked)
                  </p>
                </div>
                <Switch
                  checked={localSettings.security?.require_mfa ?? false}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      security: {
                        ...localSettings.security,
                        require_mfa: checked,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  min={3}
                  max={10}
                  value={localSettings.security?.max_login_attempts ?? 5}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      security: {
                        ...localSettings.security,
                        max_login_attempts: parseInt(e.target.value) || 5,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                <Input
                  id="lockoutDuration"
                  type="number"
                  min={5}
                  max={60}
                  value={localSettings.security?.lockout_duration_minutes ?? 15}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      security: {
                        ...localSettings.security,
                        lockout_duration_minutes: parseInt(e.target.value) || 15,
                      },
                    })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={saveSecuritySettings} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* What admins can see — owner only. Everything defaults off: contractor pay
            and margins are owner business unless the owner opts admins in. */}
        {isOwner && localSettings && (
          <Card data-tour="admin-visibility">
            <CardHeader>
              <CardTitle>What Admins Can See</CardTitle>
              <CardDescription>
                Administrators run sessions, clients and billing. These switches decide how
                much of the money side they see. All are off by default — contractors and
                owners are unaffected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ADMIN_VISIBILITY_SWITCHES.map(({ key, label, description }, i) => (
                <div key={key}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                      <Label>{label}</Label>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      aria-label={label}
                      checked={localSettings.permissions?.[key] ?? false}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          permissions: {
                            ...localSettings.permissions,
                            [key]: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <Button onClick={saveAdminVisibility} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Admin Visibility
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
