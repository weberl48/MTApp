'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useOrganization } from '@/contexts/organization-context'
import { hasMfaEnabled } from '@/lib/supabase/mfa'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

/**
 * MFA Enforcement Guard
 *
 * Checks if admin/owner users have MFA enabled when the organization requires it.
 * Shows a warning banner and optionally blocks access until MFA is set up.
 */
export function MfaEnforcementGuard({ children }: { children: React.ReactNode }) {
  const { user, settings, isOwner, isAdmin } = useOrganization()
  useRouter() // Router available for navigation if needed
  const pathname = usePathname()
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  // Check if MFA is required for this user's role
  const requireMfa = settings?.security?.require_mfa ?? false
  const isPrivilegedUser = isOwner || isAdmin

  useEffect(() => {
    async function checkMfa() {
      if (!user || !isPrivilegedUser) {
        setChecking(false)
        return
      }

      try {
        const enabled = await hasMfaEnabled()
        setMfaEnabled(enabled)
      } catch (error) {
        console.error('Error checking MFA status:', error)
        setMfaEnabled(false)
      } finally {
        setChecking(false)
      }
    }

    checkMfa()
  }, [user, isPrivilegedUser])

  // Don't block on settings page (so they can set up MFA)
  const isSettingsPage = pathname?.startsWith('/settings')

  // If checking, show nothing extra
  if (checking) {
    return <>{children}</>
  }

  // If MFA is required but not enabled for a privileged user
  if (requireMfa && isPrivilegedUser && mfaEnabled === false && !isSettingsPage) {
    return (
      <div className="p-4 space-y-4">
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <Shield className="w-5 h-5" />
              Two-Factor Authentication Required
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">
              Your organization requires two-factor authentication for admin accounts.
              Please set up 2FA to continue using the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings?tab=security">
              <Button>
                <Shield className="w-4 h-4 mr-2" />
                Set Up Two-Factor Authentication
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If MFA is recommended but not required, show a warning banner
  if (isPrivilegedUser && mfaEnabled === false && !isSettingsPage) {
    return (
      <>
        <div className="mx-4 mt-2 mb-0">
          <div className="flex items-center gap-3 p-3 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-amber-700 dark:text-amber-300 flex-1">
              Your account does not have two-factor authentication enabled.
              For better security, we recommend setting up 2FA.
            </span>
            <Link href="/settings?tab=security">
              <Button variant="outline" size="sm" className="flex-shrink-0">
                Set Up 2FA
              </Button>
            </Link>
          </div>
        </div>
        {children}
      </>
    )
  }

  return <>{children}</>
}
