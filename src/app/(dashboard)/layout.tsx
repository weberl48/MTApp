'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/sonner'
import { Loader2 } from 'lucide-react'
import { OrganizationProvider, useOrganization } from '@/contexts/organization-context'
import { ActivityTracker } from '@/components/providers/activity-tracker'
import { OwnerOnboardingGate } from '@/components/onboarding/owner-onboarding-gate'
import { MfaEnforcementGuard } from '@/components/guards/mfa-enforcement-guard'
import { PilotModeBanner } from '@/components/layout/pilot-mode-banner'
import { AiChatBubble } from '@/components/help/ai-chat-bubble'
import { WalkthroughProvider } from '@/components/walkthroughs/walkthrough-provider'
import { MobileTabBar } from '@/components/mobile/tab-bar'
import { MoreSheet } from '@/components/mobile/more-sheet'

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
        className="flex flex-col items-center justify-center gap-3 min-h-screen bg-(--canvas)"
      >
        <Loader2 aria-hidden="true" className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-(--canvas)">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={() => router.push('/login/')}
          className="text-primary hover:underline"
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
    <ActivityTracker>
        <WalkthroughProvider>
          <div className="flex flex-col h-screen bg-(--canvas)">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
            >
              Skip to main content
            </a>
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <Header user={user} />
                <PilotModeBanner />
                {/* Mobile bottom padding clears the fixed tab bar: 4rem bar height
                    + env(safe-area-inset-bottom) for the home-indicator area, plus
                    ~2rem breathing room below the last piece of content. Desktop
                    (lg:pb-6) is untouched — the tab bar is lg:hidden there, and the
                    sidebar/header replace it entirely. */}
                <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] lg:pb-6 focus:outline-none">
                  <MfaEnforcementGuard>
                    <OwnerOnboardingGate />
                    {children}
                  </MfaEnforcementGuard>
                </main>
              </div>
            </div>
            <MobileTabBar />
            <MoreSheet />
            <AiChatBubble />
          </div>
        </WalkthroughProvider>
    </ActivityTracker>
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
      {/* Outside DashboardContent's loading/error early returns: refreshOrganization()
          flips `loading`, and a Toaster inside the conditional tree unmounts right as a
          post-save success toast is queued — the save works but the toast never shows. */}
      <Toaster />
    </OrganizationProvider>
  )
}
