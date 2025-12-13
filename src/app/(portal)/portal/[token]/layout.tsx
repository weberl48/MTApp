'use client'

import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PortalProvider, usePortal } from '@/contexts/portal-context'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar, FileText, Target, Home, AlertCircle } from 'lucide-react'

function PortalNav() {
  const { token } = usePortal()
  const pathname = usePathname()

  const navItems = [
    { href: `/portal/${token}`, label: 'Home', icon: Home, exact: true },
    { href: `/portal/${token}/sessions`, label: 'Sessions', icon: Calendar },
    { href: `/portal/${token}/resources`, label: 'Resources', icon: FileText },
    { href: `/portal/${token}/goals`, label: 'Goals', icon: Target },
  ]

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)

        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}

function PortalHeader() {
  const { client, organization } = usePortal()

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {organization?.logo_url ? (
              <Image
                src={organization.logo_url}
                alt={organization.name || 'Organization logo'}
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: organization?.primary_color || '#3b82f6' }}
              >
                {organization?.name?.charAt(0) || 'P'}
              </div>
            )}
            <div>
              <h1 className="font-semibold text-lg">{organization?.name || 'Client Portal'}</h1>
              <p className="text-sm text-gray-500">Welcome, {client?.name}</p>
            </div>
          </div>
        </div>
        <PortalNav />
      </div>
    </header>
  )
}

function PortalContent({ children }: { children: React.ReactNode }) {
  const { loading, error, isValid } = usePortal()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading your portal...</p>
        </div>
      </div>
    )
  }

  if (error || !isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Access Link Expired
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'This portal link is no longer valid.'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please request a new link by entering your email below, or contact your therapist.
          </p>
          <Button onClick={() => router.push('/portal/')} className="w-full">
            Request New Link
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

export default function PortalTokenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const token = params.token as string

  return (
    <PortalProvider token={token}>
      <PortalContent>{children}</PortalContent>
    </PortalProvider>
  )
}
