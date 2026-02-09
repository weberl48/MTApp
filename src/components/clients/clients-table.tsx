'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, Mail, Phone, Search } from 'lucide-react'
import { AddClientDialog } from '@/components/forms/add-client-dialog'
import { ClientActions } from '@/components/clients/client-actions'
import type { Client } from '@/types/database'
import { paymentMethodLabels, billingMethodLabels } from '@/lib/constants/display'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type SortField = 'name' | 'payment_method' | 'billing_method'
type SortDir = 'asc' | 'desc'

interface ClientsTableProps {
  clients: Client[]
  canManageClients: boolean
}

export function ClientsTable({ clients, canManageClients }: ClientsTableProps) {
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const filtered = useMemo(() => {
    let result = clients

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.contact_email?.toLowerCase().includes(q) ||
        c.contact_phone?.includes(q)
      )
    }

    // Payment method filter
    if (paymentFilter !== 'all') {
      result = result.filter(c => c.payment_method === paymentFilter)
    }

    // Sort
    result = [...result].sort((a, b) => {
      const aVal = (a[sortField] || '').toString().toLowerCase()
      const bVal = (b[sortField] || '').toString().toLowerCase()
      return sortDir === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    })

    return result
  }, [clients, search, paymentFilter, sortField, sortDir])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : ''

  // Get unique payment methods for filter dropdown
  const paymentMethods = [...new Set(clients.map(c => c.payment_method).filter(Boolean))]

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {paymentMethods.map(method => (
              <SelectItem key={method} value={method}>
                {paymentMethodLabels[method] || method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} of {clients.length} client{clients.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      {filtered.length > 0 ? (
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort('name')}
                >
                  Name{sortIndicator('name')}
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort('payment_method')}
                >
                  Payment Method{sortIndicator('payment_method')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort('billing_method')}
                >
                  Billing{sortIndicator('billing_method')}
                </TableHead>
                <TableHead>Notes</TableHead>
                {canManageClients && <TableHead className="w-20">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id} className="relative cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <Link href={`/clients/${client.id}`} className="after:absolute after:inset-0">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="relative z-10">
                    <div className="space-y-1">
                      {client.contact_email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <a href={`mailto:${client.contact_email}`} className="hover:underline">
                            {client.contact_email}
                          </a>
                        </div>
                      )}
                      {client.contact_phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${client.contact_phone}`} className="hover:underline">
                            {client.contact_phone}
                          </a>
                        </div>
                      )}
                      {!client.contact_email && !client.contact_phone && (
                        <span className="text-sm text-muted-foreground">No contact info</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {paymentMethodLabels[client.payment_method] || client.payment_method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {billingMethodLabels[client.billing_method] || 'Square'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {client.notes ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate">{client.notes}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                          <p className="whitespace-pre-wrap">{client.notes}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {canManageClients && (
                    <TableCell className="relative z-10">
                      <ClientActions client={client} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          {search || paymentFilter !== 'all' ? (
            <p>No clients match your filters</p>
          ) : (
            <>
              <p className="mb-4">No clients yet</p>
              {canManageClients && <AddClientDialog />}
            </>
          )}
        </div>
      )}
    </div>
  )
}
