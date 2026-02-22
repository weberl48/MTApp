'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrganization } from '@/contexts/organization-context'
import {
  User,
  Building2,
  Settings2,
  History,
  Sliders,
  Loader2,
} from 'lucide-react'
import { SquareStatusBadge } from '@/components/square/status-badge'

interface SettingsCard {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
  ownerOnly?: boolean
}

const settingsCards: SettingsCard[] = [
  {
    title: 'Profile & Security',
    description: 'Your name, phone, MFA, and account details',
    href: '/settings/profile/',
    icon: User,
  },
  {
    title: 'Practice & Branding',
    description: 'Organization info, logo, colors, and social media',
    href: '/settings/practice/',
    icon: Building2,
    ownerOnly: true,
  },
  {
    title: 'Business Rules',
    description: 'Services, invoicing, sessions, notifications, and features',
    href: '/settings/business/',
    icon: Settings2,
    adminOnly: true,
  },
  {
    title: 'Customize & Automate',
    description: 'Custom lists, labels, and workflow automation',
    href: '/settings/customize/',
    icon: Sliders,
    ownerOnly: true,
  },
  {
    title: 'Audit Log',
    description: 'Track all changes for compliance',
    href: '/settings/audit/',
    icon: History,
    ownerOnly: true,
  },
]

export default function SettingsPage() {
  const { organization, user, can } = useOrganization()
  const isOwner = can('settings:edit')
  const isAdmin = can('session:view-all')

  if (!organization || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const visibleCards = settingsCards.filter((card) => {
    if (card.ownerOnly) return isOwner
    if (card.adminOnly) return isAdmin
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          {isOwner && <SquareStatusBadge />}
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          {isOwner
            ? 'Manage your organization and configure the application'
            : isAdmin
            ? 'Configure application settings'
            : 'Manage your profile'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <card.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
