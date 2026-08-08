'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { calculateSessionPricing, formatCurrency } from '@/lib/pricing'
import type { ServiceType } from '@/types/database'
import { EditableCell } from './editable-cell'

export interface PayScheduleGridProps {
  serviceTypes: ServiceType[]
  durations: number[]
  canEdit: boolean
  onUpdate: (id: string, schedule: Record<string, number> | null) => Promise<void>
}

/** Contractor pay by duration for individual services (group services use GroupPayGrid instead). */
export function PayScheduleGrid({
  serviceTypes,
  durations,
  canEdit,
  onUpdate,
}: PayScheduleGridProps) {
  const individualServices = serviceTypes.filter((st) => st.per_person_rate === 0)

  if (individualServices.length === 0) return null

  async function saveCell(st: ServiceType, duration: number, value: number | null) {
    const next: Record<string, number> = { ...(st.contractor_pay_schedule ?? {}) }
    const key = String(duration)
    // Only positive values are kept — mirrors the old dialog's submit filter.
    if (value !== null && value > 0) {
      next[key] = value
    } else {
      delete next[key]
    }
    const keys = Object.keys(next)
    await onUpdate(st.id, keys.length ? next : null)
  }

  return (
    <div className="space-y-2" data-tour="pricing-pay-schedule">
      <h4 className="text-sm font-medium">Pay schedule</h4>
      <p className="text-xs text-muted-foreground">
        Set contractor pay for each duration. Leave empty to calculate automatically from MCA %.
      </p>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Service</TableHead>
              {durations.map((dur) => (
                <TableHead key={dur} className="text-center">
                  {dur} min
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {individualServices.map((st) => (
              <TableRow key={st.id}>
                <TableCell className="font-medium">{st.name}</TableCell>
                {durations.map((dur) => {
                  const value = st.contractor_pay_schedule?.[String(dur)] ?? null
                  const auto = calculateSessionPricing(st, 1, dur).contractorPay.toFixed(2)
                  return (
                    <TableCell key={dur} className="text-center">
                      <EditableCell
                        value={value}
                        display={value != null ? formatCurrency(value) : undefined}
                        placeholder={auto}
                        canEdit={canEdit}
                        nullable
                        onSave={(v) => saveCell(st, dur, v)}
                      />
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
