'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { calculateSessionPricing, formatCurrency } from '@/lib/pricing'
import { EditableCell } from './editable-cell'
import type { RateTableProps } from './billing-table'

export interface BusinessCutTableProps extends RateTableProps {
  /** settings.pricing?.duration_base_minutes ?? 30 — resolved by the caller */
  durationBase: number
}

/** Section 3 — what the business keeps: MCA %, contractor cap, margin preview at base duration. */
export function BusinessCutTable({
  serviceTypes,
  canEdit,
  onUpdate,
  durationBase,
}: BusinessCutTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>3 · What the business keeps</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
          data-tour="pricing-cut-table"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Service</TableHead>
                <TableHead className="text-center">MCA %</TableHead>
                <TableHead className="text-center">Contractor cap</TableHead>
                <TableHead className="text-center">Margin @ base</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceTypes.map((st) => {
                const margin = calculateSessionPricing(st, 1, durationBase).mcaCut
                return (
                  <TableRow key={st.id} className={st.is_active ? undefined : 'opacity-60'}>
                    <TableCell className="font-medium">{st.name}</TableCell>
                    <TableCell className="text-center">
                      <EditableCell
                        value={st.mca_percentage}
                        display={`${st.mca_percentage}%`}
                        canEdit={canEdit}
                        nullable={false}
                        step="1"
                        min={0}
                        onSave={async (v) => {
                          if (v === null) return
                          if (v > 100) {
                            toast.error('MCA % cannot exceed 100')
                            return
                          }
                          await onUpdate(st.id, { mca_percentage: v })
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <EditableCell
                        value={st.contractor_cap}
                        display={st.contractor_cap != null ? formatCurrency(st.contractor_cap) : undefined}
                        canEdit={canEdit}
                        nullable
                        onSave={(v) => onUpdate(st.id, { contractor_cap: v })}
                      />
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatCurrency(margin)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
