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
  User,
  Building2,
  Settings2,
  FileText,
  Bell,
  DollarSign,
  Plus,
  Pencil,
  Loader2,
  Save,
  Users,
  Copy,
  Check,
  Palette,
  Globe,
  History,
} from 'lucide-react'
import { LogoUpload } from '@/components/forms/logo-upload'
import { ColorPicker } from '@/components/ui/color-picker'
import { AuditLogTable } from '@/components/tables/audit-log-table'
import { toast } from 'sonner'
import type {
  User as UserType,
  ServiceType,
  OrganizationSettings,
  SocialLinks,
} from '@/types/database'

export default function SettingsPage() {
  const { organization, user, settings, isOwner, isAdmin, updateOrganization, updateSettings, refreshOrganization } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [teamMembers, setTeamMembers] = useState<UserType[]>([])
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null)
  const [isServiceTypeFormOpen, setIsServiceTypeFormOpen] = useState(false)
  const [copiedInvite, setCopiedInvite] = useState(false)

  // Local form state
  const [orgName, setOrgName] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgAddress, setOrgAddress] = useState('')
  const [orgWebsite, setOrgWebsite] = useState('')
  const [localSettings, setLocalSettings] = useState<OrganizationSettings | null>(null)

  // Profile form state
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')

  // Branding form state
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState('#1e40af')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [taxId, setTaxId] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')
  const [currency, setCurrency] = useState('USD')
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({})

  // Initialize form state from organization
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name)
      setOrgEmail(organization.email || '')
      setOrgPhone(organization.phone || '')
      setOrgAddress(organization.address || '')
      setOrgWebsite(organization.website || '')
      // Branding fields
      setPrimaryColor(organization.primary_color || '#3b82f6')
      setSecondaryColor(organization.secondary_color || '#1e40af')
      setTagline(organization.tagline || '')
      setDescription(organization.description || '')
      setTaxId(organization.tax_id || '')
      setTimezone(organization.timezone || 'America/New_York')
      setCurrency(organization.currency || 'USD')
      setSocialLinks((organization.social_links as SocialLinks) || {})
    }
    if (settings) {
      setLocalSettings(settings)
    }
    if (user) {
      setProfileName(user.name)
      setProfilePhone(user.phone || '')
    }
  }, [organization, settings, user])

  const loadData = useCallback(async () => {
    if (!organization) return
    const supabase = createClient()

    // Load service types
    const { data: types } = await supabase
      .from('service_types')
      .select('*')
      .eq('organization_id', organization.id)
      .order('display_order', { ascending: true })

    setServiceTypes(types || [])

    // Load team members (for owners/admins)
    if (isAdmin) {
      const { data: members } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name')

      setTeamMembers(members || [])
    }
  }, [organization, isAdmin])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function saveOrgInfo() {
    setSaving(true)
    try {
      await updateOrganization({
        name: orgName,
        email: orgEmail || null,
        phone: orgPhone || null,
        address: orgAddress || null,
        website: orgWebsite || null,
      })
      toast.success('Organization info saved')
    } catch {
      toast.error('Failed to save organization info')
    } finally {
      setSaving(false)
    }
  }

  async function saveSettings(_section: keyof OrganizationSettings) {
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

  function handleEditServiceType(serviceType: ServiceType) {
    setEditingServiceType(serviceType)
    setIsServiceTypeFormOpen(true)
  }

  function handleAddServiceType() {
    setEditingServiceType(null)
    setIsServiceTypeFormOpen(true)
  }

  async function copyInviteLink() {
    if (!organization) return
    const inviteUrl = `${window.location.origin}/signup?org=${organization.id}`
    await navigator.clipboard.writeText(inviteUrl)
    setCopiedInvite(true)
    toast.success('Invite link copied!')
    setTimeout(() => setCopiedInvite(false), 2000)
  }

  async function saveBranding() {
    setSaving(true)
    try {
      await updateOrganization({
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        tagline: tagline || null,
        description: description || null,
        tax_id: taxId || null,
        timezone,
        currency,
        social_links: socialLinks,
      })
      toast.success('Branding saved')
    } catch {
      toast.error('Failed to save branding')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(url: string | null) {
    try {
      await updateOrganization({ logo_url: url })
    } catch {
      toast.error('Failed to update logo')
    }
  }

  function updateSocialLink(platform: keyof SocialLinks, value: string) {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value || undefined,
    }))
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {isOwner
            ? 'Manage your organization and configure the application'
            : isAdmin
            ? 'Configure application settings'
            : 'Manage your profile'}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          {isOwner && (
            <>
              <TabsTrigger value="organization" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Organization
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Branding
              </TabsTrigger>
            </>
          )}
          {isAdmin && (
            <>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team
              </TabsTrigger>
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
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Audit Log
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="space-y-6 max-w-2xl">
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
          </div>
        </TabsContent>

        {/* Organization Tab (Owner only) */}
        {isOwner && (
          <TabsContent value="organization">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>
                  Your practice information that appears on invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org_name">Practice Name</Label>
                  <Input
                    id="org_name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org_email">Email</Label>
                    <Input
                      id="org_email"
                      type="email"
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org_phone">Phone</Label>
                    <Input
                      id="org_phone"
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org_address">Address</Label>
                  <Textarea
                    id="org_address"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org_website">Website</Label>
                  <Input
                    id="org_website"
                    value={orgWebsite}
                    onChange={(e) => setOrgWebsite(e.target.value)}
                    placeholder="https://"
                  />
                </div>
                <Button onClick={saveOrgInfo} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Organization Info
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Branding Tab (Owner only) */}
        {isOwner && (
          <TabsContent value="branding">
            <div className="space-y-6 max-w-2xl">
              {/* Logo Upload Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Logo</CardTitle>
                  <CardDescription>
                    Your practice logo appears on invoices and emails
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LogoUpload
                    organizationId={organization.id}
                    currentLogoUrl={organization.logo_url}
                    onUploadComplete={handleLogoUpload}
                  />
                </CardContent>
              </Card>

              {/* Brand Colors Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Brand Colors</CardTitle>
                  <CardDescription>
                    Customize colors used throughout your invoices and communications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ColorPicker
                      label="Primary Color"
                      value={primaryColor}
                      onChange={setPrimaryColor}
                    />
                    <ColorPicker
                      label="Secondary Color"
                      value={secondaryColor}
                      onChange={setSecondaryColor}
                    />
                  </div>
                  <div className="pt-2">
                    <Label className="text-xs text-muted-foreground">Preview</Label>
                    <div className="flex items-center gap-3 mt-2 p-4 rounded-lg border">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {organization.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: primaryColor }}>
                          {organization.name}
                        </p>
                        <p className="text-sm" style={{ color: secondaryColor }}>
                          {tagline || 'Your tagline here'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Details</CardTitle>
                  <CardDescription>
                    Additional information shown on invoices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g., Bringing music to life"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of your practice..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID / EIN</Label>
                    <Input
                      id="tax_id"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="XX-XXXXXXX"
                    />
                    <p className="text-xs text-gray-500">
                      Optional. Shown on invoices if provided.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Regional Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Regional Settings
                  </CardTitle>
                  <CardDescription>
                    Timezone and currency for your practice
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="America/Anchorage">Alaska Time (AKT)</option>
                        <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <select
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Links Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                  <CardDescription>
                    Optional links to your social media profiles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        value={socialLinks.facebook || ''}
                        onChange={(e) => updateSocialLink('facebook', e.target.value)}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={socialLinks.instagram || ''}
                        onChange={(e) => updateSocialLink('instagram', e.target.value)}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={socialLinks.linkedin || ''}
                        onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input
                        id="youtube"
                        value={socialLinks.youtube || ''}
                        onChange={(e) => updateSocialLink('youtube', e.target.value)}
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button onClick={saveBranding} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Branding Settings
              </Button>
            </div>
          </TabsContent>
        )}

        {/* Team Tab */}
        {isAdmin && (
          <TabsContent value="team">
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>Invite Team Members</CardTitle>
                  <CardDescription>
                    Share this link to invite contractors to join your practice
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/signup?org=${organization.id}`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button onClick={copyInviteLink} variant="outline">
                      {copiedInvite ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Anyone with this link can create an account and join your practice as a contractor
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} in your practice
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                        <Badge
                          variant={
                            member.role === 'owner'
                              ? 'default'
                              : member.role === 'admin'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Service Types Tab */}
        {isAdmin && (
          <TabsContent value="services">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Service Types</CardTitle>
                  <CardDescription>
                    Configure pricing rules for each service type
                  </CardDescription>
                </div>
                <Button onClick={handleAddServiceType}>
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
                        st.is_active
                          ? 'bg-white dark:bg-gray-900'
                          : 'bg-gray-50 dark:bg-gray-800 opacity-60'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{st.name}</p>
                          {!st.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ${st.base_rate}
                          {st.per_person_rate > 0 && ` + $${st.per_person_rate}/person`}
                          {' | '}
                          {st.mca_percentage}% cut
                          {st.contractor_cap && ` | Max $${st.contractor_cap}`}
                          {st.rent_percentage > 0 && ` | ${st.rent_percentage}% rent`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{st.location.replace('_', ' ')}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditServiceType(st)}
                        >
                          <Pencil className="h-4 w-4" />
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
              serviceType={editingServiceType}
              isOpen={isServiceTypeFormOpen}
              onClose={() => setIsServiceTypeFormOpen(false)}
              onSaved={loadData}
            />
          </TabsContent>
        )}

        {/* Invoice Settings Tab */}
        {isAdmin && localSettings && (
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
                    <p className="text-xs text-gray-500">
                      Automatically send email reminders for unpaid invoices
                    </p>
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
                <Button onClick={() => saveSettings('invoice')} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Invoice Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Session Settings Tab */}
        {isAdmin && localSettings && (
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
                        session: {
                          ...localSettings.session,
                          default_duration: parseInt(e.target.value) || 30,
                        },
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
                          duration_options: e.target.value
                            .split(',')
                            .map((v) => parseInt(v.trim()))
                            .filter((v) => !isNaN(v)),
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
                      setLocalSettings({
                        ...localSettings,
                        session: { ...localSettings.session, require_notes: checked },
                      })
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
                      setLocalSettings({
                        ...localSettings,
                        session: { ...localSettings.session, auto_submit: checked },
                      })
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
                      setLocalSettings({
                        ...localSettings,
                        session: { ...localSettings.session, send_reminders: checked },
                      })
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
                          session: {
                            ...localSettings.session,
                            reminder_hours: parseInt(e.target.value) || 24,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      Reminders will be sent this many hours before the session
                    </p>
                  </div>
                )}
                <Button onClick={() => saveSettings('session')} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Session Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Notification Settings Tab */}
        {isAdmin && localSettings && (
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
                      setLocalSettings({
                        ...localSettings,
                        notification: { ...localSettings.notification, admin_email: e.target.value },
                      })
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
                      setLocalSettings({
                        ...localSettings,
                        notification: { ...localSettings.notification, email_on_session_submit: checked },
                      })
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
                      setLocalSettings({
                        ...localSettings,
                        notification: { ...localSettings.notification, email_on_invoice_paid: checked },
                      })
                    }
                  />
                </div>
                <Button onClick={() => saveSettings('notification')} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Audit Log Tab */}
        {isAdmin && (
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>
                  Track all changes to sessions, invoices, clients, and other data for compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLogTable />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
