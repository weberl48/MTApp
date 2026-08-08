'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import type { ServiceType } from '@/types/database'
import { EditableCell } from './editable-cell'

export interface RateTableProps {
  serviceTypes: ServiceType[]
  canEdit: boolean
  onUpdate: (id: string, patch: Partial<ServiceType>) => Promise<void>
}

export interface BillingTableProps extends RateTableProps {
  onAdd: () => void
  onEdit: (st: ServiceType) => void
  onDelete: (st: ServiceType) => void
}

/** Section 1 — what the client pays: base rate, per-person rate, total cap, scholarship rate. */
export function BillingTable({
  serviceTypes,
  canEdit,
  onUpdate,
  onAdd,
  onEdit,
  onDelete,
}: BillingTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>1 · What the client pays</CardTitle>
        {canEdit && (
          <Button size="sm" onClick={onAdd} data-tour="pricing-add-service">
            <Plus className="w-4 h-4" />
            Add service
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div
          className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
          data-tour="pricing-billing-table"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Service</TableHead>
                <TableHead className="text-center">Base rate</TableHead>
                <TableHead className="text-center">Per-person</TableHead>
                <TableHead className="text-center">Total cap</TableHead>
                <TableHead className="text-center">Scholarship rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceTypes.map((st) => (
                <TableRow key={st.id} className={st.is_active ? undefined : 'opacity-60'}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{st.name}</span>
                      {!st.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-0.5 mt-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => onEdit(st)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => onDelete(st)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <EditableCell
                      value={st.base_rate}
                      display={formatCurrency(st.base_rate)}
                      canEdit={canEdit}
                      nullable={false}
                      onSave={async (v) => {
                        if (v !== null) await onUpdate(st.id, { base_rate: v })
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <EditableCell
                      value={st.per_person_rate}
                      display={formatCurrency(st.per_person_rate)}
                      canEdit={canEdit}
                      nullable={false}
                      onSave={async (v) => {
                        if (v !== null) await onUpdate(st.id, { per_person_rate: v })
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <EditableCell
                      value={st.total_cap}
                      display={st.total_cap != null ? formatCurrency(st.total_cap) : undefined}
                      canEdit={canEdit}
                      nullable
                      onSave={(v) => onUpdate(st.id, { total_cap: v })}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <EditableCell
                      value={st.scholarship_rate}
                      display={st.scholarship_rate != null ? formatCurrency(st.scholarship_rate) : undefined}
                      canEdit={canEdit}
                      nullable
                      onSave={(v) => onUpdate(st.id, { scholarship_rate: v })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
