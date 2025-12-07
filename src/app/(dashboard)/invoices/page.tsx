'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, DollarSign, Clock, CheckCircle, Loader2 } from 'lucide-react'
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
}

const paymentMethodLabels: Record<string, string> = {
  private_pay: 'Private Pay',
  self_directed: 'Self-Directed',
  group_home: 'Group Home',
  scholarship: 'Scholarship',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoices()
  }, [])

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

  // Group invoices by status
  const pendingInvoices = invoices?.filter((inv) => inv.status === 'pending') || []
  const sentInvoices = invoices?.filter((inv) => inv.status === 'sent') || []
  const paidInvoices = invoices?.filter((inv) => inv.status === 'paid') || []

  // Calculate totals
  const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  const sentTotal = sentInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  const paidTotal = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)

  function InvoiceTable({ invoices, showActions = false }: { invoices: Invoice[]; showActions?: boolean }) {
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
            {showActions && isAdmin && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
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
                <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
              </TableCell>
              {showActions && isAdmin && (
                <TableCell>
                  <InvoiceActions invoice={invoice} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

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
      <div className="grid gap-4 md:grid-cols-3">
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
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
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
            <TabsContent value="pending">
              <InvoiceTable invoices={pendingInvoices} showActions />
            </TabsContent>
            <TabsContent value="sent">
              <InvoiceTable invoices={sentInvoices} showActions />
            </TabsContent>
            <TabsContent value="paid">
              <InvoiceTable invoices={paidInvoices} />
            </TabsContent>
            <TabsContent value="all">
              <InvoiceTable invoices={invoices || []} showActions />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
