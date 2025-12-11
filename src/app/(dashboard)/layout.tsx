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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header user={user} />
          <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pt-6 sm:pb-6">
            {children}
          </main>
        </div>
        <Toaster />
      </div>
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
