'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import type { ServiceType } from '@/types/database'
import { EditableCell } from './editable-cell'

export interface GroupPayGridProps {
  serviceType: ServiceType
  durations: number[]
  canEdit: boolean
  onUpdate: (id: string, matrix: Record<string, number> | null) => Promise<void>
}

const GROUP_HEADCOUNTS = [1, 2, 3, 4, 5, 6]

/** One collapsible headcount x duration contractor-pay matrix for a single group service. */
export function GroupPayGrid({ serviceType, durations, canEdit, onUpdate }: GroupPayGridProps) {
  const [open, setOpen] = useState(false)

  async function saveCell(headcount: number, duration: number, value: number | null) {
    const next: Record<string, number> = { ...(serviceType.group_contractor_pay ?? {}) }
    const key = `${headcount}_${duration}`
    // Only positive values are kept — mirrors the old dialog's submit filter.
    if (value !== null && value > 0) {
      next[key] = value
    } else {
      delete next[key]
    }
    const keys = Object.keys(next)
    await onUpdate(serviceType.id, keys.length ? next : null)
  }

  return (
    <div className="border rounded-lg" data-tour="pricing-group-pay">
      <button
        type="button"
        className="flex items-center gap-2 w-full px-3 py-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span className="text-sm font-medium">{serviceType.name}</span>
      </button>
      {open && (
        <div className="overflow-x-auto border-t px-3 py-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted">
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground w-16">
                  Clients
                </th>
                {durations.map((dur) => (
                  <th key={dur} className="px-2 py-1.5 text-center font-medium text-muted-foreground">
                    {dur}m
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {GROUP_HEADCOUNTS.map((h) => (
                <tr key={h}>
                  <td className="px-2 py-1.5 text-sm font-medium text-foreground">
                    {h === 6 ? '6+' : h}
                  </td>
                  {durations.map((dur) => {
                    const key = `${h}_${dur}`
                    const value = serviceType.group_contractor_pay?.[key] ?? null
                    return (
                      <td key={dur} className="px-1 py-1 text-center">
                        <EditableCell
                          value={value}
                          display={value != null ? formatCurrency(value) : undefined}
                          canEdit={canEdit}
                          nullable
                          onSave={(v) => saveCell(h, dur, v)}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
