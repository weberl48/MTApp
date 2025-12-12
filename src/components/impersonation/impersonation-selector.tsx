'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useImpersonation } from '@/contexts/impersonation-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, User, Users, ChevronDown, ExternalLink, Loader2 } from 'lucide-react'

interface Contractor {
  id: string
  name: string
}

interface Client {
  id: string
  name: string
}

export function ImpersonationSelector() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [openingPortal, setOpeningPortal] = useState<string | null>(null)
  const {
    impersonatedContractor,
    setImpersonatedContractor,
    impersonatedClient,
    setImpersonatedClient,
    clearImpersonation,
    isImpersonating,
  } = useImpersonation()

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      const [contractorsResult, clientsResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, name')
          .eq('role', 'contractor')
          .order('name'),
        supabase
          .from('clients')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
          .limit(50),
      ])

      setContractors(contractorsResult.data || [])
      setClients(clientsResult.data || [])
      setLoading(false)
    }

    loadData()
  }, [])

  async function viewAsClient(client: Client) {
    setOpeningPortal(client.id)
    try {
      // Get or create a portal token for this client
      const response = await fetch(`/api/clients/${client.id}/access-token`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to get portal access')
      }

      const data = await response.json()

      // Open the portal in a new tab
      window.open(data.portalUrl, '_blank')

      // Also set in context so banner shows
      setImpersonatedClient({
        id: client.id,
        name: client.name,
        portalToken: data.token,
      })
    } catch (error) {
      console.error('Error opening client portal:', error)
    } finally {
      setOpeningPortal(null)
    }
  }

  if (loading) {
    return null
  }

  const hasContractors = contractors.length > 0
  const hasClients = clients.length > 0

  if (!hasContractors && !hasClients) {
    return null
  }

  const activeLabel = impersonatedContractor
    ? `Viewing as: ${impersonatedContractor.name}`
    : impersonatedClient
      ? `Viewing as: ${impersonatedClient.name}`
      : 'View As'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          {activeLabel}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isImpersonating && (
          <>
            <DropdownMenuItem onClick={clearImpersonation} className="text-amber-600">
              <User className="h-4 w-4 mr-2" />
              Exit View As Mode
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Contractors submenu */}
        {hasContractors && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <User className="h-4 w-4 mr-2" />
              View as Contractor
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
              {contractors.map((contractor) => (
                <DropdownMenuItem
                  key={contractor.id}
                  onClick={() => {
                    setImpersonatedClient(null)
                    setImpersonatedContractor(contractor)
                  }}
                  className={impersonatedContractor?.id === contractor.id ? 'bg-amber-50' : ''}
                >
                  {contractor.name}
                  {impersonatedContractor?.id === contractor.id && (
                    <span className="ml-auto text-xs text-amber-600">Active</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {/* Clients submenu */}
        {hasClients && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Users className="h-4 w-4 mr-2" />
              View as Client
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
              <DropdownMenuLabel className="text-xs text-gray-500">
                Opens client portal in new tab
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {clients.map((client) => (
                <DropdownMenuItem
                  key={client.id}
                  onClick={() => viewAsClient(client)}
                  disabled={openingPortal === client.id}
                  className={impersonatedClient?.id === client.id ? 'bg-amber-50' : ''}
                >
                  {openingPortal === client.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  {client.name}
                  {impersonatedClient?.id === client.id && (
                    <span className="ml-auto text-xs text-amber-600">Active</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
