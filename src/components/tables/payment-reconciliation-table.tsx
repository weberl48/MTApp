'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/contexts/organization-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface InvoiceWithDetails {
  id: string
  amount: number
  mca_cut: number
  contractor_pay: number
  status: 'pending' | 'sent' | 'paid'
  payment_method: string
  due_date: string | null
  paid_date: string | null
  created_at: string
  square_invoice_id: string | null
  square_payment_url: string | null
  client: { name: string } | null
  session: {
    date: string
    contractor: { name: string } | null
    service_type: { name: string } | null
  } | null
}

interface ReconciliationSummary {
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  sentInvoices: number
  squareLinked: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    label: 'Pending',
  },
  sent: {
    icon: ExternalLink,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    label: 'Sent',
  },
  paid: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    label: 'Paid',
  },
}

interface PaymentReconciliationTableProps {
  onRefresh?: () => void
}

export function PaymentReconciliationTable({ onRefresh }: PaymentReconciliationTableProps) {
  const { organization } = useOrganization()
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [squareFilter, setSquareFilter] = useState<string>('all')

  // Mark paid dialog
  const [markPaidDialog, setMarkPaidDialog] = useState<{
    isOpen: boolean
    invoice: InvoiceWithDetails | null
  }>({ isOpen: false, invoice: null })
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])
  const [isProcessing, setIsProcessing] = useState(false)

  const pageSize = 20

  const loadInvoices = useCallback(async () => {
    if (!organization) return

    setLoading(true)
    const supabase = createClient()

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(name),
        session:sessions(
          date,
          contractor:users(name),
          service_type:service_types(name)
        )
      `, { count: 'exact' })
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (squareFilter === 'linked') {
      query = query.not('square_invoice_id', 'is', null)
    } else if (squareFilter === 'unlinked') {
      query = query.is('square_invoice_id', null)
    }

    if (searchTerm) {
      query = query.or(`client.name.ilike.%${searchTerm}%`)
    }

    const { data, count, error } = await query

    if (error) {
      console.error('[MCA] Error loading invoices')
      setInvoices([])
    } else {
      setInvoices((data as unknown as InvoiceWithDetails[]) || [])
      setTotalCount(count || 0)
    }

    // Load summary stats
    const { data: summaryData } = await supabase
      .from('invoices')
      .select('status, amount, square_invoice_id')
      .eq('organization_id', organization.id)

    if (summaryData) {
      const stats: ReconciliationSummary = {
        totalInvoices: summaryData.length,
        paidInvoices: summaryData.filter(i => i.status === 'paid').length,
        pendingInvoices: summaryData.filter(i => i.status === 'pending').length,
        sentInvoices: summaryData.filter(i => i.status === 'sent').length,
        squareLinked: summaryData.filter(i => i.square_invoice_id).length,
        totalAmount: summaryData.reduce((sum, i) => sum + Number(i.amount), 0),
        paidAmount: summaryData.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0),
        pendingAmount: summaryData.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.amount), 0),
      }
      setSummary(stats)
    }

    setLoading(false)
  }, [organization, page, statusFilter, squareFilter, searchTerm])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  async function handleMarkPaid() {
    if (!markPaidDialog.invoice) return

    setIsProcessing(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: paidDate,
        })
        .eq('id', markPaidDialog.invoice.id)

      if (error) throw error

      toast.success('Invoice marked as paid')
      setMarkPaidDialog({ isOpen: false, invoice: null })
      loadInvoices()
      onRefresh?.()
    } catch (error) {
      console.error('[MCA] Error marking invoice as paid')
      toast.error('Failed to mark invoice as paid')
    } finally {
      setIsProcessing(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Invoices</div>
            <div className="text-2xl font-bold">{summary.totalInvoices}</div>
            <div className="text-sm text-gray-500">{formatCurrency(summary.totalAmount)}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-sm text-green-600 dark:text-green-400">Paid</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.paidInvoices}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              {formatCurrency(summary.paidAmount)}
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <div className="text-sm text-amber-600 dark:text-amber-400">Outstanding</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary.pendingInvoices + summary.sentInvoices}
            </div>
            <div className="text-sm text-amber-600 dark:text-amber-400">
              {formatCurrency(summary.pendingAmount)}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-sm text-blue-600 dark:text-blue-400">Square Linked</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.squareLinked}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              {Math.round((summary.squareLinked / summary.totalInvoices) * 100) || 0}% of total
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by client name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(0)
            }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={squareFilter} onValueChange={(v) => { setSquareFilter(v); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Square" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invoices</SelectItem>
            <SelectItem value="linked">Square Linked</SelectItem>
            <SelectItem value="unlinked">Not Linked</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadInvoices}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No invoices found
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Square</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const config = STATUS_CONFIG[invoice.status]
                const StatusIcon = config.icon

                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="text-sm">
                      {invoice.session?.date
                        ? format(new Date(invoice.session.date), 'MMM d, yyyy')
                        : format(new Date(invoice.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{invoice.client?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">
                        {invoice.session?.contractor?.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {invoice.session?.service_type?.name || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={config.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.square_invoice_id ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {invoice.square_payment_url && (
                            <a
                              href={invoice.square_payment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline text-xs"
                            >
                              View
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMarkPaidDialog({ isOpen: true, invoice })
                            setPaidDate(new Date().toISOString().split('T')[0])
                          }}
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                      {invoice.status === 'paid' && invoice.paid_date && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(invoice.paid_date), 'MMM d')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} invoices
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mark Paid Dialog */}
      <Dialog open={markPaidDialog.isOpen} onOpenChange={(open) => !open && setMarkPaidDialog({ isOpen: false, invoice: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
            <DialogDescription>
              Record payment for this invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Client:</span>
                <span className="font-medium">{markPaidDialog.invoice?.client?.name}</span>
                <span className="text-gray-500">Amount:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(markPaidDialog.invoice?.amount || 0)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="paidDate" className="text-sm font-medium">Payment Date</label>
              <Input
                id="paidDate"
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarkPaidDialog({ isOpen: false, invoice: null })}
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
                  <CheckCircle className="mr-2 h-4 w-4" />
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
