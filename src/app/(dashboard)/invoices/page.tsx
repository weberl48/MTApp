'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { FileText, Clock, CheckCircle, Loader2, AlertTriangle, Eye, Download, Send, CheckCheck } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatCurrency } from '@/lib/pricing'
import { InvoiceActions } from '@/components/forms/invoice-actions'

interface Invoice {
  id: string
  session_id: string
  client_id: string
  amount: number
  mca_cut: number
  contractor_pay: number
  rent_amount: number
  status: 'pending' | 'sent' | 'paid'
  payment_method: 'private_pay' | 'self_directed' | 'group_home' | 'scholarship'
  organization_id: string
  created_at: string
  updated_at: string
  due_date: string | null
  paid_date: string | null
  square_invoice_id: string | null
  square_payment_url: string | null
  client: { id: string; name: string; contact_email: string | null } | null
  session: {
    id: string
    date: string
    contractor: { id: string; name: string } | null
    service_type: { name: string } | null
  } | null
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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

const paymentMethodLabels: Record<string, string> = {
  private_pay: 'Private Pay',
  self_directed: 'Self-Directed',
  group_home: 'Group Home',
  scholarship: 'Scholarship',
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
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead></TableHead>
          {showActions && isAdmin && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => {
          const { status, isOverdue, daysOverdue } = getInvoiceStatus(invoice)
          return (
            <TableRow key={invoice.id} className={selectedIds?.has(invoice.id) ? 'bg-blue-50 dark:bg-blue-950/30' : ''}>
              {showSelection && isAdmin && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds?.has(invoice.id) || false}
                    onCheckedChange={(checked) => onSelectChange?.(invoice.id, !!checked)}
                    aria-label={`Select invoice for ${invoice.client?.name}`}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">{invoice.client?.name}</TableCell>
              <TableCell>{invoice.session?.service_type?.name}</TableCell>
              <TableCell>
                {invoice.session?.date
                  ? new Date(invoice.session.date).toLocaleDateString('en-US', {
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
                {formatCurrency(invoice.amount)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge className={statusColors[status]}>
                    {isOverdue ? 'overdue' : invoice.status}
                  </Badge>
                  {isOverdue && (
                    <span className="text-xs text-red-600 dark:text-red-400">
                      {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} late
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Link href={`/invoices/${invoice.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </TableCell>
              {showActions && isAdmin && (
                <TableCell>
                  <InvoiceActions invoice={invoice} onStatusChange={onRefresh} />
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
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const supabaseRef = useRef(createClient())

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
    setSelectedIds(new Set()) // Clear selection on refresh
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
  const handleBulkMarkPaid = async () => {
    if (selectedIds.size === 0) return
    setBulkActionLoading(true)
    try {
      const supabase = supabaseRef.current
      const today = new Date().toISOString().split('T')[0]

      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid', paid_date: today })
        .in('id', Array.from(selectedIds))

      if (error) throw error

      toast.success(`Marked ${selectedIds.size} invoice(s) as paid`)
      handleRefresh()
    } catch (error) {
      console.error('Error marking invoices as paid:', error)
      toast.error('Failed to mark invoices as paid')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkMarkSent = async () => {
    if (selectedIds.size === 0) return
    setBulkActionLoading(true)
    try {
      const supabase = supabaseRef.current

      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .in('id', Array.from(selectedIds))
        .eq('status', 'pending') // Only update pending invoices

      if (error) throw error

      toast.success(`Marked ${selectedIds.size} invoice(s) as sent`)
      handleRefresh()
    } catch (error) {
      console.error('Error marking invoices as sent:', error)
      toast.error('Failed to mark invoices as sent')
    } finally {
      setBulkActionLoading(false)
    }
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

      // Check if user is admin/owner/developer
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>()

      const role = userProfile?.role
      const admin = role === 'admin' || role === 'owner' || role === 'developer'

      // Fetch invoices with related data
      // For contractors, only fetch invoices for their sessions
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

      // If not admin, filter to only show invoices for this contractor's sessions
      if (!admin) {
        // Get invoice IDs for sessions where this user is the contractor
        const { data: contractorSessions } = await supabase
          .from('sessions')
          .select('id')
          .eq('contractor_id', user.id)

        const sessionIds = contractorSessions?.map((s) => s.id) || []

        if (sessionIds.length === 0) {
          // No sessions, return empty array
          if (!cancelled) {
            setIsAdmin(admin)
            setInvoices([])
            setLoading(false)
          }
          return
        }

        query = query.in('session_id', sessionIds)
      }

      const { data } = await query

      if (!cancelled) {
        setIsAdmin(admin)
        setInvoices((data as unknown as Invoice[]) || [])
        setLoading(false)
      }
    }

    loadInvoices()

    return () => {
      cancelled = true
    }
  }, [refreshTrigger])

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

  // Calculate totals
  const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  const sentTotal = sentInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  const paidTotal = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
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
      <div className="grid gap-4 md:grid-cols-4">
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
              Sent / Awaiting Payment
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Paid This Month
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidTotal)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {paidInvoices.length} invoice{paidInvoices.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Action Bar */}
      {isAdmin && selectedIds.size > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
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
                  disabled={bulkActionLoading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMarkSent}
                  disabled={bulkActionLoading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Mark Sent
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkMarkPaid}
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading ? (
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
                  disabled={bulkActionLoading}
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
              <InvoiceTable invoices={paidInvoices} isAdmin={isAdmin} onRefresh={handleRefresh} showSelection selectedIds={selectedIds} onSelectChange={handleSelectChange} />
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
