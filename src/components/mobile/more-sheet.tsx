'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import {
  Users,
  UsersRound,
  BarChart3,
  Wallet,
  Settings,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/contexts/organization-context'
import { useAiHelpVisible } from '@/components/help/ai-chat'
import { AiChatSheet } from '@/components/help/ai-chat-bubble'

type NavRow = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

type ClientOption = { id: string; name: string }

/**
 * Below `lg`, the sidebar retires — Clients/Team/Analytics/Payroll/Settings/
 * Help live here instead, opened by the tab bar's More button. Role
 * predicates are copied verbatim from `sidebar.tsx`'s `shouldShowItem` so a
 * mobile user sees exactly the same section list a desktop user would.
 */
export function MoreSheet() {
  const router = useRouter()
  const { can, feature, actualRole } = useOrganization()
  const aiHelpVisible = useAiHelpVisible()

  const [open, setOpen] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [portalPickerOpen, setPortalPickerOpen] = useState(false)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [openingPortalFor, setOpeningPortalFor] = useState<string | null>(null)

  // Developer-only, same as the header's Client Portal preview.
  const showDevOnlyTools = actualRole === 'developer'

  useEffect(() => {
    if (!showDevOnlyTools) return
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('clients').select('id, name').order('name')
      if (!cancelled && data) setClients(data)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [showDevOnlyTools])

  useEffect(() => {
    function onOpenMoreSheet(e: Event) {
      const detail = (e as CustomEvent<{ open?: boolean }>).detail
      setOpen(detail?.open !== false)
    }
    window.addEventListener('mca:open-more-sheet', onOpenMoreSheet)
    return () => window.removeEventListener('mca:open-more-sheet', onOpenMoreSheet)
  }, [])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setPortalPickerOpen(false)
  }

  function handleNavigate() {
    setOpen(false)
    setPortalPickerOpen(false)
  }

  function handleOpenAiChat() {
    setOpen(false)
    setAiChatOpen(true)
  }

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
      handleNavigate()
    }
  }

  const items: NavRow[] = (
    [
      can('session:view-all') && { name: 'Clients', href: '/clients/', icon: Users },
      can('team:view') && { name: 'Team', href: '/team/', icon: UsersRound },
      can('analytics:view') && { name: 'Analytics', href: '/analytics/', icon: BarChart3 },
      can('payments:view') && { name: 'Payroll', href: '/payments/', icon: Wallet },
      { name: 'Settings', href: '/settings/', icon: Settings },
      { name: 'Help', href: '/help/', icon: HelpCircle },
    ] as (NavRow | false)[]
  ).filter((item): item is NavRow => !!item)

  const showPortalPreview = showDevOnlyTools && clients.length > 0 && feature('client_portal')

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
          <DrawerHeader>
            <DrawerTitle>{portalPickerOpen ? 'Client Portal' : 'More'}</DrawerTitle>
            <DrawerDescription>
              {portalPickerOpen ? 'Pick a client to preview their portal.' : 'More sections and tools.'}
            </DrawerDescription>
          </DrawerHeader>

          {portalPickerOpen ? (
            <div className="px-2 pb-4">
              <button
                type="button"
                onClick={() => setPortalPickerOpen(false)}
                className="flex items-center gap-1.5 px-2 py-2 text-sm text-muted-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <div className="max-h-[50vh] overflow-y-auto">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={openingPortalFor === c.id}
                    onClick={() => openClientPortal(c.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-md p-3 text-left hover:bg-muted"
                  >
                    <span className="truncate text-sm font-medium text-foreground">{c.name}</span>
                    {openingPortalFor === c.id && (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <nav aria-label="More navigation" className="flex flex-col gap-1 px-2 pb-2">
                {items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleNavigate}
                    className="flex items-center gap-3 rounded-md p-3 text-foreground hover:bg-muted"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>

              {(aiHelpVisible || showPortalPreview) && (
                <div className="flex flex-col gap-1 border-t border-border px-2 py-2">
                  {aiHelpVisible && (
                    <button
                      type="button"
                      onClick={handleOpenAiChat}
                      className="flex items-center gap-3 rounded-md p-3 text-left text-foreground hover:bg-muted"
                    >
                      <Sparkles className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">Ask the AI helper</span>
                    </button>
                  )}
                  {showPortalPreview && (
                    <button
                      type="button"
                      onClick={() => setPortalPickerOpen(true)}
                      className="flex items-center justify-between gap-3 rounded-md p-3 text-left text-foreground hover:bg-muted"
                    >
                      <span className="flex items-center gap-3">
                        <ExternalLink className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">Client Portal</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </DrawerContent>
      </Drawer>
      <AiChatSheet open={aiChatOpen} onOpenChange={setAiChatOpen} />
    </>
  )
}
