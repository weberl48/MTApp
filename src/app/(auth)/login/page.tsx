'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Clock, Lock } from 'lucide-react'
import { needsMfaVerification } from '@/lib/supabase/mfa'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [lockoutMinutes, setLockoutMinutes] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Check lockout status before attempting login
      const lockoutRes = await fetch('/api/auth/lockout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'check' }),
      })

      if (lockoutRes.ok) {
        const lockoutStatus = await lockoutRes.json()
        if (lockoutStatus.locked) {
          setLockoutMinutes(lockoutStatus.remainingMinutes)
          setError(`Account temporarily locked due to too many failed attempts. Try again in ${lockoutStatus.remainingMinutes} minute${lockoutStatus.remainingMinutes === 1 ? '' : 's'}.`)
          return
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Record failed attempt
        fetch('/api/auth/lockout/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, action: 'record', success: false }),
        })

        setError(error.message)
        return
      }

      // Record successful login
      fetch('/api/auth/lockout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'record', success: true }),
      })

      // Check if MFA verification is needed
      const { needsVerification } = await needsMfaVerification()

      if (needsVerification) {
        router.push('/mfa-verify/')
        return
      }

      router.push('/dashboard/')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
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
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
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
            <Input
              id="password"
              type="password"
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
