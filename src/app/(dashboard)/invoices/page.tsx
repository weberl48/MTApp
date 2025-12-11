'use client'

import { useEffect, useState } from 'react'
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
import { FileText, Clock, CheckCircle, Loader2, AlertTriangle, Eye } from 'lucide-react'
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
  isAdmin
}: {
  invoices: Invoice[]
  showActions?: boolean
  isAdmin: boolean
}) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No invoices in this category</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
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
            <TableRow key={invoice.id}>
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
                  <InvoiceActions invoice={invoice} />
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

  useEffect(() => {
    async function loadInvoices() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>()

      const admin = userProfile?.role === 'admin'
      setIsAdmin(admin)

      // Fetch invoices with related data
      const { data } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, name, contact_email),
          session:sessions(
            id,
            date,
            contractor:users(id, name),
            service_type:service_types(name)
          )
        `)
        .order('created_at', { ascending: false })

      setInvoices((data as unknown as Invoice[]) || [])
      setLoading(false)
    }

    loadInvoices()
  }, [])

  // Group invoices by status
  const pendingInvoices = invoices?.filter((inv) => inv.status === 'pending') || []
  const sentInvoices = invoices?.filter((inv) => inv.status === 'sent') || []
  const paidInvoices = invoices?.filter((inv) => inv.status === 'paid') || []
  const overdueInvoices = sentInvoices.filter((inv) => getInvoiceStatus(inv).isOverdue)

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

      {/* Invoice Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            {invoices?.length || 0} invoices total
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
            </TabsList>
            {overdueInvoices.length > 0 && (
              <TabsContent value="overdue">
                <InvoiceTable invoices={overdueInvoices} showActions isAdmin={isAdmin} />
              </TabsContent>
            )}
            <TabsContent value="pending">
              <InvoiceTable invoices={pendingInvoices} showActions isAdmin={isAdmin} />
            </TabsContent>
            <TabsContent value="sent">
              <InvoiceTable invoices={sentInvoices} showActions isAdmin={isAdmin} />
            </TabsContent>
            <TabsContent value="paid">
              <InvoiceTable invoices={paidInvoices} isAdmin={isAdmin} />
            </TabsContent>
            <TabsContent value="all">
              <InvoiceTable invoices={invoices || []} showActions isAdmin={isAdmin} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
