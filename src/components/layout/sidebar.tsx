'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  Wallet,
  UsersRound,
  DollarSign,
  BarChart3,
  ChevronRight,
  HelpCircle,
} from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { useOrganization } from '@/contexts/organization-context'
import type { FeatureFlags } from '@/types/database'

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean      // Visible to admin, owner, developer
  ownerOnly?: boolean      // Visible to owner, developer only (NOT admin)
  contractorOnly?: boolean // Visible to contractor only
  feature?: keyof FeatureFlags // Hide when this feature is disabled
  children?: NavItem[]     // Sub-navigation items
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/', icon: LayoutDashboard },
  { name: 'Sessions', href: '/sessions/', icon: Calendar },
  { name: 'Clients', href: '/clients/', icon: Users, adminOnly: true },
  {
    name: 'Billing',
    href: '/invoices/',
    icon: FileText,
    adminOnly: true,
    children: [
      { name: 'Invoices', href: '/invoices/', icon: FileText },
      { name: 'Payroll', href: '/payments/', icon: Wallet, ownerOnly: true },
    ],
  },
  { name: 'Analytics', href: '/analytics/', icon: BarChart3, ownerOnly: true },
  { name: 'Earnings', href: '/earnings/', icon: DollarSign, contractorOnly: true },
  { name: 'Team', href: '/team/', icon: UsersRound, adminOnly: true },
  { name: 'Settings', href: '/settings/', icon: Settings },
]

// Elements a focus trap should consider "tabbable" inside the drawer.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Below Tailwind's lg breakpoint the aside is an off-canvas drawer; at/above
// it, lg:translate-x-0 lg:static makes it always-visible nav (see the aside's
// className below). useSyncExternalStore (not useEffect+useState, per the
// house pattern in src/components/pwa/install-prompt.tsx) avoids a setState-
// in-effect lint warning and a hydration flash.
function getIsNarrowViewport(): boolean {
  return window.matchMedia('(max-width: 1023px)').matches
}
function subscribeToViewport(callback: () => void) {
  const mql = window.matchMedia('(max-width: 1023px)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

export function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const { can, feature, isContractor } = useOrganization()
  const asideRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  // mobileMenuOpen can only be set true from the (lg:hidden) hamburger button
  // or a viewport-gated walkthrough sync, but it can go stale if the window
  // is resized wider without closing the drawer first — so dialog semantics
  // and the focus trap key off isDrawerOpen, not mobileMenuOpen alone, to
  // keep desktop static nav from ever being announced or trapped as a modal.
  const isNarrowViewport = useSyncExternalStore(
    subscribeToViewport,
    getIsNarrowViewport,
    () => false // server snapshot: mobileMenuOpen starts false, so this never affects first paint
  )
  const isDrawerOpen = mobileMenuOpen && isNarrowViewport

  // WCAG 2.1.1: the mobile menu behaves as a dialog, so Escape must dismiss it
  useEffect(() => {
    if (!mobileMenuOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen])

  // Focus management for the mobile drawer: move focus in on open, trap Tab
  // inside while open, return focus to the hamburger button on close.
  useEffect(() => {
    if (!isDrawerOpen) return
    const aside = asideRef.current
    if (!aside) return

    function getFocusable(): HTMLElement[] {
      // Exclude anything inside a collapsed (inert) Billing submenu — inert
      // elements can't actually receive focus, so leaving them in would let
      // the trap's wraparound call .focus() on a dead end.
      return Array.from(aside!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null && !el.closest('[inert]')
      )
    }

    const focusable = getFocusable()
    ;(focusable[0] ?? aside).focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const items = getFocusable()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey) {
        if (active === first || !aside!.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !aside!.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    // Snapshot the trigger button now — by the time cleanup runs the ref
    // could in principle point elsewhere.
    const triggerToRestore = menuButtonRef.current
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      triggerToRestore?.focus()
    }
  }, [isDrawerOpen])

  // Walkthroughs highlight nav links; on mobile those live in this off-canvas
  // drawer, so the walkthrough provider asks us to open/close it per step.
  useEffect(() => {
    function onWalkthroughNav(e: Event) {
      const detail = (e as CustomEvent<{ open?: boolean }>).detail
      setMobileMenuOpen(!!detail?.open)
    }
    window.addEventListener('mca:walkthrough-nav', onWalkthroughNav)
    return () => window.removeEventListener('mca:walkthrough-nav', onWalkthroughNav)
  }, [])

  function shouldShowItem(item: NavItem): boolean {
    // Feature gate: hide if the feature is disabled
    if (item.feature && !feature(item.feature)) {
      return false
    }
    // Contractor-only items: show only to contractors
    if (item.contractorOnly) {
      return isContractor
    }
    // Owner-only items: show to owner and developer, NOT admin
    // (hrefs carry a trailing slash — next.config.ts sets trailingSlash: true)
    if (item.ownerOnly) {
      if (item.href === '/payments/') return can('payments:view')
      if (item.href === '/analytics/') return can('analytics:view')
      return can('settings:edit')
    }
    // Admin-only items: show to admin, owner, developer
    if (item.adminOnly) {
      if (item.href === '/team/') return can('team:view')
      return can('session:view-all')
    }
    // Default: show to everyone
    return true
  }

  // Filter navigation based on user role and feature flags
  const filteredNavigation = navigation.flatMap((item) => {
    if (!shouldShowItem(item)) return []
    // For items with children, filter children too
    if (item.children) {
      return [{ ...item, children: item.children.filter(shouldShowItem) }]
    }
    return [item]
  })

  // Auto-expand Billing when on a billing sub-route
  const isBillingActive = pathname.startsWith('/invoices') || pathname.startsWith('/payments')

  function toggleExpanded(name: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function renderNavItem(item: NavItem) {
    const hasChildren = item.children && item.children.length > 0

    if (hasChildren) {
      const isExpanded = expandedItems.has(item.name) || isBillingActive
      const isActive = item.children!.some((child) => pathname.startsWith(child.href))
      const submenuId = `nav-submenu-${item.name.toLowerCase().replace(/\s+/g, '-')}`

      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name)}
            aria-expanded={isExpanded}
            aria-controls={submenuId}
            data-tour={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            className={cn(
              'flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
            <ChevronRight
              className={cn(
                'w-4 h-4 ml-auto transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-[var(--motion-base)]',
              isExpanded ? 'grid-rows-[1fr] ease-out' : 'grid-rows-[0fr] ease-in'
            )}
          >
            <div id={submenuId} className="overflow-hidden">
              <div className="ml-4 mt-1 space-y-1" inert={!isExpanded}>
                {item.children!.filter(shouldShowItem).map((child) => {
                  const childActive = pathname.startsWith(child.href)
                  return (
                    <Link
                      key={child.name}
                      href={child.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={childActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors',
                        childActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <child.icon className="w-4 h-4 mr-3" />
                      {child.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )
    }

    const isActive = pathname.startsWith(item.href)
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <item.icon className="w-5 h-5 mr-3" />
        {item.name}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile menu button. Same z-50 as the aside normally (matches every
          other z-50 overlay in the app, e.g. ui/dialog.tsx's overlay) so it
          doesn't leak above unrelated dialogs; bumped to z-[60] only while
          the drawer itself is open, since the aside — same left edge, same
          top offset — would otherwise paint over its own close affordance.
          Nothing inside the drawer opens another dialog, so this never runs
          concurrently with one. */}
      <div
        className={cn(
          'lg:hidden fixed top-[calc(env(safe-area-inset-top)+1rem)] left-[calc(env(safe-area-inset-left)+1rem)] z-50',
          mobileMenuOpen && 'z-[60]'
        )}
      >
        <Button
          ref={menuButtonRef}
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu backdrop */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-[var(--motion-base)]',
          mobileMenuOpen ? 'opacity-100 ease-out' : 'opacity-0 pointer-events-none ease-in'
        )}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        ref={asideRef}
        tabIndex={-1}
        role={isDrawerOpen ? 'dialog' : undefined}
        aria-modal={isDrawerOpen ? true : undefined}
        aria-label={isDrawerOpen ? 'Navigation menu' : undefined}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transform transition-transform duration-[var(--motion-base)] lg:translate-x-0 lg:static lg:inset-auto',
          mobileMenuOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          {/* h-[4rem], not h-16: h-16 is calc(var(--spacing)*16) and would drift
              from the header's fixed 4rem under compact/airy theme densities */}
          <div className="flex items-center h-[4rem] px-6 border-b border-sidebar-border">
            <Link href="/dashboard/" className="flex items-center">
              <span className="text-xl font-bold text-sidebar-foreground">
                MCA
              </span>
              <span className="ml-2 text-sm text-sidebar-foreground/60">
                Manager
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav aria-label="Main navigation" className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map(renderNavItem)}
          </nav>

          {/* Help link */}
          <div className="px-4 py-3 border-t border-sidebar-border">
            <Link
              href="/help/"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={pathname.startsWith('/help') ? 'page' : undefined}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                pathname.startsWith('/help')
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <HelpCircle className="w-5 h-5 mr-3" />
              Help
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
