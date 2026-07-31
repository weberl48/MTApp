'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { DEFAULT_LOCATION_LABEL } from '@/types/database'
import type { ClientLocationConfig } from '@/types/database'

interface ClientLocationEditorProps {
  organizationId: string
  value: Record<string, ClientLocationConfig>
  onChange: (next: Record<string, ClientLocationConfig>) => void
}

/**
 * Per-client session-location config (settings.custom_lists.locations_by_client).
 *
 * Each row maps a billed client/agency to how contractors record where the session
 * happened. One shape covers every case:
 *  - options only            → a fixed dropdown (e.g. a school's classrooms)
 *  - options + free text     → dropdown with an "Other…" escape hatch
 *  - no options + free text  → a plain text box, for clients whose location varies
 *                              every session (e.g. self-directed agency clients)
 */
export function ClientLocationEditor({ organizationId, value, onChange }: ClientLocationEditorProps) {
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

  function update(clientId: string, patch: Partial<ClientLocationConfig>) {
    onChange({ ...value, [clientId]: { ...value[clientId], ...patch } })
  }

  function removeEntry(clientId: string) {
    const next = { ...value }
    delete next[clientId]
    onChange(next)
  }

  function addEntry(clientId: string) {
    onChange({
      ...value,
      [clientId]: { label: DEFAULT_LOCATION_LABEL, options: [], allow_other: true, required: true },
    })
  }

  return (
    <div className="space-y-4">
      {entries.map(([clientId, cfg]) => (
        <div key={clientId} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {clientName(clientId)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Remove location settings for ${clientName(clientId)}`}
              onClick={() => removeEntry(clientId)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`loc-label-${clientId}`}>Field label</Label>
              <Input
                id={`loc-label-${clientId}`}
                defaultValue={cfg.label}
                onBlur={(e) => update(clientId, { label: e.target.value.trim() || DEFAULT_LOCATION_LABEL })}
                placeholder="Classroom, Site, Location…"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`loc-options-${clientId}`}>Options</Label>
              <Input
                id={`loc-options-${clientId}`}
                defaultValue={cfg.options.join(', ')}
                onBlur={(e) =>
                  update(clientId, {
                    options: e.target.value.split(',').map((v) => v.trim()).filter(Boolean),
                  })
                }
                placeholder="Room 101, Blue Room, Day Hab East"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id={`loc-other-${clientId}`}
                checked={cfg.allow_other}
                onCheckedChange={(checked) => update(clientId, { allow_other: checked })}
              />
              <Label htmlFor={`loc-other-${clientId}`} className="font-normal">Allow free text</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`loc-required-${clientId}`}
                checked={cfg.required}
                onCheckedChange={(checked) => update(clientId, { required: checked })}
              />
              <Label htmlFor={`loc-required-${clientId}`} className="font-normal">Required</Label>
            </div>
          </div>

          {cfg.options.length === 0 && !cfg.allow_other && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              This client has no options and no free text, so no location field will appear.
              Add options or turn on free text.
            </p>
          )}
        </div>
      ))}

      {availableClients.length > 0 && (
        <Select value="" onValueChange={addEntry}>
          <SelectTrigger className="w-full sm:w-72" aria-label="Add location settings for a client or agency">
            <SelectValue placeholder="Add a client / agency…" />
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
      )}

      <p className="text-xs text-gray-500">
        When a session is billed to one of these clients, contractors are asked where it happened.
        Leave <strong>Options</strong> empty and turn on <strong>Allow free text</strong> for clients
        whose location changes every session. Clients not listed here get no location field.
      </p>
    </div>
  )
}
