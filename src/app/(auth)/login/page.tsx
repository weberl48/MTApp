'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Clock, Loader2, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [lockoutMinutes, setLockoutMinutes] = useState(0)
  const [restoring, setRestoring] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  // No browser Supabase client here: authentication goes through
  // POST /api/auth/login so the lockout policy is enforced server-side.

  useEffect(() => {
    // Check if user was redirected due to session timeout
    const reason = searchParams.get('reason')
    if (reason === 'timeout') {
      setSessionExpired(true)
    }
  }, [searchParams])

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutMinutes <= 0) return
    const timer = setInterval(() => {
      setLockoutMinutes(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 60000)
    return () => clearInterval(timer)
  }, [lockoutMinutes])

  function isNetworkError(msg: string) {
    return msg === 'Failed to fetch' || msg === 'Load failed'
  }

  async function attemptRestore() {
    setRestoring(true)
    setError('Server unavailable — attempting to restore automatically...')
    try {
      const res = await fetch('/api/health/restore/', { method: 'POST' })
      if (res.ok) {
        setError('Server is restoring — this usually takes 1-2 minutes. Please try signing in again shortly.')
      } else if (res.status === 401) {
        // Expected in production: /api/health/restore now requires the operator
        // bearer secret. It used to be anonymous, which meant any visitor could
        // spend an org-wide Supabase personal access token.
        setError('Server unavailable. An operator needs to restore the project from the Supabase dashboard (or call /api/health/restore with CRON_SECRET).')
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error === 'SUPABASE_ACCESS_TOKEN not configured'
          ? 'Server unavailable. Automatic restore is not configured — please restore the project from the Supabase dashboard.'
          : 'Server unavailable — automatic restore failed. Please try again later or restore manually from the Supabase dashboard.')
      }
    } catch {
      setError('Server unavailable — could not attempt automatic restore. Please try again later.')
    } finally {
      setRestoring(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Authentication happens server-side (POST /api/auth/login): the lockout
      // check, the credential exchange and the attempt record are one
      // transaction there. Doing it from here meant the lockout policy only
      // applied to clients that chose to ask — see the route's header comment.
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.status === 423) {
        const { remainingMinutes } = await res.json()
        setLockoutMinutes(remainingMinutes)
        setError(`Account temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`)
        return
      }

      // The auth service is unreachable (usually a paused Supabase project),
      // which the route reports separately from a bad password.
      if (res.status === 503) {
        await attemptRestore()
        return
      }

      if (!res.ok) {
        setError('Invalid email or password. Double-check both, or use "Forgot password?" to reset it.')
        return
      }

      const { needsMfa } = await res.json()

      if (needsMfa) {
        router.push('/mfa-verify/')
        return
      }

      router.push('/dashboard/')
      router.refresh()
    } catch (err) {
      if (err instanceof TypeError && isNetworkError(err.message)) {
        await attemptRestore()
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const isLockedOut = lockoutMinutes > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {sessionExpired && (
            <div className="p-3 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-md flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>Your session has expired due to inactivity. Please sign in again.</span>
            </div>
          )}
          {isLockedOut && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md flex items-center gap-2">
              <Lock className="h-4 w-4 flex-shrink-0" />
              <span>Account locked. Try again in {lockoutMinutes} minute{lockoutMinutes === 1 ? '' : 's'}.</span>
            </div>
          )}
          {error && !isLockedOut && (
            <div role="alert" className={`p-3 text-sm rounded-md flex items-center gap-2 ${
              restoring
                ? 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {restoring
                ? <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                : <AlertCircle className="h-4 w-4 flex-shrink-0" />
              }
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password/"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading || isLockedOut}>
            {loading ? 'Signing in...' : isLockedOut ? 'Account Locked' : 'Sign in'}
          </Button>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup/" className="text-blue-600 hover:underline dark:text-blue-400">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
