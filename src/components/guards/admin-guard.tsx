'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/contexts/organization-context'
import { Loader2 } from 'lucide-react'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const { isAdmin, loading, viewAsRole } = useOrganization()

  useEffect(() => {
    // Only redirect if we're simulating a non-admin role
    if (!loading && viewAsRole && !isAdmin) {
      router.push('/dashboard/')
    }
  }, [isAdmin, loading, viewAsRole, router])

  // Show loading while context is initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // If viewing as a non-admin role, show access denied briefly before redirect
  if (viewAsRole && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm">Contractors cannot access this page</p>
        <p className="text-xs mt-2">(Redirecting to dashboard...)</p>
      </div>
    )
  }

  return <>{children}</>
}
