'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Check, Copy, Loader2, Mail } from 'lucide-react'

type InviteRole = 'owner' | 'admin' | 'contractor'

type InviteResult = {
  inviteUrl: string
  expiresAt: string
  emailSent?: boolean
}

function RoleInviteSection(props: {
  organizationId: string
  role: InviteRole
  title: string
  description: string
  defaultExpiresInDays: number
}) {
  const [email, setEmail] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [copied, setCopied] = useState(false)

  const displayExpires = useMemo(() => {
    if (!expiresAt) return null
    try {
      return new Date(expiresAt).toLocaleString()
    } catch {
      return expiresAt
    }
  }, [expiresAt])

  async function generateInvite() {
    setLoading(true)
    setEmailSent(false)
    try {
      const response = await fetch('/api/invites/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: props.organizationId,
          role: props.role,
          email: email.trim() || undefined,
          expiresInDays: props.defaultExpiresInDays,
          sendEmail: sendEmail && !!email.trim(),
        }),
      })

      const data = (await response.json().catch(() => ({}))) as Partial<InviteResult> & {
        error?: string
      }

      if (!response.ok || !data.inviteUrl || !data.expiresAt) {
        throw new Error(data?.error || 'Failed to generate invite')
      }

      setInviteUrl(data.inviteUrl)
      setExpiresAt(data.expiresAt)
      setEmailSent(data.emailSent || false)

      if (data.emailSent) {
        toast.success(`Invite sent to ${email}`)
      } else {
        toast.success(`${props.title} link generated`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate invite')
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('Invite link copied')
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{props.title}</p>
        <p className="text-xs text-gray-500">{props.description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${props.role}_invite_email`}>Email address</Label>
        <Input
          id={`${props.role}_invite_email`}
          type="email"
          placeholder="person@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {email.trim() && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${props.role}_send_email`}
            checked={sendEmail}
            onCheckedChange={(checked) => setSendEmail(checked === true)}
          />
          <Label htmlFor={`${props.role}_send_email`} className="text-sm font-normal cursor-pointer">
            Send invite email automatically
          </Label>
        </div>
      )}

      <Button onClick={generateInvite} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {email.trim() && sendEmail ? (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Send Invite
          </>
        ) : (
          `Generate ${props.role} invite link`
        )}
      </Button>

      {inviteUrl && (
        <div className="space-y-2">
          {emailSent && (
            <div className="p-3 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300 rounded-md flex items-center gap-2">
              <Check className="h-4 w-4" />
              Invite email sent successfully!
            </div>
          )}
          <Label>Invite link</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={inviteUrl} readOnly className="font-mono text-sm" />
            <Button onClick={copyLink} variant="outline" className="w-full sm:w-auto">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {displayExpires && <p className="text-xs text-gray-500">Expires: {displayExpires}</p>}
        </div>
      )}
    </div>
  )
}

export function DeveloperRoleInvites(props: { organizationId: string }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Developer: Secure role invites</p>
        <p className="text-xs text-gray-500">
          These are single-use, expiring links (safer than sharing an org ID link).
        </p>
      </div>

      <RoleInviteSection
        organizationId={props.organizationId}
        role="owner"
        title="Owner invite"
        description="Creates an owner for this organization (single-use)."
        defaultExpiresInDays={14}
      />

      <Separator />

      <RoleInviteSection
        organizationId={props.organizationId}
        role="admin"
        title="Admin invite"
        description="Creates an admin for this organization (single-use)."
        defaultExpiresInDays={14}
      />

      <Separator />

      <RoleInviteSection
        organizationId={props.organizationId}
        role="contractor"
        title="Contractor invite (secure)"
        description="Creates a contractor for this organization (single-use)."
        defaultExpiresInDays={30}
      />
    </div>
  )
}







