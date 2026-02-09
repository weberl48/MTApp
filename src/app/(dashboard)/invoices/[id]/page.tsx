'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  User,
  DollarSign,
  FileText,
  Loader2,
  ExternalLink,
  Clock,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/pricing'
import { can } from '@/lib/auth/permissions'
import type { UserRole, InvoiceItem } from '@/types/database'
import { format } from 'date-fns'
import { InvoiceActions } from '@/components/forms/invoice-actions'
import type { PaymentMethod, InvoiceStatus } from '@/types/database'

interface InvoiceDetails {
  id: string
  session_id: string | null
  client_id: string
  amount: number
  mca_cut: number
  contractor_pay: number
  rent_amount: number
  status: InvoiceStatus
  payment_method: PaymentMethod
  invoice_type: string
  billing_period: string | null
  due_date: string | null
  paid_date: string | null
  square_invoice_id: string | null
  square_payment_url: string | null
  organization_id: string
  created_at: string
  updated_at: string
  client: { id: string; name: string; contact_email: string | null } | null
  session: {
    id: string
    date: string
    time: string | null
    duration_minutes: number
    contractor: { id: string; name: string } | null
    service_type: { name: string } | null
  } | null
}

interface AuditLog {
  id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_fields: string[] | null
  user_email: string | null
  created_at: string
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

const ACTION_ICONS = {
  INSERT: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
}

const ACTION_COLORS = {
  INSERT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function getActivityDescription(log: AuditLog): string {
  if (log.action === 'INSERT') {
    return 'Invoice created'
  }
  if (log.action === 'DELETE') {
    return 'Invoice deleted'
  }
  if (log.action === 'UPDATE' && log.changed_fields) {
    const statusChange = log.changed_fields.includes('status')
    if (statusChange) {
      const newStatus = log.new_data?.status as string
      const oldStatus = log.old_data?.status as string
      if (newStatus === 'sent') {
        return 'Invoice sent to client'
      }
      if (newStatus === 'paid') {
        return 'Invoice marked as paid'
      }
      return `Status changed from ${oldStatus} to ${newStatus}`
    }
    return `Updated: ${log.changed_fields.join(', ')}`
  }
  return 'Invoice modified'
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function loadInvoice() {
      const supabase = createClient()
      const invoiceId = params.id as string

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login/')
        return
      }

      // Get user role
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>()

      const admin = can(userProfile?.role as UserRole, 'invoice:bulk-action')
      setIsAdmin(admin)

      // Fetch invoice with related data
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, name, contact_email),
          session:sessions(
            id,
            date,
            time,
            duration_minutes,
            contractor:users(id, name),
            service_type:service_types(name)
          )
        `)
        .eq('id', invoiceId)
        .single()

      if (error || !invoiceData) {
        console.error('[MCA] Error loading invoice')
        setLoading(false)
        return
      }

      setInvoice(invoiceData as unknown as InvoiceDetails)

      // Fetch invoice items for batch invoices
      if ((invoiceData as Record<string, unknown>).invoice_type === 'batch') {
        const { data: items } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('session_date', { ascending: true })

        setInvoiceItems((items as InvoiceItem[]) || [])
      }

      // Fetch activity logs for this invoice
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('id, action, old_data, new_data, changed_fields, user_email, created_at')
        .eq('table_name', 'invoices')
        .eq('record_id', invoiceId)
        .order('created_at', { ascending: false })

      setActivityLogs((logs as AuditLog[]) || [])
      setLoading(false)
    }

    loadInvoice()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Invoice not found</h2>
        <p className="text-gray-500 mb-4">This invoice may have been deleted or you don&apos;t have access.</p>
        <Link href="/invoices">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
      </div>
    )
  }

  // Calculate overdue status
  const isOverdue = invoice.status === 'sent' && invoice.due_date && new Date() > new Date(invoice.due_date)
  const daysOverdue = isOverdue && invoice.due_date
    ? Math.ceil((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Invoice for {invoice.client?.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {invoice.invoice_type === 'batch' && invoice.billing_period
                ? `Monthly Statement - ${new Date(invoice.billing_period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} (${invoiceItems.length} sessions)`
                : `${invoice.session?.service_type?.name} - ${invoice.session?.date && new Date(invoice.session.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            <Badge className={isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : statusColors[invoice.status]}>
              {isOverdue ? 'Overdue' : invoice.status}
            </Badge>
            {isOverdue && (
              <span className="text-xs text-red-600">{daysOverdue} days late</span>
            )}
          </div>
          {isAdmin && <InvoiceActions invoice={invoice} />}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Billing information for this invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{invoice.client?.name}</p>
                {invoice.client?.contact_email && (
                  <p className="text-sm text-gray-500">{invoice.client.contact_email}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(invoice.amount)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium">{paymentMethodLabels[invoice.payment_method] || invoice.payment_method}</p>
              </div>
            </div>

            {invoice.due_date && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {invoice.paid_date && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Paid Date</p>
                  <p className="font-medium text-green-600">{new Date(invoice.paid_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {invoice.square_payment_url && (
              <div className="pt-2">
                <a href={invoice.square_payment_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Square
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Breakdown</CardTitle>
            <CardDescription>Revenue distribution for this invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-medium">{formatCurrency(invoice.amount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between py-2">
              <span className="text-gray-500">MCA Cut</span>
              <span className="font-medium">{formatCurrency(invoice.mca_cut)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Contractor Pay</span>
              <span className="font-medium text-green-600">{formatCurrency(invoice.contractor_pay)}</span>
            </div>
            {invoice.rent_amount > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Rent</span>
                <span className="font-medium">{formatCurrency(invoice.rent_amount)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session Info — batch invoices show itemized sessions */}
      {invoice.invoice_type === 'batch' && invoiceItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sessions Included</CardTitle>
            <CardDescription>
              {invoiceItems.length} session{invoiceItems.length !== 1 ? 's' : ''} in this monthly invoice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.session_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>{item.service_type_name}</TableCell>
                    <TableCell>{item.contractor_name}</TableCell>
                    <TableCell className="text-right">{item.duration_minutes} min</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell colSpan={4} className="text-right">Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.amount)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : invoice.session ? (
        <Card>
          <CardHeader>
            <CardTitle>Related Session</CardTitle>
            <CardDescription>Session details for this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium">{invoice.session.service_type?.name}</p>
                <div className="flex flex-wrap gap-x-4 text-sm text-gray-500">
                  <span>
                    {new Date(invoice.session.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span>{invoice.session.duration_minutes} min</span>
                  {invoice.session.contractor && (
                    <span>by {invoice.session.contractor.name}</span>
                  )}
                </div>
              </div>
              <Link href={`/sessions/${invoice.session.id}`}>
                <Button variant="outline" size="sm">
                  View Session
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>History of changes to this invoice</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLogs.length > 0 ? (
            <div className="space-y-4">
              {activityLogs.map((log) => {
                const ActionIcon = ACTION_ICONS[log.action]
                return (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ACTION_COLORS[log.action]}`}>
                        <ActionIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{getActivityDescription(log)}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}</span>
                        {log.user_email && (
                          <>
                            <span>by</span>
                            <span>{log.user_email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No activity recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p>Created: {new Date(invoice.created_at).toLocaleString()}</p>
        <p>Last updated: {new Date(invoice.updated_at).toLocaleString()}</p>
      </div>
    </div>
  )
}
