'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useOrganization } from '@/contexts/organization-context'
import { QuickLogDrawer } from '@/components/forms/quick-log-drawer'

/**
 * Floating Action Button for quick session logging.
 * Shows on mobile, only on session-relevant routes (dashboard + sessions),
 * when not already on the new session page or an edit page.
 * Contractors get a bottom-sheet drawer; admins/owners get a link to the full form.
 */
export function QuickSessionFab() {
  const pathname = usePathname()
  const { isContractor } = useOrganization()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Quick-logging only has context on the dashboard and within the sessions
  // section — everywhere else (invoices, settings, clients, team, etc.) the
  // FAB has nothing relevant to jump to. Matches the sidebar's own
  // pathname.startsWith(href) convention.
  const isSessionRelevantRoute =
    pathname.startsWith('/dashboard/') || pathname.startsWith('/sessions/')
  if (!isSessionRelevantRoute) {
    return null
  }

  // Don't show on the new session page or edit pages — you're already there
  if (pathname.includes('/sessions/new') || pathname.includes('/edit')) {
    return null
  }

  // Contractors get the quick-log drawer
  if (isContractor) {
    return (
      <>
        <Button
          size="lg"
          data-tour="quick-session-fab"
          className="lg:hidden fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Log new session"
          onClick={() => setDrawerOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
        <QuickLogDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      </>
    )
  }

  // Admins/owners get a direct link to the full form
  return (
    <Link href="/sessions/new/" className="lg:hidden fixed bottom-6 right-6 z-40">
      <Button
        size="lg"
        data-tour="quick-session-fab"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Log new session"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </Link>
  )
}
