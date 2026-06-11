'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/sonner'
import { Loader2 } from 'lucide-react'
import { OrganizationProvider, useOrganization } from '@/contexts/organization-context'
import { BrandingProvider } from '@/components/providers/branding-provider'
import { ActivityTracker } from '@/components/providers/activity-tracker'
import { OwnerOnboardingGate } from '@/components/onboarding/owner-onboarding-gate'
import { MfaEnforcementGuard } from '@/components/guards/mfa-enforcement-guard'
import { QuickSessionFab } from '@/components/layout/quick-session-fab'
import { WalkthroughProvider } from '@/components/walkthroughs/walkthrough-provider'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, organization, loading, error } = useOrganization()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login/')
    }
  }, [loading, user, router])

  useEffect(() => {
    // Listen for auth state changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-3 min-h-screen bg-gray-50 dark:bg-gray-950"
      >
        <Loader2 aria-hidden="true" className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading your workspace…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => router.push('/login/')}
          className="text-blue-600 hover:underline"
        >
          Return to login
        </button>
      </div>
    )
  }

  if (!user || !organization) {
    return null
  }

  return (
    <BrandingProvider>
      <ActivityTracker>
        <WalkthroughProvider>
          <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
            >
              Skip to main content
            </a>
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <Header user={user} />
                <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] lg:pb-6 focus:outline-none">
                  <MfaEnforcementGuard>
                    <OwnerOnboardingGate />
                    {children}
                  </MfaEnforcementGuard>
                </main>
              </div>
            </div>
            <Toaster />
            <QuickSessionFab />
          </div>
        </WalkthroughProvider>
      </ActivityTracker>
    </BrandingProvider>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OrganizationProvider>
      <DashboardContent>{children}</DashboardContent>
    </OrganizationProvider>
  )
}
