'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Bug, Check, LogOut, User as UserIcon, Settings, Building2, ChevronDown, ChevronLeft, ChevronRight, Code2, Eye, Users, ExternalLink, HelpCircle, Palette } from 'lucide-react'
import { useOrganization } from '@/contexts/organization-context'
import { useHydrated, useIsMobile } from '@/lib/hooks/use-is-mobile'
import { AppearanceMenu, AppearanceMenuContent } from '@/components/ui/appearance-menu'
import { BugReportDialog } from '@/components/bug-report/bug-report-dialog'
import { cn } from '@/lib/utils'
import type { User } from '@/types/database'

interface HeaderProps {
  user: User | null
}

interface ContractorOption {
  id: string
  name: string
  email: string
}

interface ClientOption {
  id: string
  name: string
}

const roleLabels: Record<string, string> = {
  developer: 'Developer',
  owner: 'Owner',
  admin: 'Admin',
  contractor: 'Contractor',
}

// Mobile header title, longest-prefix match against the current pathname.
// Home is special-cased to the logo instead of a title (see JSX below).
const ROUTE_TITLES: Array<[prefix: string, title: string]> = [
  ['/sessions', 'Sessions'],
  ['/invoices', 'Invoices'],
  ['/clients', 'Clients'],
  ['/team', 'Team'],
  ['/payments', 'Payroll'],
  ['/analytics', 'Analytics'],
  ['/settings', 'Settings'],
  ['/earnings', 'Earnings'],
  ['/help', 'Help'],
]

function routeTitle(pathname: string): string {
  let best: [string, string] | null = null
  for (const entry of ROUTE_TITLES) {
    if (pathname.startsWith(entry[0]) && (!best || entry[0].length > best[0].length)) {
      best = entry
    }
  }
  return best?.[1] ?? 'MCA'
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const {
    organization,
    actualRole,
    viewAsRole,
    setViewAsRole,
    viewAsContractor,
    setViewAsContractor,
    allOrganizations,
    switchOrganization,
    feature
  } = useOrganization()

  const [contractors, setContractors] = useState<ContractorOption[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [openingPortalFor, setOpeningPortalFor] = useState<string | null>(null)
  // Mobile avatar menu drill-in: which "page" the panel is showing. Radix
  // submenus open sideways and clip off-screen on phones, so below lg the
  // former submenus render as in-place pages instead (reachable only via
  // lg:hidden rows — desktop never leaves 'root').
  const [menuPage, setMenuPage] = useState<'root' | 'org' | 'viewAs' | 'portal' | 'appearance'>('root')
  const [bugReportOpen, setBugReportOpen] = useState(false)

  /**
   * Mint a fresh portal token for this client and open it.
   *
   * Tokens are stored hashed, so there is no existing token to look up — the raw
   * value only exists at the moment it is created. This goes through the staff
   * API, which re-checks the caller's role and org server-side; the browser
   * never sees any other client's credential.
   */
  async function openClientPortal(clientId: string) {
    setOpeningPortalFor(clientId)
    try {
      const res = await fetch(`/api/clients/${clientId}/access-token/`, { method: 'POST' })
      if (!res.ok) {
        router.push(`/clients/${clientId}/`)
        return
      }
      const { portalUrl } = (await res.json()) as { portalUrl?: string }
      if (portalUrl) window.open(portalUrl, '_blank', 'noopener,noreferrer')
      else router.push(`/clients/${clientId}/`)
    } catch {
      router.push(`/clients/${clientId}/`)
    } finally {
      setOpeningPortalFor(null)
    }
  }

  // Show view-as tools for developers and owners
  const showViewAsTools = actualRole === 'developer' || actualRole === 'owner'
  // Only developers can switch organizations and preview client portals
  const showDevOnlyTools = actualRole === 'developer'
  const viewingAsSomeoneElse = !!viewAsRole || !!viewAsContractor

  // Fetch contractors and clients for view-as tools
  useEffect(() => {
    if (!showViewAsTools) return

    async function fetchDevData() {
      // Fetch contractors
      const { data: contractorData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('role', ['contractor', 'admin'])
        .order('name')

      if (contractorData) {
        setContractors(contractorData)
      }

      // Clients only — deliberately NOT their portal tokens.
      //
      // This used to select client_access_tokens(token, ...), which pulled every
      // client's raw portal bearer credential into the browser just to decide
      // whether to show a "Has Token" badge. Tokens are now stored hashed and are
      // unrecoverable by design, so the preview mints one on demand instead
      // (see openClientPortal below).
      //
      // The old query also filtered on `is_active`, a column this table does not
      // have — so it errored and every client silently showed "No Token".
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, name')
        .order('name')

      if (clientData) {
        setClients(clientData.map((client) => ({ id: client.id, name: client.name })))
      }
    }

    fetchDevData()
  }, [showViewAsTools, supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login/')
    router.refresh()
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  // Post-hydration gate for the mobile-only title block: lg:hidden keeps the
  // pre-hydration paint right, but a CSS-hidden <h1> still resolves in the
  // DOM and collides with strict-mode test locators on desktop.
  const isMobile = useIsMobile()
  const hydrated = useHydrated()
  const showMobileChrome = !hydrated || isMobile

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] px-3 sm:px-6 bg-card/95 backdrop-blur border-b border-border lg:pl-6">
      {/* Mobile: page title (logo on Home). Desktop: dev badge, org switcher,
          View As, and Client Portal preview — unchanged from before. */}
      <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-4">
        {showMobileChrome && (
          <div className="lg:hidden min-w-0">
            {pathname.startsWith('/dashboard/') ? (
              <span className="text-base font-bold text-foreground">MCA</span>
            ) : (
              <h1 className="truncate text-base font-semibold text-foreground">{routeTitle(pathname)}</h1>
            )}
          </div>
        )}

        {/* Developer-only badge and org switcher */}
        {showDevOnlyTools && (
          <div className="hidden lg:flex items-center gap-2 sm:gap-4">
            <Badge
              variant="outline"
              className="shrink-0 bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700"
            >
              <Code2 className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Developer</span>
            </Badge>

            {/* Organization Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 px-2 sm:px-3 min-w-0"
                  aria-label={`Switch organization (current: ${organization?.name || 'none'})`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline max-w-[150px] truncate">
                    {organization?.name || 'Select Org'}
                  </span>
                  <ChevronDown className="hidden sm:inline w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                  {allOrganizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => switchOrganization(org.id)}
                      className={org.id === organization?.id ? 'bg-accent' : ''}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{org.name}</span>
                        <span className="text-xs text-gray-500">{org.slug}</span>
                      </div>
                      {org.id === organization?.id && <Check className="ml-auto h-4 w-4 shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* View As Role Switcher - available to developers and owners */}
        {showViewAsTools && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-tour="view-as-switcher"
                  variant={viewAsRole || viewAsContractor ? 'default' : 'outline'}
                  size="sm"
                  className={`hidden lg:flex items-center gap-2 px-2 sm:px-3 min-w-0 ${viewAsRole || viewAsContractor ? 'bg-warning text-warning-foreground hover:bg-warning/90' : ''}`}
                  aria-label={
                    viewAsContractor
                      ? `Viewing as ${viewAsContractor.name} — change role view`
                      : viewAsRole
                        ? `Viewing as ${roleLabels[viewAsRole]} — change role view`
                        : 'View app as another role'
                  }
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline max-w-[150px] truncate">
                    {viewAsContractor
                      ? `As ${viewAsContractor.name}`
                      : viewAsRole
                        ? `As ${roleLabels[viewAsRole]}`
                        : 'View As'}
                  </span>
                  <ChevronDown className="hidden sm:inline w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>View As Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setViewAsRole(null)
                    setViewAsContractor(null)
                  }}
                  className={!viewAsRole && !viewAsContractor ? 'bg-accent' : ''}
                >
                  <span className="font-medium">{actualRole === 'developer' ? 'Developer' : 'Owner'} (actual)</span>
                  {!viewAsRole && !viewAsContractor && <Check className="ml-auto h-4 w-4 shrink-0" />}
                </DropdownMenuItem>
                {actualRole === 'developer' && (
                  <DropdownMenuItem
                    onClick={() => {
                      setViewAsRole('owner')
                      setViewAsContractor(null)
                    }}
                    className={viewAsRole === 'owner' && !viewAsContractor ? 'bg-accent' : ''}
                  >
                    <span className="font-medium">Owner</span>
                    {viewAsRole === 'owner' && !viewAsContractor && <Check className="ml-auto h-4 w-4 shrink-0" />}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    setViewAsRole('admin')
                    setViewAsContractor(null)
                  }}
                  className={viewAsRole === 'admin' && !viewAsContractor ? 'bg-accent' : ''}
                >
                  <span className="font-medium">Admin</span>
                  {viewAsRole === 'admin' && !viewAsContractor && <Check className="ml-auto h-4 w-4 shrink-0" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setViewAsRole('contractor')
                    setViewAsContractor(null)
                  }}
                  className={viewAsRole === 'contractor' && !viewAsContractor ? 'bg-accent' : ''}
                >
                  <span className="font-medium">Contractor (generic)</span>
                  {viewAsRole === 'contractor' && !viewAsContractor && <Check className="ml-auto h-4 w-4 shrink-0" />}
                </DropdownMenuItem>

                {contractors.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Users className="w-4 h-4 mr-2" />
                        <span>Specific Contractor</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                          {contractors.map((contractor) => (
                            <DropdownMenuItem
                              key={contractor.id}
                              onClick={() => {
                                setViewAsRole('contractor')
                                setViewAsContractor(contractor)
                              }}
                              className={viewAsContractor?.id === contractor.id ? 'bg-accent' : ''}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{contractor.name}</span>
                                <span className="text-xs text-gray-500">{contractor.email}</span>
                              </div>
                              {viewAsContractor?.id === contractor.id && <Check className="ml-auto h-4 w-4 shrink-0" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
        )}

        {/* Client Portal Preview - Developer only, hidden when portal feature is disabled */}
        {showDevOnlyTools && clients.length > 0 && feature('client_portal') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* aria-label: the text span is display-hidden below `sm`, which left an
                  unnamed icon button for screen readers on mobile */}
              <Button
                variant="outline"
                size="sm"
                aria-label="Client Portal"
                className="hidden lg:flex items-center gap-2 px-2 sm:px-3"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Client Portal</span>
                <ChevronDown className="hidden sm:inline w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 max-h-[400px] overflow-y-auto" align="start">
              <DropdownMenuLabel>Preview Client Portal</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {clients.map((client) => (
                <DropdownMenuItem
                  key={client.id}
                  disabled={openingPortalFor === client.id}
                  onClick={() => openClientPortal(client.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium truncate">{client.name}</span>
                    {openingPortalFor === client.id && (
                      <Badge variant="secondary" className="ml-2 text-xs">Opening…</Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Appearance: light/dark mode + theme picker — desktop only; mobile
          reaches it through the avatar menu's Appearance submenu below. */}
      <div className="hidden lg:flex">
        <AppearanceMenu />
      </div>

      {/* User menu */}
      <DropdownMenu onOpenChange={(open) => { if (!open) setMenuPage('root') }}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Account menu">
            <Avatar
              className={cn(
                'h-10 w-10',
                // View As has no button of its own on mobile (it moves into this
                // menu below), so the ring is how simulation stays visible there.
                // lg:ring-0 cancels it on desktop, where the header's own View As
                // button already shows the state — keeps desktop byte-identical.
                viewingAsSomeoneElse && 'ring-2 ring-warning ring-offset-2 ring-offset-background lg:ring-0 lg:ring-offset-0'
              )}
            >
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn('max-w-[calc(100vw-1rem)]', menuPage === 'appearance' ? 'w-72' : 'w-56')}
          align="end"
        >
          {menuPage !== 'root' && (
            <>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setMenuPage('root') }}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {menuPage === 'org' && (
            <div className="max-h-[300px] overflow-y-auto">
              {allOrganizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => switchOrganization(org.id)}
                  className={org.id === organization?.id ? 'bg-accent' : ''}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{org.name}</span>
                    <span className="text-xs text-muted-foreground">{org.slug}</span>
                  </div>
                  {org.id === organization?.id && <Check className="ml-auto h-4 w-4 shrink-0" />}
                </DropdownMenuItem>
              ))}
            </div>
          )}

          {menuPage === 'viewAs' && (
            <div className="max-h-[300px] overflow-y-auto">
              <DropdownMenuItem
                onClick={() => {
                  setViewAsRole(null)
                  setViewAsContractor(null)
                }}
                className={!viewAsRole && !viewAsContractor ? 'bg-accent' : ''}
              >
                <span className="font-medium">{actualRole === 'developer' ? 'Developer' : 'Owner'} (actual)</span>
                {!viewAsRole && !viewAsContractor && <Check className="ml-auto h-4 w-4 shrink-0" />}
              </DropdownMenuItem>
              {actualRole === 'developer' && (
                <DropdownMenuItem
                  onClick={() => {
                    setViewAsRole('owner')
                    setViewAsContractor(null)
                  }}
                  className={viewAsRole === 'owner' && !viewAsContractor ? 'bg-accent' : ''}
                >
                  <span className="font-medium">Owner</span>
                  {viewAsRole === 'owner' && !viewAsContractor && <Check className="ml-auto h-4 w-4 shrink-0" />}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  setViewAsRole('admin')
                  setViewAsContractor(null)
                }}
                className={viewAsRole === 'admin' && !viewAsContractor ? 'bg-accent' : ''}
              >
                <span className="font-medium">Admin</span>
                {viewAsRole === 'admin' && !viewAsContractor && <Check className="ml-auto h-4 w-4 shrink-0" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setViewAsRole('contractor')
                  setViewAsContractor(null)
                }}
                className={viewAsRole === 'contractor' && !viewAsContractor ? 'bg-accent' : ''}
              >
                <span className="font-medium">Contractor (generic)</span>
                {viewAsRole === 'contractor' && !viewAsContractor && <Check className="ml-auto h-4 w-4 shrink-0" />}
              </DropdownMenuItem>
              {contractors.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Specific Contractor
                  </DropdownMenuLabel>
                  {contractors.map((contractor) => (
                    <DropdownMenuItem
                      key={contractor.id}
                      onClick={() => {
                        setViewAsRole('contractor')
                        setViewAsContractor(contractor)
                      }}
                      className={viewAsContractor?.id === contractor.id ? 'bg-accent' : ''}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{contractor.name}</span>
                        <span className="text-xs text-muted-foreground">{contractor.email}</span>
                      </div>
                      {viewAsContractor?.id === contractor.id && <Check className="ml-auto h-4 w-4 shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </div>
          )}

          {menuPage === 'portal' && (
            <div className="max-h-[300px] overflow-y-auto">
              {clients.map((client) => (
                <DropdownMenuItem
                  key={client.id}
                  disabled={openingPortalFor === client.id}
                  onClick={() => openClientPortal(client.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium truncate">{client.name}</span>
                    {openingPortalFor === client.id && (
                      <Badge variant="secondary" className="ml-2 text-xs">Opening…</Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}

          {menuPage === 'appearance' && (
            <div className="p-2 pt-1">
              <AppearanceMenuContent />
            </div>
          )}

          {menuPage === 'root' && (
            <>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role || 'contractor'}
                  </p>
                </div>
              </DropdownMenuLabel>

              {/* Mobile-only: everything the desktop header row carries next to the
                  avatar (org switcher, View As, Client Portal preview, Appearance)
                  moves in here below `lg`, where that row doesn't render — as
                  drill-in rows that swap this panel's content in place. */}
              {(showDevOnlyTools || showViewAsTools) && <DropdownMenuSeparator className="lg:hidden" />}

              {showDevOnlyTools && allOrganizations.length > 1 && (
                <DropdownMenuItem
                  className="lg:hidden"
                  onSelect={(e) => { e.preventDefault(); setMenuPage('org') }}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  <span className="truncate">{organization?.name || 'Switch Organization'}</span>
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
                </DropdownMenuItem>
              )}

              {showViewAsTools && (
                /* data-tour matches the desktop button's id too (comma-fallback
                   selector in the View As walkthrough): the mobile equivalent
                   entry point, revealed once the account menu is opened via
                   that step's preClick. */
                <DropdownMenuItem
                  data-tour="view-as-switcher"
                  className="lg:hidden"
                  onSelect={(e) => { e.preventDefault(); setMenuPage('viewAs') }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  <span className="truncate">
                    {viewAsContractor
                      ? `As ${viewAsContractor.name}`
                      : viewAsRole
                        ? `As ${roleLabels[viewAsRole]}`
                        : 'View As'}
                  </span>
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
                </DropdownMenuItem>
              )}

              {showDevOnlyTools && clients.length > 0 && feature('client_portal') && (
                <DropdownMenuItem
                  className="lg:hidden"
                  onSelect={(e) => { e.preventDefault(); setMenuPage('portal') }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <span>Client Portal</span>
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className="lg:hidden"
                onSelect={(e) => { e.preventDefault(); setMenuPage('appearance') }}
              >
                <Palette className="w-4 h-4 mr-2" />
                <span>Appearance</span>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings/')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/profile/')}>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/help/')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBugReportOpen(true)}>
                <Bug className="mr-2 h-4 w-4" />
                Report a Bug
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Lives outside the menu so closing the menu doesn't unmount the dialog
          mid-submit. */}
      <BugReportDialog open={bugReportOpen} onOpenChange={setBugReportOpen} />
    </header>
  )
}
