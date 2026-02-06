'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Key, Copy, Check, Loader2, ExternalLink, RefreshCw, Trash2, Eye, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface ClientPortalAccessProps {
  clientId: string
  clientEmail: string | null
}

interface TokenInfo {
  id: string
  token: string
  expires_at: string
  last_accessed_at: string | null
  is_active: boolean
  created_at: string
}

export function ClientPortalAccess({ clientId, clientEmail }: ClientPortalAccessProps) {
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadTokens() {
      try {
        const response = await fetch(`/api/clients/${clientId}/access-token`)
        if (response.ok) {
          const data = await response.json()
          setTokens(data.tokens || [])
        }
      } catch (error) {
        console.error('[MCA] Error loading tokens')
      } finally {
        setLoading(false)
      }
    }
    loadTokens()
  }, [clientId])

  async function refreshTokens() {
    try {
      const response = await fetch(`/api/clients/${clientId}/access-token`)
      if (response.ok) {
        const data = await response.json()
        setTokens(data.tokens || [])
      }
    } catch (error) {
      console.error('[MCA] Error loading tokens')
    }
  }

  async function generateToken() {
    setGenerating(true)
    try {
      const response = await fetch(`/api/clients/${clientId}/access-token`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate token')
      }

      toast.success('Portal access link generated!')
      await refreshTokens()
    } catch (error) {
      console.error('[MCA] Error generating token')
      toast.error(error instanceof Error ? error.message : 'Failed to generate token')
    } finally {
      setGenerating(false)
    }
  }

  async function revokeToken(tokenId: string) {
    if (!confirm('Revoke this portal access? The client will no longer be able to use this link.')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/access-token`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to revoke token')
      }

      toast.success('Portal access revoked')
      setTokens((prev) => prev.filter((t) => t.id !== tokenId))
    } catch (error) {
      console.error('[MCA] Error revoking token')
      toast.error(error instanceof Error ? error.message : 'Failed to revoke token')
    }
  }

  async function sendInvite() {
    if (!clientEmail) {
      toast.error('Client does not have an email address on file')
      return
    }

    setSendingInvite(true)
    try {
      const response = await fetch(`/api/clients/${clientId}/send-invite`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite')
      }

      toast.success(`Portal invite sent to ${clientEmail}`)
      await refreshTokens() // Refresh tokens in case a new one was created
    } catch (error) {
      console.error('[MCA] Error sending invite')
      toast.error(error instanceof Error ? error.message : 'Failed to send invite')
    } finally {
      setSendingInvite(false)
    }
  }

  function copyPortalLink(token: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const portalUrl = `${appUrl}/portal/${token}`
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    toast.success('Portal link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  function openPortal(token: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    window.open(`${appUrl}/portal/${token}`, '_blank')
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const activeToken = tokens.find((t) => t.is_active)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Portal Access
        </CardTitle>
        <CardDescription>
          Manage client portal access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-4 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : activeToken ? (
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

            {/* View as Client - Primary action */}
            <Button
              size="sm"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => openPortal(activeToken.token)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View as Client
            </Button>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => copyPortalLink(activeToken.token)}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                Copy Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openPortal(activeToken.token)}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {/* Send Invite via Email */}
            {clientEmail && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={sendInvite}
                disabled={sendingInvite}
              >
                {sendingInvite ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                {sendingInvite ? 'Sending...' : `Email Invite to ${clientEmail}`}
              </Button>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="ghost"
                onClick={generateToken}
                disabled={generating}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={() => revokeToken(activeToken.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Revoke
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              No active portal access. Generate a link to allow this client to view their sessions, resources, and goals.
            </p>

            {!clientEmail && (
              <p className="text-xs text-amber-600">
                Note: Client has no email on file. They won&apos;t be able to request a new link if this one expires.
              </p>
            )}

            {clientEmail ? (
              <Button
                onClick={sendInvite}
                disabled={sendingInvite}
                className="w-full"
              >
                {sendingInvite ? (
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
              <Button onClick={generateToken} disabled={generating} className="w-full">
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Generate Portal Link
                  </>
                )}
              </Button>
            )}

            {clientEmail && (
              <Button
                variant="outline"
                onClick={generateToken}
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Just Generate Link (Don&apos;t Send)
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
