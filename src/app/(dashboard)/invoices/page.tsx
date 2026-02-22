'use client'

import { useEffect, useMemo, useState, useRef, useCallback, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { bulkUpdateInvoiceStatus, updateInvoiceStatus } from '@/app/actions/invoices'
import { generateScholarshipBatchInvoice, generateAllUnbilledScholarshipInvoices } from '@/app/actions/scholarship-invoices'
import { parseLocalDate } from '@/lib/dates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Clock, AlertTriangle, Download, Send, CheckCheck, CheckCircle, Loader2, Plus } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/pricing'
import { InvoiceActions } from '@/components/forms/invoice-actions'
import { useOrganization } from '@/contexts/organization-context'
import { InvoicesListSkeleton } from '@/components/ui/skeleton'
import { invoiceStatusColors, paymentMethodLabels } from '@/lib/constants/display'
import {
  fetchUnbilledScholarshipSessions,
  groupUnbilledByClientMonth,
  type UnbilledScholarshipSession,
} from '@/lib/queries/scholarship'

interface Invoice {
  id: string
  session_id: string | null
  client_id: string
  amount: number
  mca_cut: number
  contractor_pay: number
  rent_amount: number
  status: 'pending' | 'sent' | 'paid'
  payment_method: 'private_pay' | 'self_directed' | 'group_home' | 'scholarship'
  invoice_type: string
  billing_period: string | null
  organization_id: string
  created_at: string
  updated_at: string
  due_date: string | null
  paid_date: string | null
  square_invoice_id: string | null
  square_payment_url: string | null
  reminder_sent_days: number[]
  client: { id: string; name: string; contact_email: string | null } | null
  session: {
    id: string
    date: string
    contractor: { id: string; name: string } | null
    service_type: { name: string } | null
  } | null
}

function getInvoiceStatus(invoice: Invoice): { status: string; isOverdue: boolean; daysOverdue: number } {
  if (invoice.status === 'paid') {
    return { status: 'paid', isOverdue: false, daysOverdue: 0 }
  }

  if (invoice.due_date && invoice.status === 'sent') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(invoice.due_date)
    dueDate.setHours(0, 0, 0, 0)

    if (today > dueDate) {
      const diffTime = today.getTime() - dueDate.getTime()
      const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return { status: 'overdue', isOverdue: true, daysOverdue }
    }
  }

  return { status: invoice.status, isOverdue: false, daysOverdue: 0 }
}


// Moved outside the component to avoid re-creating during render
function InvoiceTable({
  invoices,
  showActions = false,
  isAdmin,
  onRefresh,
  selectedIds,
  onSelectChange,
  showSelection = false,
}: {
  invoices: Invoice[]
  showActions?: boolean
  isAdmin: boolean
  onRefresh?: () => void
  selectedIds?: Set<string>
  onSelectChange?: (id: string, checked: boolean) => void
  showSelection?: boolean
}) {
  const router = useRouter()

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No invoices in this category</p>
      </div>
    )
  }

  const allSelected = invoices.length > 0 && invoices.every((inv) => selectedIds?.has(inv.id))
  const someSelected = invoices.some((inv) => selectedIds?.has(inv.id))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showSelection && isAdmin && (
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => {
                  invoices.forEach((inv) => onSelectChange?.(inv.id, !!checked))
                }}
                aria-label="Select all"
                className={someSelected && !allSelected ? 'opacity-50' : ''}
              />
            </TableHead>
          )}
          <TableHead>Client</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead className="text-right">{isAdmin ? 'Amount' : 'Pay'}</TableHead>
          <TableHead>Status</TableHead>
          {showActions && isAdmin && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => {
          const { status, isOverdue, daysOverdue } = getInvoiceStatus(invoice)
          return (
            <TableRow
              key={invoice.id}
              className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectedIds?.has(invoice.id) ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
              onClick={() => router.push(`/invoices/${invoice.id}`)}
            >
              {showSelection && isAdmin && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds?.has(invoice.id) || false}
                    onCheckedChange={(checked) => onSelectChange?.(invoice.id, !!checked)}
                    aria-label={`Select invoice for ${invoice.client?.name}`}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">{invoice.client?.name}</TableCell>
              <TableCell>
                {invoice.invoice_type === 'batch'
                  ? 'Monthly Statement'
                  : invoice.session?.service_type?.name}
              </TableCell>
              <TableCell>
                {invoice.invoice_type === 'batch' && invoice.billing_period
                  ? new Date(invoice.billing_period + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : invoice.session?.date
                    ? parseLocalDate(invoice.session.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '-'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {paymentMethodLabels[invoice.payment_method] || invoice.payment_method}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(isAdmin ? invoice.amount : (invoice.contractor_pay ?? invoice.amount))}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge className={invoiceStatusColors[status]}>
                    {isOverdue ? 'overdue' : invoice.status}
                  </Badge>
                  {isOverdue && (
                    <span className="text-xs text-red-600 dark:text-red-400">
                      {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} late
                    </span>
                  )}
                </div>
              </TableCell>
              {showActions && isAdmin && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {invoice.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={async () => {
                          const result = await updateInvoiceStatus(invoice.id, 'sent')
                          if (result.success) {
                            toast.success('Marked as sent')
                            onRefresh?.()
                          } else {
                            toast.error('error' in result ? result.error : 'Failed')
                          }
                        }}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Send
                      </Button>
                    )}
                    {invoice.status === 'sent' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={async () => {
                          const result = await updateInvoiceStatus(invoice.id, 'paid')
                          if (result.success) {
                            toast.success('Marked as paid')
                            onRefresh?.()
                          } else {
                            toast.error('error' in result ? result.error : 'Failed')
                          }
                        }}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Paid
                      </Button>
                    )}
                    <InvoiceActions invoice={invoice} onStatusChange={onRefresh} canDelete={isAdmin} />
                  </div>
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [unbilledScholarshipSessions, setUnbilledScholarshipSessions] = useState<UnbilledScholarshipSession[]>([])
  const [generatingBatch, setGeneratingBatch] = useState<string | null>(null) // client::month key
  const [generatingAll, setGeneratingAll] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const supabaseRef = useRef(createClient())

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
    setSelectedIds(new Set()) // Clear selection on refresh
  }, [])

  // Refetch when page becomes visible (e.g., after navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshTrigger(prev => prev + 1)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleSelectChange = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const selectedInvoices = invoices.filter((inv) => selectedIds.has(inv.id))
  const selectedTotal = selectedInvoices.reduce((sum, inv) => sum + inv.amount, 0)

  // Bulk action handlers
  const handleBulkMarkPaid = () => {
    if (selectedIds.size === 0) return
    startTransition(async () => {
      const result = await bulkUpdateInvoiceStatus(Array.from(selectedIds), 'paid')
      if (result.success) {
        toast.success(`Marked ${selectedIds.size} invoice(s) as paid`)
        handleRefresh()
      } else {
        toast.error(result.error || 'Failed to mark invoices as paid')
      }
    })
  }

  const handleBulkMarkSent = () => {
    if (selectedIds.size === 0) return
    startTransition(async () => {
      const result = await bulkUpdateInvoiceStatus(Array.from(selectedIds), 'sent')
      if (result.success) {
        toast.success(`Marked ${selectedIds.size} invoice(s) as sent`)
        handleRefresh()
      } else {
        toast.error(result.error || 'Failed to mark invoices as sent')
      }
    })
  }

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return

    // Build CSV content
    const headers = ['Client', 'Service', 'Date', 'Payment Method', 'Amount', 'Status']
    const rows = selectedInvoices.map((inv) => [
      inv.client?.name || '',
      inv.session?.service_type?.name || '',
      inv.session?.date || '',
      paymentMethodLabels[inv.payment_method] || inv.payment_method,
      inv.amount.toFixed(2),
      inv.status,
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`Exported ${selectedIds.size} invoice(s)`)
  }

  // Get context values for view-as filtering
  const { organization, can, effectiveUserId, viewAsContractor } = useOrganization()
  const contextIsAdmin = can('invoice:bulk-action')

  useEffect(() => {
    let cancelled = false

    async function loadInvoices() {
      const supabase = supabaseRef.current

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || cancelled) {
        if (!cancelled) setLoading(false)
        return
      }

      // Use context isAdmin (which respects viewAsRole)
      const admin = contextIsAdmin

      // Fetch invoices with related data
      // For contractors (or when viewing as a specific contractor), only fetch their invoices
      let query = supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, name, contact_email),
          session:sessions(
            id,
            date,
            contractor_id,
            contractor:users(id, name),
            service_type:service_types(name)
          )
        `)
        .order('created_at', { ascending: false })

      // If not admin OR viewing as a specific contractor, filter invoices
      const shouldFilterByContractor = !admin || viewAsContractor
      const contractorIdToFilter = viewAsContractor?.id || (admin ? null : effectiveUserId)

      if (shouldFilterByContractor && contractorIdToFilter) {
        // Get invoice IDs for sessions where this contractor is assigned
        const { data: contractorSessions } = await supabase
          .from('sessions')
          .select('id')
          .eq('contractor_id', contractorIdToFilter)

        const sessionIds = contractorSessions?.map((s) => s.id) || []

        if (sessionIds.length === 0) {
          // No sessions, return empty array
          if (!cancelled) {
            setIsAdmin(admin && !viewAsContractor)
            setInvoices([])
            setLoading(false)
          }
          return
        }

        query = query.in('session_id', sessionIds)
      }

      const { data } = await query

      // Fetch unbilled scholarship sessions (admin only)
      let unbilled: UnbilledScholarshipSession[] = []
      if (admin && !viewAsContractor) {
        unbilled = await fetchUnbilledScholarshipSessions(supabase)
      }

      if (!cancelled) {
        setIsAdmin(admin && !viewAsContractor)
        setInvoices((data as unknown as Invoice[]) || [])
        setUnbilledScholarshipSessions(unbilled)
        setLoading(false)
      }
    }

    loadInvoices()

    return () => {
      cancelled = true
    }
  }, [refreshTrigger, contextIsAdmin, effectiveUserId, viewAsContractor])

  // Group invoices by status
  const pendingInvoices = invoices?.filter((inv) => inv.status === 'pending') || []
  const sentInvoices = invoices?.filter((inv) => inv.status === 'sent') || []
  const paidInvoices = invoices?.filter((inv) => inv.status === 'paid') || []
  const overdueInvoices = sentInvoices.filter((inv) => getInvoiceStatus(inv).isOverdue)

  // Group by payment method (unpaid only - most useful for follow-up)
  const selfDirectedUnpaid = invoices?.filter(
    (inv) => inv.payment_method === 'self_directed' && inv.status !== 'paid'
  ) || []
  const groupHomeUnpaid = invoices?.filter(
    (inv) => inv.payment_method === 'group_home' && inv.status !== 'paid'
  ) || []
  const scholarshipUnpaid = invoices?.filter(
    (inv) => inv.payment_method === 'scholarship' && inv.status !== 'paid'
  ) || []

  // Group unbilled scholarship sessions by client and month
  const unbilledByClientMonth = useMemo(
    () => groupUnbilledByClientMonth(unbilledScholarshipSessions),
    [unbilledScholarshipSessions]
  )

  // Existing batch scholarship invoices (already generated)
  const scholarshipBatchInvoices = invoices?.filter(
    (inv) => inv.payment_method === 'scholarship' && inv.invoice_type === 'batch' && inv.status !== 'paid'
  ) || []

  const hasScholarshipContent = unbilledByClientMonth.length > 0 || scholarshipBatchInvoices.length > 0 || scholarshipUnpaid.length > 0

  // Calculate totals
  const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  const sentTotal = sentInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0)

  if (loading) {
    return <InvoicesListSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {isAdmin ? 'Manage and track all invoices' : 'View invoice status for your sessions'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className={`grid gap-4 ${overdueInvoices.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending Review
            </CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingTotal)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Awaiting Payment
            </CardTitle>
            <FileText className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(sentTotal)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {sentInvoices.length} invoice{sentInvoices.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {overdueInvoices.length > 0 && (
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                Overdue
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueTotal)}</div>
              <p className="text-xs text-red-500 dark:text-red-400">
                {overdueInvoices.length} invoice{overdueInvoices.length !== 1 ? 's' : ''} past due
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bulk Action Bar */}
      {isAdmin && selectedIds.size > 0 && (
        <Card className="sticky top-0 z-10 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedIds.size} invoice{selectedIds.size !== 1 ? 's' : ''} selected
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total: {formatCurrency(selectedTotal)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkExport}
                  disabled={isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMarkSent}
                  disabled={isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Mark Sent
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkMarkPaid}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4 mr-2" />
                  )}
                  Mark Paid
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={isPending}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            {invoices?.length || 0} invoices total
            {isAdmin && <span className="ml-2 text-xs">(Select invoices for bulk actions)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={overdueInvoices.length > 0 ? 'overdue' : 'pending'}>
            <TabsList className="mb-4">
              {overdueInvoices.length > 0 && (
                <TabsTrigger value="overdue" className="text-red-600 dark:text-red-400">
                  Overdue ({overdueInvoices.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="pending">
                Pending ({pendingInvoices.length})
              </TabsTrigger>
              <TabsTrigger value="sent">
                Sent ({sentInvoices.length})
              </TabsTrigger>
              <TabsTrigger value="paid">
                Paid ({paidInvoices.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({invoices?.length || 0})
              </TabsTrigger>
              {selfDirectedUnpaid.length > 0 && (
                <TabsTrigger value="self-directed" className="text-orange-600 dark:text-orange-400">
                  Self-Directed ({selfDirectedUnpaid.length})
                </TabsTrigger>
              )}
              {groupHomeUnpaid.length > 0 && (
                <TabsTrigger value="group-home">
                  Group Home ({groupHomeUnpaid.length})
                </TabsTrigger>
              )}
              {hasScholarshipContent && (
                <TabsTrigger value="scholarship" className="text-purple-600 dark:text-purple-400">
                  Scholarship{unbilledByClientMonth.length > 0 ? ` (${unbilledScholarshipSessions.length} unbilled)` : ''}
                </TabsTrigger>
              )}
            </TabsList>
            {overdueInvoices.length > 0 && (
              <TabsContent value="overdue">
                <InvoiceTable invoices={overdueInvoices} showActions isAdmin={isAdmin} onRefresh={handleRefresh} showSelection selectedIds={selectedIds} onSelectChange={handleSelectChange} />
              </TabsContent>
            )}
            <TabsContent value="pending">
              <InvoiceTable invoices={pendingInvoices} showActions isAdmin={isAdmin} onRefresh={handleRefresh} showSelection selectedIds={selectedIds} onSelectChange={handleSelectChange} />
            </TabsContent>
            <TabsContent value="sent">
              <InvoiceTable invoices={sentInvoices} showActions isAdmin={isAdmin} onRefresh={handleRefresh} showSelection selectedIds={selectedIds} onSelectChange={handleSelectChange} />
            </TabsContent>
            <TabsContent value="paid">
              <InvoiceTable invoices={paidInvoices} showActions isAdmin={isAdmin} onRefresh={handleRefresh} showSelection selectedIds={selectedIds} onSelectChange={handleSelectChange} />
            </TabsContent>
            <TabsContent value="all">
              <InvoiceTable invoices={invoices || []} showActions isAdmin={isAdmin} onRefresh={handleRefresh} showSelection selectedIds={selectedIds} onSelectChange={handleSelectChange} />
            </TabsContent>
            {selfDirectedUnpaid.length > 0 && (
              <TabsContent value="self-directed">
                <InvoiceTable invoices={selfDirectedUnpaid} showActions isAdmin={isAdmin} onRefresh={handleRefresh} showSelection selectedIds={selectedIds} onSelectChange={handleSelectChange} />
              </TabsContent>
            )}
            {groupHomeUnpaid.length > 0 && (
              <TabsContent value="group-home">
                <InvoiceTable invoices={groupHomeUnpaid} showActions isAdmin={isAdmin} onRefresh={handleRefresh} showSelection selectedIds={selectedIds} onSelectChange={handleSelectChange} />
              </TabsContent>
            )}
            {hasScholarshipContent && (
              <TabsContent value="scholarship">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Scholarship sessions are billed monthly. Generate a batch invoice for each client per month.
                    </p>
                    {isAdmin && unbilledByClientMonth.length > 0 && (
                      <Button
                        size="sm"
                        disabled={generatingAll}
                        onClick={async () => {
                          setGeneratingAll(true)
                          const result = await generateAllUnbilledScholarshipInvoices(organization?.id || '')
                          setGeneratingAll(false)
                          if (result.success) {
                            if (result.generated > 0) {
                              toast.success(`Generated ${result.generated} invoice${result.generated !== 1 ? 's' : ''}`)
                            }
                            if (result.failed.length > 0) {
                              toast.warning(`${result.failed.length} failed`)
                            }
                            handleRefresh()
                          }
                        }}
                      >
                        {generatingAll ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-1" />
                        )}
                        Generate All ({unbilledByClientMonth.length})
                      </Button>
                    )}
                  </div>

                  {/* Unbilled sessions grouped by client + month */}
                  {unbilledByClientMonth.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Unbilled Sessions</h3>
                      {unbilledByClientMonth.map((group) => {
                        const monthLabel = new Date(group.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        const groupKey = `${group.clientId}::${group.month}`
                        const isGenerating = generatingBatch === groupKey

                        return (
                          <Card key={groupKey} className="border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10">
                            <CardHeader className="py-3 px-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{group.clientName}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{monthLabel}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <p className="text-xs text-gray-500">
                                    {group.sessions.length} session{group.sessions.length !== 1 ? 's' : ''}
                                  </p>
                                  {isAdmin && (
                                    <Button
                                      size="sm"
                                      disabled={isGenerating}
                                      onClick={async () => {
                                        setGeneratingBatch(groupKey)
                                        const result = await generateScholarshipBatchInvoice({
                                          clientId: group.clientId,
                                          billingPeriod: group.month,
                                          organizationId: organization?.id || '',
                                        })
                                        setGeneratingBatch(null)
                                        if (result.success) {
                                          toast.success('Monthly invoice generated')
                                          handleRefresh()
                                        } else {
                                          toast.error(result.error || 'Failed to generate invoice')
                                        }
                                      }}
                                    >
                                      {isGenerating ? (
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                      ) : (
                                        <Plus className="w-4 h-4 mr-1" />
                                      )}
                                      Generate Invoice
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 pt-0">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Contractor</TableHead>
                                    <TableHead className="text-right">Duration</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.sessions
                                    .sort((a, b) => a.date.localeCompare(b.date))
                                    .map((s) => (
                                      <TableRow key={s.sessionId}>
                                        <TableCell>{s.serviceTypeName}</TableCell>
                                        <TableCell>
                                          {parseLocalDate(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </TableCell>
                                        <TableCell>{s.contractorName}</TableCell>
                                        <TableCell className="text-right">{s.durationMinutes} min</TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}

                  {/* Existing batch invoices */}
                  {scholarshipBatchInvoices.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Batch Invoices</h3>
                      <InvoiceTable invoices={scholarshipBatchInvoices} showActions isAdmin={isAdmin} onRefresh={handleRefresh} showSelection selectedIds={selectedIds} onSelectChange={handleSelectChange} />
                    </div>
                  )}

                  {/* Legacy per-session scholarship invoices (backward compat) */}
                  {scholarshipUnpaid.filter(inv => inv.invoice_type !== 'batch').length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Per-Session Invoices (Legacy)</h3>
                      <InvoiceTable invoices={scholarshipUnpaid.filter(inv => inv.invoice_type !== 'batch')} showActions isAdmin={isAdmin} onRefresh={handleRefresh} showSelection selectedIds={selectedIds} onSelectChange={handleSelectChange} />
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
