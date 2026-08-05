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
  Wallet,
  UsersRound,
  DollarSign,
  BarChart3,
  ChevronRight,
  HelpCircle,
} from 'lucide-react'
import { useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { useHydrated, useIsMobile } from '@/lib/hooks/use-is-mobile'
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

/**
 * Desktop-only primary navigation (`hidden lg:flex`). Below `lg` the tab
 * bar (`src/components/mobile/tab-bar.tsx`) and its More sheet
 * (`src/components/mobile/more-sheet.tsx`) replace this entirely — the
 * off-canvas drawer, hamburger button, backdrop, focus trap, and dialog
 * semantics that used to live here for mobile are retired along with it.
 */
export function Sidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const { can, feature, isContractor } = useOrganization()

  // Mirror of the tab bar's post-hydration gate: on mobile, unmount the
  // sidebar entirely instead of leaving CSS-hidden nav labels in the DOM
  // (they collide with strict-mode test locators). `hidden lg:flex` still
  // governs the pre-hydration paint.
  const isMobile = useIsMobile()
  const hydrated = useHydrated()

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

  if (hydrated && isMobile) return null

  return (
    <aside
      className="hidden lg:flex lg:flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
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
  )
}
