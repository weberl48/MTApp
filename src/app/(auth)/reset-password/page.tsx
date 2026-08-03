'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { validatePassword } from '@/lib/auth/password'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { MfaChallenge } from '@/components/forms/mfa-challenge'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  // Set when the recovery session is AAL1 but the account has a verified TOTP
  // factor — the password cannot be changed until that code is entered.
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    /**
     * A recovery link reaches this page in one of two shapes:
     *
     *   ?code=…            PKCE. Exchangeable ONLY in the browser that asked for
     *                      the reset, because that browser holds the code_verifier.
     *                      `@supabase/ssr` handles this one itself.
     *   #access_token=…    Implicit. What Supabase's admin-generated links return,
     *                      and what you get when the email is opened on a different
     *                      device from the one that requested the reset.
     *
     * `createBrowserClient` is PKCE-only and silently ignores the fragment, so a
     * perfectly valid link rendered "Invalid or expired link" for every
     * cross-device reset — request it on your laptop, open the mail on your
     * phone, dead end. Verified against production: the token sat unconsumed in
     * the URL and no session was ever written to storage. Consume it explicitly.
     */
    async function establishSession() {
      const hash = window.location.hash
      if (hash.startsWith('#')) {
        const params = new URLSearchParams(hash.slice(1))
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (!error) {
            // Don't leave credentials sitting in the address bar or in history.
            window.history.replaceState(null, '', window.location.pathname)
          }
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      setHasSession(!!session)

      /**
       * A recovery link only ever produces an AAL1 session. Supabase refuses
       * `updateUser({ password })` at AAL1 once the account has a verified MFA
       * factor — it answers "AAL2 session is required to update email or
       * password when MFA is enabled". Without a challenge here, every user
       * with MFA is permanently unable to reset a forgotten password, which is
       * everyone privileged once security.require_mfa is on.
       *
       * Ask for the 6-digit code first; verifying it raises this same session
       * to AAL2 and the update below then succeeds.
       */
      if (session) {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (!cancelled && aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
          const { data: factors } = await supabase.auth.mfa.listFactors()
          const verified = factors?.totp?.find((f) => f.status === 'verified')
          if (verified && !cancelled) setMfaFactorId(verified.id)
        }
      }

      if (!cancelled) setChecking(false)
    }

    establishSession()

    // Safety net for the PKCE path: if the client finishes its own exchange
    // after the check above, adopt that session rather than showing the
    // dead-end card.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled || !session) return
      setHasSession(true)
      setChecking(false)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [supabase.auth])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Apply the SAME complexity policy as signup (upper/lower/number/special, min length).
    // Reset previously only checked length >= 8, letting a user reset to a weak password.
    const validation = validatePassword(password)
    if (!validation.isValid) {
      setError(validation.message || 'Password does not meet the requirements')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
      // Sign out so they can log in with new password
      await supabase.auth.signOut()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  if (!hasSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid or expired link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired. Please request a new one.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/forgot-password/" className="w-full">
            <Button className="w-full">Request new reset link</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Raise the recovery session to AAL2 before showing the password form.
  if (mfaFactorId) {
    return (
      <MfaChallenge
        factorId={mfaFactorId}
        onSuccess={() => setMfaFactorId(null)}
      />
    )
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-center">Password updated</CardTitle>
          <CardDescription className="text-center">
            Your password has been successfully reset. You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/login/')} className="w-full">
            Sign in
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
            <p className="text-xs text-gray-500">At least 8 characters</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
