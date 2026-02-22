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
import { useState } from 'react'
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

export function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const { can, user, feature } = useOrganization()

  const isContractor = user?.role === 'contractor'

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
    if (item.ownerOnly) {
      if (item.href === '/payments') return can('payments:view')
      if (item.href === '/analytics') return can('analytics:view')
      return can('settings:edit')
    }
    // Admin-only items: show to admin, owner, developer
    if (item.adminOnly) {
      if (item.href === '/team') return can('team:view')
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

      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name)}
            aria-expanded={isExpanded}
            className={cn(
              'flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              isActive
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
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
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children!.filter(shouldShowItem).map((child) => {
                const childActive = pathname.startsWith(child.href)
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors',
                      childActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    )}
                  >
                    <child.icon className="w-4 h-4 mr-3" />
                    {child.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    const isActive = pathname.startsWith(item.href)
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          isActive
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        )}
      >
        <item.icon className="w-5 h-5 mr-3" />
        {item.name}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-[calc(env(safe-area-inset-top)+1rem)] left-[calc(env(safe-area-inset-left)+1rem)] z-50">
        <Button
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
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-800">
            <Link href="/dashboard/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                MCA
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                Manager
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav aria-label="Main navigation" className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map(renderNavItem)}
          </nav>

          {/* Help link */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/help/"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                pathname.startsWith('/help')
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
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
