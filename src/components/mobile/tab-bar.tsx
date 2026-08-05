'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Plus, FileText, DollarSign, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useOrganization } from '@/contexts/organization-context'
import { useHydrated, useIsMobile } from '@/lib/hooks/use-is-mobile'
import { QuickLogDrawer } from '@/components/forms/quick-log-drawer'

// The virtual keyboard shrinks window.visualViewport's height; treat a shrink
// past this as "the keyboard is open" rather than a real resize/rotation.
const KEYBOARD_HEIGHT_THRESHOLD = 150

function TabLink({
  href,
  label,
  icon: Icon,
  dataTour,
  active,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  dataTour: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      data-tour={dataTour}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-xs font-medium',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  )
}

/**
 * Below `lg`, this is primary navigation (the sidebar becomes desktop-only).
 * Real <Link> anchors for every slot but the center action and More, so
 * existing walkthrough selectors (`nav a[href="..."]`) keep matching on
 * mobile without changes. The center action ports the retired quick-log
 * FAB's exact role logic and tour id (`quick-session-fab`) so the
 * "Log a Session" tour keeps working unchanged.
 */
export function MobileTabBar() {
  const pathname = usePathname()
  const { can, isContractor } = useOrganization()
  const isMobile = useIsMobile()
  const hydrated = useHydrated()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  // Only attached on mobile — desktop never needs it (the bar is lg:hidden
  // there regardless of this listener).
  useEffect(() => {
    if (!isMobile) return
    const vv = window.visualViewport
    if (!vv) return
    function onResize() {
      setKeyboardOpen(window.innerHeight - vv!.height > KEYBOARD_HEIGHT_THRESHOLD)
    }
    onResize()
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [isMobile])

  // Everyone with session:view-all (admin/owner/developer) gets Billing;
  // the only role without it is contractor, which gets Earnings instead —
  // mirrors sidebar.tsx's ownerOnly/contractorOnly split for these two items.
  const showBilling = can('session:view-all')
  const showEarnings = !showBilling && isContractor

  function openMoreSheet() {
    window.dispatchEvent(new CustomEvent('mca:open-more-sheet'))
  }

  // Post-hydration, unmount entirely on desktop instead of relying on
  // lg:hidden alone: CSS-hidden tab labels still resolve in the DOM, which
  // breaks strict-mode test locators and leaves duplicate nav text for any
  // tooling that reads the tree. The lg:hidden class still covers the
  // pre-hydration paint (SSR renders the bar; desktop CSS hides it).
  if (hydrated && !isMobile) return null

  return (
    <nav
      aria-label="Primary"
      data-tour="mobile-tab-bar"
      className={cn(
        'lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]',
        keyboardOpen && 'hidden'
      )}
    >
      <div className="flex h-16 items-stretch px-1">
        <TabLink
          href="/dashboard/"
          label="Home"
          icon={LayoutDashboard}
          dataTour="tab-home"
          active={pathname.startsWith('/dashboard/')}
        />
        <TabLink
          href="/sessions/"
          label="Sessions"
          icon={Calendar}
          dataTour="tab-sessions"
          active={pathname.startsWith('/sessions/')}
        />

        <div className="flex flex-1 items-center justify-center">
          {isContractor ? (
            <>
              <Button
                size="lg"
                data-tour="quick-session-fab"
                aria-label="Log new session"
                onClick={() => setDrawerOpen(true)}
                className="-mt-3 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
              >
                <Plus className="h-6 w-6" />
              </Button>
              <QuickLogDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
            </>
          ) : (
            <Link href="/sessions/new/" aria-label="Log new session">
              <Button
                size="lg"
                data-tour="quick-session-fab"
                className="-mt-3 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </Link>
          )}
        </div>

        {showBilling && (
          <TabLink
            href="/invoices/"
            label="Billing"
            icon={FileText}
            dataTour="tab-billing"
            active={pathname.startsWith('/invoices/')}
          />
        )}
        {showEarnings && (
          <TabLink
            href="/earnings/"
            label="Earnings"
            icon={DollarSign}
            dataTour="tab-earnings"
            active={pathname.startsWith('/earnings/')}
          />
        )}
        {!showBilling && !showEarnings && <div className="flex-1" aria-hidden="true" />}

        <button
          type="button"
          data-tour="tab-more"
          aria-label="More"
          onClick={openMoreSheet}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-xs font-medium text-muted-foreground"
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  )
}
