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
import ExcelJS from 'exceljs'

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

  async function exportToExcel() {
    const wb = new ExcelJS.Workbook()

    // Add summary sheet
    const summaryWs = wb.addWorksheet('Summary')
    summaryWs.columns = [
      { header: 'Contractor Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Sessions', key: 'sessions', width: 12 },
      { header: 'Total Earned', key: 'earned', width: 15 },
      { header: 'Paid Out', key: 'paid', width: 15 },
      { header: 'Pending', key: 'pending', width: 15 },
    ]
    for (const c of contractors) {
      summaryWs.addRow({
        name: c.name, email: c.email, sessions: c.sessionCount,
        earned: c.totalEarned, paid: c.totalPaid, pending: c.totalPending,
      })
    }

    // Add detailed invoice sheet
    const detailWs = wb.addWorksheet('Invoice Details')
    detailWs.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Contractor', key: 'contractor', width: 25 },
      { header: 'Client', key: 'client', width: 25 },
      { header: 'Service', key: 'service', width: 20 },
      { header: 'Total Amount', key: 'amount', width: 14 },
      { header: 'MCA Cut', key: 'mcaCut', width: 12 },
      { header: 'Contractor Pay', key: 'contractorPay', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Paid Date', key: 'paidDate', width: 14 },
    ]
    for (const inv of invoices) {
      detailWs.addRow({
        date: inv.session?.date || '',
        contractor: inv.session?.contractor?.name || '',
        client: inv.client?.name || '',
        service: inv.session?.service_type?.name || '',
        amount: inv.amount,
        mcaCut: inv.mca_cut,
        contractorPay: inv.contractor_pay,
        status: inv.status,
        paidDate: inv.paid_date || '',
      })
    }

    // Generate and download
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contractor-payments-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
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
        <Button onClick={exportToExcel} variant="outline" className="w-full sm:w-auto">
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
