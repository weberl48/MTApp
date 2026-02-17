'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useOrganization } from '@/contexts/organization-context'
import {
  ArrowLeft,
  Loader2,
  Save,
  Eye,
  FileText,
  Mail,
  ExternalLink,
  Globe,
} from 'lucide-react'
import Image from 'next/image'
import { LogoUpload } from '@/components/forms/logo-upload'
import { ColorPicker } from '@/components/ui/color-picker'
import { toast } from 'sonner'
import Link from 'next/link'
import type { SocialLinks } from '@/types/database'

export default function PracticeSettingsPage() {
  const { organization, user, can, feature, updateOrganization } = useOrganization()
  const isOwner = can('settings:edit')
  const [saving, setSaving] = useState(false)

  // Organization form state
  const [orgName, setOrgName] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgAddress, setOrgAddress] = useState('')
  const [orgWebsite, setOrgWebsite] = useState('')

  // Branding form state
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState('#1e40af')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [taxId, setTaxId] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')
  const [currency, setCurrency] = useState('USD')
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({})

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name)
      setOrgEmail(organization.email || '')
      setOrgPhone(organization.phone || '')
      setOrgAddress(organization.address || '')
      setOrgWebsite(organization.website || '')
      setPrimaryColor(organization.primary_color || '#3b82f6')
      setSecondaryColor(organization.secondary_color || '#1e40af')
      setTagline(organization.tagline || '')
      setDescription(organization.description || '')
      setTaxId(organization.tax_id || '')
      setTimezone(organization.timezone || 'America/New_York')
      setCurrency(organization.currency || 'USD')
      setSocialLinks((organization.social_links as SocialLinks) || {})
    }
  }, [organization])

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

  if (!isOwner) {
    return (
      <div className="text-center py-12 text-gray-500">
        Only the practice owner can manage these settings.
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Practice & Branding</h1>
          <p className="text-gray-500 dark:text-gray-400">Organization info, logo, colors, and social media</p>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Organization Details */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Your practice information that appears on invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org_name">Practice Name</Label>
              <Input id="org_name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org_email">Email</Label>
                <Input id="org_email" type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org_phone">Phone</Label>
                <Input id="org_phone" value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org_address">Address</Label>
              <Textarea id="org_address" value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org_website">Website</Label>
              <Input id="org_website" value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} placeholder="https://" />
            </div>
            <Button onClick={saveOrgInfo} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Organization Info
            </Button>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Preview
            </CardTitle>
            <CardDescription>See how your branding looks across invoices, emails, and the client portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Invoice Header Preview */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoice</span>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {organization.logo_url ? (
                      <Image src={organization.logo_url} alt="Logo" width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: primaryColor }}>
                        {(orgName || organization.name).charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-base" style={{ color: primaryColor }}>{orgName || organization.name}</p>
                      <p className="text-xs" style={{ color: secondaryColor }}>{tagline || 'Your tagline here'}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p className="font-semibold text-sm" style={{ color: primaryColor }}>INVOICE</p>
                    <p>#INV-001</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Email Header Preview */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</span>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <div className="px-4 py-3 text-center" style={{ backgroundColor: primaryColor }}>
                  <p className="font-bold text-white text-sm">{orgName || organization.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{tagline || 'Your tagline here'}</p>
                </div>
                <div className="bg-white px-4 py-3">
                  <div className="space-y-1.5">
                    <div className="h-2 w-3/4 rounded bg-gray-200" />
                    <div className="h-2 w-full rounded bg-gray-100" />
                    <div className="h-2 w-5/6 rounded bg-gray-100" />
                  </div>
                  <div className="mt-3">
                    <div className="inline-block rounded px-3 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}>
                      View Invoice
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {feature('client_portal') && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client Portal</span>
                  </div>
                  <div className="rounded-lg border bg-white">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <div className="flex items-center gap-3">
                        {organization.logo_url ? (
                          <Image src={organization.logo_url} alt="Logo" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primaryColor }}>
                            {(orgName || organization.name).charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm">{orgName || organization.name}</p>
                          <p className="text-xs text-muted-foreground">Welcome, Jane Doe</p>
                        </div>
                      </div>
                      <div className="rounded px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}>
                        Sign Out
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>Your practice logo appears on invoices and emails</CardDescription>
          </CardHeader>
          <CardContent>
            <LogoUpload organizationId={organization.id} currentLogoUrl={organization.logo_url} onUploadComplete={handleLogoUpload} />
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
            <CardDescription>Customize colors used throughout your invoices and communications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColorPicker label="Primary Color" value={primaryColor} onChange={setPrimaryColor} />
              <ColorPicker label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} />
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardDescription>Additional information shown on invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g., Bringing music to life" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of your practice..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID / EIN</Label>
              <Input id="tax_id" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="XX-XXXXXXX" />
              <p className="text-xs text-gray-500">Optional. Shown on invoices if provided.</p>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Regional Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  aria-label="Timezone"
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
                  aria-label="Currency"
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

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media</CardTitle>
            <CardDescription>Optional links to your social media profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" value={socialLinks.facebook || ''} onChange={(e) => updateSocialLink('facebook', e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" value={socialLinks.instagram || ''} onChange={(e) => updateSocialLink('instagram', e.target.value)} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" value={socialLinks.linkedin || ''} onChange={(e) => updateSocialLink('linkedin', e.target.value)} placeholder="https://linkedin.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input id="youtube" value={socialLinks.youtube || ''} onChange={(e) => updateSocialLink('youtube', e.target.value)} placeholder="https://youtube.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <Input id="twitter" value={socialLinks.twitter || ''} onChange={(e) => updateSocialLink('twitter', e.target.value)} placeholder="https://x.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input id="tiktok" value={socialLinks.tiktok || ''} onChange={(e) => updateSocialLink('tiktok', e.target.value)} placeholder="https://tiktok.com/@..." />
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
    </div>
  )
}
