'use client'

import { useState } from 'react'
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
import { useOrganization } from '@/contexts/organization-context'
import { toast } from 'sonner'
import Link from 'next/link'
import type { OrganizationSettings } from '@/types/database'

export default function ProfileSettingsPage() {
  const { organization, user, settings, can, updateSettings, refreshOrganization } = useOrganization()
  const isOwner = can('settings:edit')
  const [saving, setSaving] = useState(false)

  // Profile form state
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profilePhone, setProfilePhone] = useState(user?.phone || '')

  // Security settings
  const [localSettings, setLocalSettings] = useState<OrganizationSettings | null>(settings)

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

  if (!organization || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile & Security</h1>
          <p className="text-gray-500 dark:text-gray-400">Your personal information and security settings</p>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile Card */}
        <Card>
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
            <Button onClick={saveProfile} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </Button>
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
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-gray-500">
                  {user.role === 'owner' ? 'Owner' : user.role === 'admin' ? 'Administrator' : 'Contractor'}
                </p>
              </div>
              <Badge variant={user.role === 'owner' ? 'default' : user.role === 'admin' ? 'secondary' : 'outline'}>
                {user.role}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Organization</p>
                <p className="text-sm text-gray-500">{organization.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MFA Setup */}
        <MfaSetup />

        {/* Security Settings - Owner only */}
        {isOwner && localSettings && (
          <Card>
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
                <p className="text-sm text-gray-500">
                  Users will be logged out after this many minutes of inactivity
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">
                    Enforce 2FA for all users in your organization
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

              <Button onClick={saveSecuritySettings} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
