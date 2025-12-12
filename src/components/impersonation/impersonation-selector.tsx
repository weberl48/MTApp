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
} from '@/components/ui/dropdown-menu'
import { Eye, User, ChevronDown } from 'lucide-react'

interface Contractor {
  id: string
  name: string
}

export function ImpersonationSelector() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const { impersonatedContractor, setImpersonatedContractor, clearImpersonation } = useImpersonation()

  useEffect(() => {
    async function loadContractors() {
      const supabase = createClient()

      const { data } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'contractor')
        .order('name')

      setContractors(data || [])
      setLoading(false)
    }

    loadContractors()
  }, [])

  if (loading || contractors.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          {impersonatedContractor ? (
            <>
              Viewing as: {impersonatedContractor.name}
            </>
          ) : (
            'View As'
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>View as Contractor</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {impersonatedContractor && (
          <>
            <DropdownMenuItem onClick={clearImpersonation} className="text-amber-600">
              <User className="h-4 w-4 mr-2" />
              Exit Impersonation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {contractors.map((contractor) => (
          <DropdownMenuItem
            key={contractor.id}
            onClick={() => setImpersonatedContractor(contractor)}
            className={impersonatedContractor?.id === contractor.id ? 'bg-amber-50' : ''}
          >
            <User className="h-4 w-4 mr-2" />
            {contractor.name}
            {impersonatedContractor?.id === contractor.id && (
              <span className="ml-auto text-xs text-amber-600">Active</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
