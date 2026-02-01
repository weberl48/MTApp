'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Check, Copy, Loader2, Mail } from 'lucide-react'

type InviteResult = {
  inviteUrl: string
  expiresAt: string
  emailSent?: boolean
}

export function ContractorInvite(props: { organizationId: string }) {
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
          role: 'contractor',
          email: email.trim() || undefined,
          expiresInDays: 30,
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
        toast.success('Contractor invite link generated')
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contractor_invite_email">Email address (optional)</Label>
        <Input
          id="contractor_invite_email"
          type="email"
          placeholder="contractor@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Enter their email to send an invite automatically, or leave blank to just copy the link
        </p>
      </div>

      {email.trim() && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="contractor_send_email"
            checked={sendEmail}
            onCheckedChange={(checked) => setSendEmail(checked === true)}
          />
          <Label htmlFor="contractor_send_email" className="text-sm font-normal cursor-pointer">
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
          'Generate invite link'
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
          <p className="text-xs text-gray-500">
            This is a single-use secure invite link (safer than sharing the org ID)
          </p>
        </div>
      )}
    </div>
  )
}
