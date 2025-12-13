'use client'

import { useMemo, useState } from 'react'
import { Users, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type ClientMultiSelectOption = {
  id: string
  name: string
}

interface ClientMultiSelectProps {
  clients: ClientMultiSelectOption[]
  selectedIds: string[]
  onChange: (nextSelected: string[]) => void
  disabled?: boolean
}

export function ClientMultiSelect({ clients, selectedIds, onChange, disabled }: ClientMultiSelectProps) {
  const [query, setQuery] = useState('')

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) => c.name.toLowerCase().includes(q))
  }, [clients, query])

  function setClientChecked(clientId: string, checked: boolean) {
    if (checked) {
      if (!selectedSet.has(clientId)) onChange([...selectedIds, clientId])
      return
    }
    if (selectedSet.has(clientId)) onChange(selectedIds.filter((id) => id !== clientId))
  }

  function toggleClient(clientId: string) {
    setClientChecked(clientId, !selectedSet.has(clientId))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled} className="w-full justify-between">
          <span className="truncate">
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select clients...'}
          </span>
          <Users className="w-4 h-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[var(--radix-popover-trigger-width)] p-3">
        <div className="space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients..."
            aria-label="Search clients"
          />

          <div className="max-h-64 overflow-auto rounded-md border">
            {filteredClients.length > 0 ? (
              <div className="divide-y">
                {filteredClients.map((client) => {
                  const checked = selectedSet.has(client.id)

                  return (
                    <div
                      key={client.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleClient(client.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleClient(client.id)
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 text-sm cursor-pointer select-none',
                        'hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={(next) => setClientChecked(client.id, next === true)}
                        aria-label={`Select ${client.name}`}
                      />
                      <span className="flex-1 truncate">{client.name}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No clients match your search.</div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setQuery('')}
              disabled={!query}
              className="h-8 px-2"
            >
              Clear search
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              disabled={selectedIds.length === 0}
              className="h-8 px-2"
            >
              <X className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

