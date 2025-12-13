'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Loader2, AlertCircle } from 'lucide-react'
import { createMfaChallenge, verifyMfaChallenge } from '@/lib/supabase/mfa'

interface MfaChallengeProps {
  factorId: string
  onCancel?: () => void
}

export function MfaChallenge({ factorId, onCancel }: MfaChallengeProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  async function handleVerify() {
    if (code.length !== 6) return

    setVerifying(true)
    setError(null)

    try {
      // Create a challenge
      const challengeId = await createMfaChallenge(factorId)

      // Verify the code
      await verifyMfaChallenge(factorId, challengeId, code)

      // Success - redirect to dashboard
      router.push('/dashboard/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code')
      setCode('')
    } finally {
      setVerifying(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify()
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="mfaCode">Verification Code</Label>
          <Input
            id="mfaCode"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
            className="text-center text-2xl tracking-[0.5em] font-mono"
            autoFocus
            autoComplete="one-time-code"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || verifying}
            className="w-full"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>

          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={verifying}
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Open your authenticator app (Google Authenticator, Authy, etc.) to view your verification
          code.
        </p>
      </CardContent>
    </Card>
  )
}
