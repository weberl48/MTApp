'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

interface ClassroomsByClientEditorProps {
  organizationId: string
  value: Record<string, string[]>
  onChange: (next: Record<string, string[]>) => void
}

/**
 * Per-agency classroom/program lists (settings.custom_lists.classrooms_by_client).
 *
 * Each row maps a billed client/agency (e.g. NTLC, OP Schools, People Inc, OLV)
 * to its own comma-separated list of classrooms / day-hab programs / group homes.
 * When a session's Bill To client has a list here, the session form shows it as
 * the classroom dropdown — for any payment type, not just scholarship groups.
 */
export function ClassroomsByClientEditor({ organizationId, value, onChange }: ClassroomsByClientEditorProps) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('clients')
      .select('id, name')
      .eq('organization_id', organizationId)
      .order('name')
      .then(({ data }) => setClients(data || []))
  }, [organizationId])

  const entries = Object.entries(value)
  const usedIds = new Set(entries.map(([id]) => id))
  const availableClients = clients.filter((c) => !usedIds.has(c.id))
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name || 'Unknown client'

  function setList(clientId: string, raw: string) {
    onChange({
      ...value,
      [clientId]: raw.split(',').map((v) => v.trim()).filter(Boolean),
    })
  }

  function removeEntry(clientId: string) {
    const next = { ...value }
    delete next[clientId]
    onChange(next)
  }

  function addEntry(clientId: string) {
    onChange({ ...value, [clientId]: [] })
  }

  return (
    <div className="space-y-3">
      {entries.map(([clientId, list]) => (
        <div key={clientId} className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor={`classrooms-${clientId}`}>{clientName(clientId)}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Remove classroom list for ${clientName(clientId)}`}
              onClick={() => removeEntry(clientId)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <Input
            id={`classrooms-${clientId}`}
            defaultValue={list.join(', ')}
            onBlur={(e) => setList(clientId, e.target.value)}
            placeholder="Room 101, Blue Room, Day Hab East"
          />
        </div>
      ))}

      {availableClients.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value="" onValueChange={addEntry}>
            <SelectTrigger className="w-full sm:w-72" aria-label="Add classroom list for a client or agency">
              <SelectValue placeholder="Add a list for a client / agency…" />
            </SelectTrigger>
            <SelectContent>
              {availableClients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <Plus className="w-3 h-3" />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <p className="text-xs text-gray-500">
        When a session is billed to one of these clients/agencies, contractors pick from that
        agency&apos;s own classroom or program list. Agencies without a list here fall back to the
        general classroom options above (scholarship group sessions only).
      </p>
    </div>
  )
}
