'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, CheckCircle } from 'lucide-react'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devUrl, setDevUrl] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    setDevUrl(null)

    try {
      const response = await fetch('/api/portal/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send link')
        return
      }

      setSuccess(true)

      // In development, show the direct link
      if (data.portalUrl) {
        setDevUrl(data.portalUrl)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Client Portal</CardTitle>
          <CardDescription>
            Enter your email to receive a link to access your portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Check your email</h3>
              <p className="text-gray-600 text-sm mb-4">
                If an account exists with that email, we&apos;ve sent you a link to access your portal.
              </p>

              {devUrl && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                  <p className="text-xs text-yellow-800 font-medium mb-2">
                    Development Mode - Direct Link:
                  </p>
                  <a
                    href={devUrl}
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {devUrl}
                  </a>
                </div>
              )}

              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
              >
                Send to a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading || !email}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Portal Link'
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Don&apos;t have portal access? Contact your therapist to get set up.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
