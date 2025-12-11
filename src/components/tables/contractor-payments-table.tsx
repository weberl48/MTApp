'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  ColumnDef,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowUpDown, Search, FileSpreadsheet } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import * as XLSX from 'xlsx'

interface ContractorData {
  id: string
  name: string
  email: string
  totalEarned: number
  totalPaid: number
  totalPending: number
  sessionCount: number
}

interface Invoice {
  id: string
  amount: number
  mca_cut: number
  contractor_pay: number
  status: string
  created_at: string
  paid_date?: string | null
  session?: {
    id: string
    date: string
    contractor?: { id: string; name: string; email: string } | null
    service_type?: { name: string } | null
  } | null
  client?: { name: string } | null
}

interface ContractorPaymentsTableProps {
  contractors: ContractorData[]
  invoices: Invoice[]
}

export function ContractorPaymentsTable({ contractors, invoices }: ContractorPaymentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns: ColumnDef<ContractorData>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Contractor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-gray-500">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'sessionCount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Sessions
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.original.sessionCount}</div>
      ),
    },
    {
      accessorKey: 'totalEarned',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Total Earned
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(row.original.totalEarned)}
        </div>
      ),
    },
    {
      accessorKey: 'totalPaid',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Paid Out
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right text-green-600 font-medium">
          {formatCurrency(row.original.totalPaid)}
        </div>
      ),
    },
    {
      accessorKey: 'totalPending',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Pending
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.totalPending > 0 ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {formatCurrency(row.original.totalPending)}
            </Badge>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: contractors,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  function exportToExcel() {
    // Create summary sheet
    const summaryData = contractors.map((c) => ({
      'Contractor Name': c.name,
      'Email': c.email,
      'Sessions': c.sessionCount,
      'Total Earned': c.totalEarned,
      'Paid Out': c.totalPaid,
      'Pending': c.totalPending,
    }))

    // Create detailed invoice sheet
    const invoiceData = invoices.map((inv) => ({
      'Date': inv.session?.date || '',
      'Contractor': inv.session?.contractor?.name || '',
      'Client': inv.client?.name || '',
      'Service': inv.session?.service_type?.name || '',
      'Total Amount': inv.amount,
      'MCA Cut': inv.mca_cut,
      'Contractor Pay': inv.contractor_pay,
      'Status': inv.status,
      'Paid Date': inv.paid_date || '',
    }))

    const wb = XLSX.utils.book_new()

    // Add summary sheet
    const summaryWs = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

    // Add detailed sheet
    const detailWs = XLSX.utils.json_to_sheet(invoiceData)
    XLSX.utils.book_append_sheet(wb, detailWs, 'Invoice Details')

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `contractor-payments-${date}.xlsx`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contractors..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="pl-10"
          />
        </div>
        <Button onClick={exportToExcel} variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No payment records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
