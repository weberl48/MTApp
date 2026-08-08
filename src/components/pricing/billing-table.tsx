'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, MoreVertical } from 'lucide-react'
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
        <CardTitle>What the client pays</CardTitle>
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
                {canEdit && (
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceTypes.map((st) => (
                <TableRow key={st.id} className={`group ${st.is_active ? '' : 'opacity-60'}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{st.name}</span>
                      {!st.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
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
                      // 0 means "not a group service" — a dash reads cleaner than $0.00.
                      display={st.per_person_rate > 0 ? formatCurrency(st.per_person_rate) : '—'}
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
                  {canEdit && (
                    <TableCell className="text-right p-1">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          aria-label={`Edit ${st.name}`}
                          onClick={() => onEdit(st)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              aria-label={`More actions for ${st.name}`}
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => onDelete(st)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete service
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
