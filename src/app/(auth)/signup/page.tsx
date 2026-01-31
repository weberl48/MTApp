'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, UserPlus } from 'lucide-react'
import { validatePassword } from '@/lib/auth/password'
import { PasswordStrength } from '@/components/forms/password-strength'

export default function SignupPage() {
  const searchParams = useSearchParams()
  const inviteOrgId = searchParams.get('org') // For joining existing org via invite link
  const inviteToken = searchParams.get('invite') // Secure role-based invite token

  const [signupType, setSignupType] = useState<'new-org' | 'join-org'>(
    inviteOrgId || inviteToken ? 'join-org' : 'new-org'
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [inviteCode, setInviteCode] = useState(inviteOrgId || '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      setError(`Password requirements not met: ${passwordValidation.message}`)
      setLoading(false)
      return
    }

    if (signupType === 'new-org' && !organizationName.trim()) {
      setError('Please enter your practice name')
      setLoading(false)
      return
    }

    if (signupType === 'join-org' && !inviteCode.trim()) {
      setError('Please enter an invite code or organization ID')
      setLoading(false)
      return
    }

    try {
      // Build metadata based on signup type
      const metadata: Record<string, string> = {
        name,
      }

      if (signupType === 'new-org') {
        // Creating new organization - will become owner
        metadata.organization_name = organizationName.trim()
      } else {
        // Joining existing organization - either via org id (contractor) or secure invite token (role-based)
        if (inviteToken) {
          metadata.invite_token = inviteToken
        } else {
          metadata.organization_id = inviteCode.trim()
          metadata.role = 'contractor'
        }
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a confirmation link. Please check your email to verify your account.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Back to login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription>
          Create a new practice or join an existing one
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          {/* Signup Type Toggle */}
          {!inviteOrgId && !inviteToken && (
            <Tabs value={signupType} onValueChange={(v) => setSignupType(v as 'new-org' | 'join-org')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new-org" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  New Practice
                </TabsTrigger>
                <TabsTrigger value="join-org" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Join Team
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Organization Name (for new org) */}
          {signupType === 'new-org' && (
            <div className="space-y-2">
              <Label htmlFor="organizationName">Practice Name</Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="e.g., Harmony Music Therapy"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required={signupType === 'new-org'}
              />
              <p className="text-xs text-gray-500">This will be your organization&apos;s name</p>
            </div>
          )}

          {/* Invite Code (for joining org) */}
          {signupType === 'join-org' && !inviteToken && (
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="Enter invite code from your admin"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required={signupType === 'join-org'}
                disabled={!!inviteOrgId}
              />
              <p className="text-xs text-gray-500">Get this from your practice administrator</p>
            </div>
          )}

          {inviteToken && (
            <div className="p-3 text-sm text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 rounded-md">
              You&apos;re signing up with a secure invite link.
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Your Information</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
            <PasswordStrength password={password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : signupType === 'new-org' ? 'Create Practice' : 'Join Practice'}
          </Button>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
