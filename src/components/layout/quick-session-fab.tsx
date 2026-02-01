'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

/**
 * Floating Action Button for quick session logging
 * Shows on mobile when not already on the new session page
 */
export function QuickSessionFab() {
  const pathname = usePathname()

  // Don't show on the new session page or edit pages
  if (pathname.includes('/sessions/new') || pathname.includes('/edit')) {
    return null
  }

  return (
    <Link href="/sessions/new/" className="lg:hidden fixed bottom-6 right-6 z-40">
      <Button
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Log new session"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </Link>
  )
}
