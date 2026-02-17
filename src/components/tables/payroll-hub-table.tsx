'use client'

import { useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronRight, Search, FileSpreadsheet, DollarSign, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { parseLocalDate } from '@/lib/dates'

export interface UnpaidSession {
  id: string
  date: string
  service_type: { name: string } | null
  duration_minutes: number
  contractor_pay: number
  clients: string[]
}

export interface ContractorPayout {
  id: string
  name: string
  email: string
  unpaidSessions: UnpaidSession[]
  totalPending: number
  sessionCount: number
}

interface PayrollHubTableProps {
  contractors: ContractorPayout[]
  onPayoutComplete: () => void
}

export function PayrollHubTable({ contractors, onPayoutComplete }: PayrollHubTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedContractors, setExpandedContractors] = useState<Set<string>>(new Set())
  const [markPaidDialog, setMarkPaidDialog] = useState<{
    isOpen: boolean
    contractor: ContractorPayout | null
  }>({ isOpen: false, contractor: null })
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split('T')[0])
  const [isProcessing, setIsProcessing] = useState(false)

  // Filter contractors by search
  const filteredContractors = contractors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function toggleExpand(contractorId: string) {
    const newExpanded = new Set(expandedContractors)
    if (newExpanded.has(contractorId)) {
      newExpanded.delete(contractorId)
    } else {
      newExpanded.add(contractorId)
    }
    setExpandedContractors(newExpanded)
  }

  function openMarkPaidDialog(contractor: ContractorPayout) {
    setMarkPaidDialog({ isOpen: true, contractor })
    setPayoutDate(new Date().toISOString().split('T')[0])
  }

  async function handleMarkPaid() {
    if (!markPaidDialog.contractor) return

    setIsProcessing(true)
    const supabase = createClient()

    try {
      // Get session IDs to update
      const sessionIds = markPaidDialog.contractor.unpaidSessions.map((s) => s.id)

      // Update all sessions with the paid date and amounts
      const updates = markPaidDialog.contractor.unpaidSessions.map((session) => ({
        id: session.id,
        contractor_paid_date: payoutDate,
        contractor_paid_amount: session.contractor_pay,
      }))

      // Batch update sessions
      for (const update of updates) {
        const { error } = await supabase
          .from('sessions')
          .update({
            contractor_paid_date: update.contractor_paid_date,
            contractor_paid_amount: update.contractor_paid_amount,
          })
          .eq('id', update.id)

        if (error) throw error
      }

      toast.success(
        `Marked ${sessionIds.length} sessions as paid for ${markPaidDialog.contractor.name}`
      )
      setMarkPaidDialog({ isOpen: false, contractor: null })
      onPayoutComplete()
    } catch (error) {
      console.error('[MCA] Error marking sessions as paid')
      toast.error('Failed to mark sessions as paid')
    } finally {
      setIsProcessing(false)
    }
  }

  async function exportToExcel() {
    const wb = new ExcelJS.Workbook()

    // Add summary sheet
    const summaryWs = wb.addWorksheet('Unpaid Summary')
    summaryWs.columns = [
      { header: 'Contractor Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Unpaid Sessions', key: 'sessions', width: 16 },
      { header: 'Total Pending', key: 'pending', width: 15 },
    ]
    for (const c of contractors) {
      summaryWs.addRow({ name: c.name, email: c.email, sessions: c.sessionCount, pending: c.totalPending })
    }

    // Add detailed session sheet
    const detailWs = wb.addWorksheet('Session Details')
    detailWs.columns = [
      { header: 'Contractor', key: 'contractor', width: 25 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Service', key: 'service', width: 20 },
      { header: 'Duration (min)', key: 'duration', width: 15 },
      { header: 'Clients', key: 'clients', width: 30 },
      { header: 'Contractor Pay', key: 'pay', width: 15 },
    ]
    for (const c of contractors) {
      for (const s of c.unpaidSessions) {
        detailWs.addRow({
          contractor: c.name,
          date: s.date,
          service: s.service_type?.name || '',
          duration: s.duration_minutes,
          clients: s.clients.join(', '),
          pay: s.contractor_pay,
        })
      }
    }

    // Generate and download
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `unpaid-payroll-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalUnpaid = contractors.reduce((sum, c) => sum + c.totalPending, 0)
  const totalSessions = contractors.reduce((sum, c) => sum + c.sessionCount, 0)

  return (
    <div className="space-y-4">
      {/* Header with totals */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 min-w-0">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search contractors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-500 break-words">
            {totalSessions} unpaid session{totalSessions !== 1 ? 's' : ''} •{' '}
            <span className="font-medium text-amber-600">{formatCurrency(totalUnpaid)}</span> total
          </div>
        </div>
        <Button onClick={exportToExcel} variant="outline" className="w-full sm:w-auto">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Contractor</TableHead>
              <TableHead className="text-center">Unpaid Sessions</TableHead>
              <TableHead className="text-right">Total Pending</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContractors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                  {contractors.length === 0
                    ? 'No unpaid sessions found - all contractors are paid up!'
                    : 'No contractors match your search'}
                </TableCell>
              </TableRow>
            ) : (
              filteredContractors.map((contractor) => (
                <>
                  {/* Contractor row */}
                  <TableRow
                    key={contractor.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => toggleExpand(contractor.id)}
                  >
                    <TableCell className="w-8">
                      {expandedContractors.has(contractor.id) ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{contractor.name}</div>
                      <div className="text-sm text-gray-500">{contractor.email}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{contractor.sessionCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-amber-600">
                        {formatCurrency(contractor.totalPending)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openMarkPaidDialog(contractor)
                        }}
                      >
                        <DollarSign className="mr-1 h-4 w-4" />
                        Mark Paid
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expanded sessions */}
                  {expandedContractors.has(contractor.id) && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-900 p-0">
                        <div className="p-4">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-500">
                                <th className="text-left pb-2 font-medium">Date</th>
                                <th className="text-left pb-2 font-medium">Service</th>
                                <th className="text-left pb-2 font-medium">Clients</th>
                                <th className="text-right pb-2 font-medium">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {contractor.unpaidSessions.map((session) => (
                                <tr key={session.id} className="border-t border-gray-100 dark:border-gray-800">
                                  <td className="py-2">
                                    {format(parseLocalDate(session.date), 'MMM d, yyyy')}
                                  </td>
                                  <td className="py-2">{session.service_type?.name || '-'}</td>
                                  <td className="py-2">{session.clients.join(', ') || '-'}</td>
                                  <td className="py-2 text-right font-medium">
                                    {formatCurrency(session.contractor_pay)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mark Paid Dialog */}
      <Dialog open={markPaidDialog.isOpen} onOpenChange={(open) => !open && setMarkPaidDialog({ isOpen: false, contractor: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Sessions as Paid</DialogTitle>
            <DialogDescription>
              Mark all unpaid sessions for {markPaidDialog.contractor?.name} as paid.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Sessions:</span>
                <span className="font-medium">{markPaidDialog.contractor?.sessionCount}</span>
                <span className="text-gray-500">Total Amount:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(markPaidDialog.contractor?.totalPending || 0)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payoutDate">Payment Date</Label>
              <Input
                id="payoutDate"
                type="date"
                value={payoutDate}
                onChange={(e) => setPayoutDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarkPaidDialog({ isOpen: false, contractor: null })}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
