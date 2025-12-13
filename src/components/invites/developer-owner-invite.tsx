'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Copy, Check, Loader2 } from 'lucide-react'

export function DeveloperOwnerInvite(props: { organizationId: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
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
    try {
      const response = await fetch('/api/invites/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: props.organizationId,
          role: 'owner',
          email: email.trim() || undefined,
          expiresInDays: 14,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate invite')
      }

      setInviteUrl(data.inviteUrl)
      setExpiresAt(data.expiresAt)
      toast.success('Owner invite link generated')
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
        <p className="text-sm font-medium">Developer: Owner Invite</p>
        <p className="text-xs text-gray-500">
          Generates a single-use owner invite link for this organization.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner_invite_email">Lock to email (optional)</Label>
        <Input
          id="owner_invite_email"
          type="email"
          placeholder="owner@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <Button onClick={generateInvite} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Generate Owner Invite Link
      </Button>

      {inviteUrl && (
        <div className="space-y-2">
          <Label>Invite link</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={inviteUrl} readOnly className="font-mono text-sm" />
            <Button onClick={copyLink} variant="outline" className="w-full sm:w-auto">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {displayExpires && (
            <p className="text-xs text-gray-500">Expires: {displayExpires}</p>
          )}
        </div>
      )}
    </div>
  )
}
