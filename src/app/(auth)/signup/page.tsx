'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, UserPlus } from 'lucide-react'
import { validatePassword } from '@/lib/auth/password'
import { PasswordStrength } from '@/components/forms/password-strength'

export default function SignupPage() {
  const searchParams = useSearchParams()
  // Secure role-based invite token — the ONLY way to join an existing practice.
  //
  // There used to be a second path: an "Invite Code" text field that was really
  // the organization's UUID, passed to signUp() as metadata.organization_id and
  // honoured by the handle_new_user() trigger. That made a database identifier
  // into a non-rotatable shared credential — anyone who had ever seen it (a
  // former contractor, anyone forwarded the "code") could sign themselves into
  // the tenant. Closed by 20260802_close_tenant_join_and_rls_gaps.sql; the field
  // is removed here so the UI stops teaching people to circulate org UUIDs.
  const inviteToken = searchParams.get('invite')

  const [signupType, setSignupType] = useState<'new-org' | 'join-org'>(
    inviteToken ? 'join-org' : 'new-org'
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
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

    if (signupType === 'join-org' && !inviteToken) {
      setError('Joining a practice requires an invitation link. Ask your administrator to send you one.')
      setLoading(false)
      return
    }

    try {
      // Build metadata based on signup type.
      //
      // Note what is NOT here: organization_id and role. raw_user_meta_data is
      // attacker-controlled, so the trigger must never take either from it — the
      // organization comes from the invite row, the role from the invite or from
      // the create-a-practice branch.
      const metadata: Record<string, string> = {
        name,
      }

      if (signupType === 'new-org') {
        // Creating new organization - will become owner
        metadata.organization_name = organizationName.trim()
      } else if (inviteToken) {
        metadata.invite_token = inviteToken
      } else {
        // Unreachable via the guard above; kept as an explicit failure so a
        // future refactor cannot turn "join" into "silently create a new org".
        setError('Joining a practice requires an invitation link.')
        setLoading(false)
        return
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
          <Link href="/login/" className="w-full">
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
          {!inviteToken && (
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

          {/* Joining a practice requires a secure invite link — there is no
              code to type. The old free-text field accepted the organization's
              UUID, which let anyone who knew it join the tenant uninvited. */}
          {signupType === 'join-org' && !inviteToken && (
            <div className="p-3 text-sm text-amber-800 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300 rounded-md">
              Joining an existing practice needs an invitation link. Ask your practice
              administrator to invite you from <span className="font-medium">Team &rarr; Invite</span>,
              then open the link they send you.
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
            <PasswordInput
              id="password"
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
            <PasswordInput
              id="confirmPassword"
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
            <Link href="/login/" className="text-blue-600 hover:underline dark:text-blue-400">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
