'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Key, Copy, Check, Loader2, ExternalLink, Mail, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog'
import { useOrganization } from '@/contexts/organization-context'

interface ClientPortalAccessProps {
  clientId: string
  clientEmail: string | null
}

/**
 * Token metadata as returned by the staff listing. Deliberately credential-free:
 * tokens are stored hashed, so a link's raw value exists only at the moment it
 * is minted — this card can show that value once, right after generating it,
 * and never again.
 */
interface TokenSummary {
  id: string
  expires_at: string
  last_accessed_at: string | null
  created_at: string
}

interface FreshLink {
  url: string
  expiresAt: string
}

export function ClientPortalAccess({ clientId, clientEmail }: ClientPortalAccessProps) {
  const { settings } = useOrganization()
  const [tokens, setTokens] = useState<TokenSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<'invite' | 'generate' | 'revoke' | null>(null)
  const [freshLink, setFreshLink] = useState<FreshLink | null>(null)
  const [copied, setCopied] = useState(false)
  const { dialogProps: confirmDialogProps, confirm: openConfirm } = useConfirmDialog()

  const refreshTokens = useCallback(async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/access-token/`)
      if (response.ok) {
        const data = await response.json()
        // The API already excludes revoked tokens; drop expired ones here so
        // `tokens` only ever holds usable access.
        const now = Date.now()
        setTokens(
          ((data.tokens || []) as TokenSummary[]).filter(
            (t) => new Date(t.expires_at).getTime() > now
          )
        )
      }
    } catch {
      console.error('[MCA] Error loading tokens')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    refreshTokens()
  }, [refreshTokens])

  async function sendInvite() {
    if (!clientEmail) {
      toast.error('Client does not have an email address on file')
      return
    }
    setWorking('invite')
    try {
      const response = await fetch(`/api/clients/${clientId}/send-invite/`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to send invite')
      toast.success(`Portal invite sent to ${clientEmail}`)
      await refreshTokens()
    } catch (error) {
      console.error('[MCA] Error sending invite')
      toast.error(error instanceof Error ? error.message : 'Failed to send invite')
    } finally {
      setWorking(null)
    }
  }

  async function generateLink() {
    setWorking('generate')
    try {
      const response = await fetch(`/api/clients/${clientId}/access-token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryDays: settings?.portal?.token_expiry_days ?? 90 }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate link')
      setFreshLink({ url: data.portalUrl, expiresAt: data.expiresAt })
      setCopied(false)
      toast.success('Portal link generated — copy it now')
      await refreshTokens()
    } catch (error) {
      console.error('[MCA] Error generating token')
      toast.error(error instanceof Error ? error.message : 'Failed to generate link')
    } finally {
      setWorking(null)
    }
  }

  function revokeAll() {
    openConfirm({
      title: 'Revoke Portal Access',
      description:
        'Revoke every portal link issued to this client? They will no longer be able to open their portal until you send a new invite or generate a new link.',
      confirmLabel: 'Revoke',
      onConfirm: async () => {
        setWorking('revoke')
        try {
          const response = await fetch(`/api/clients/${clientId}/access-token/`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ all: true }),
          })
          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to revoke access')
          }
          toast.success('Portal access revoked')
          setFreshLink(null)
          await refreshTokens()
        } catch (error) {
          console.error('[MCA] Error revoking tokens')
          toast.error(error instanceof Error ? error.message : 'Failed to revoke access')
        } finally {
          setWorking(null)
        }
      },
    })
  }

  function copyFreshLink() {
    if (!freshLink) return
    navigator.clipboard.writeText(freshLink.url)
    setCopied(true)
    toast.success('Portal link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const activeToken = tokens[0]

  return (
    <Card data-tour="portal-access-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Portal Access
        </CardTitle>
        <CardDescription>
          Secure, no-password portal links for this client
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-4 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {freshLink && (
              <div className="space-y-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-xs font-medium text-green-800 dark:text-green-200">
                  New link — expires {formatDate(freshLink.expiresAt)}
                </p>
                <p className="text-xs font-mono break-all text-green-700 dark:text-green-300">
                  {freshLink.url}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={copyFreshLink}>
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    Copy Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(freshLink.url, '_blank', 'noopener,noreferrer')}
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Copy it now — for security this link can&apos;t be shown again.
                </p>
              </div>
            )}

            {activeToken ? (
              <>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Active
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Expires {formatDate(activeToken.expires_at)}
                  </span>
                </div>

                {activeToken.last_accessed_at && (
                  <p className="text-xs text-gray-500">
                    Last accessed: {formatDate(activeToken.last_accessed_at)}
                  </p>
                )}

                {clientEmail && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={sendInvite}
                    disabled={working !== null}
                  >
                    {working === 'invite' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    {working === 'invite' ? 'Sending...' : `Email New Invite to ${clientEmail}`}
                  </Button>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="ghost" onClick={generateLink} disabled={working !== null}>
                    {working === 'generate' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4 mr-1" />
                    )}
                    New Link
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={revokeAll}
                    disabled={working !== null}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Revoke Access
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  No active portal access. Send an invite or generate a link so this client can view
                  their sessions, goals, and resources.
                </p>

                {clientEmail ? (
                  <Button onClick={sendInvite} disabled={working !== null} className="w-full">
                    {working === 'invite' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending Invite...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Portal Invite
                      </>
                    )}
                  </Button>
                ) : (
                  <p className="text-xs text-amber-600">
                    Note: Client has no email on file. Generate a link and share it with them
                    directly — they won&apos;t be able to request a new one themselves if it expires.
                  </p>
                )}

                <Button
                  variant={clientEmail ? 'outline' : 'default'}
                  onClick={generateLink}
                  disabled={working !== null}
                  className="w-full"
                >
                  {working === 'generate' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      {clientEmail ? "Generate Link (Don't Email)" : 'Generate Portal Link'}
                    </>
                  )}
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
      <ConfirmDialog {...confirmDialogProps} />
    </Card>
  )
}
