import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Phone, CreditCard, FileText, Calendar } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { decryptField } from '@/lib/crypto'
import { formatCurrency } from '@/lib/pricing'
import { parseLocalDate } from '@/lib/dates'

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

import { paymentMethodLabels, billingMethodLabels, sessionStatusColors, invoiceStatusColors } from '@/lib/constants/display'

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login/')
  }

  // Get user profile to check permissions
  const { data: profile } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login/')
  }

  // Fetch the client
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !client) {
    notFound()
  }

  // Verify organization access
  if (client.organization_id !== profile.organization_id && profile.role !== 'developer') {
    notFound()
  }

  // Decrypt client notes if encrypted
  const decryptedNotes = client.notes ? await decryptField(client.notes) : null

  // Fetch sessions for this client via session_attendees
  const { data: attendeeRows } = await supabase
    .from('session_attendees')
    .select(`
      session:sessions(
        id,
        date,
        status,
        duration_minutes,
        service_type:service_types(name),
        contractor:users(name)
      )
    `)
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  type SessionRow = {
    id: string
    date: string
    status: string
    duration_minutes: number
    service_type: { name: string } | null
    contractor: { name: string } | null
  }

  const clientSessions = (attendeeRows || [])
    .map((row) => row.session as unknown as SessionRow)
    .filter(Boolean)
    .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())

  // Fetch invoices for this client
  const { data: clientInvoices } = await supabase
    .from('invoices')
    .select('id, amount, status, due_date, created_at, payment_method, invoice_type')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const sessionCount = clientSessions.length
  const pendingInvoiceCount = (clientInvoices || []).filter((inv) => inv.status === 'pending').length

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Clients', href: '/clients/' },
        { label: client.name },
      ]} />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{client.name}</h1>
        <p className="text-muted-foreground">Client Details</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.contact_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${client.contact_email}`} className="text-blue-600 hover:underline">
                  {client.contact_email}
                </a>
              </div>
            )}

            {client.contact_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${client.contact_phone}`} className="text-blue-600 hover:underline">
                  {client.contact_phone}
                </a>
              </div>
            )}

            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <Badge variant="outline">
                {paymentMethodLabels[client.payment_method] || client.payment_method}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Billing:</span>
              <Badge variant="secondary">
                {billingMethodLabels[client.billing_method] || 'Square'}
              </Badge>
            </div>

            {decryptedNotes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-500">{decryptedNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Total Sessions</span>
              </div>
              <span className="font-semibold">{sessionCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="h-4 w-4" />
                <span>Pending Invoices</span>
              </div>
              <Badge variant={pendingInvoiceCount > 0 ? 'destructive' : 'secondary'}>
                {pendingInvoiceCount}
              </Badge>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Tabs for Sessions and Invoices */}
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList>
          <TabsTrigger value="sessions">Sessions ({sessionCount})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({clientInvoices?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Recent sessions with {client.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {clientSessions.length > 0 ? (
                <div className="space-y-2">
                  {clientSessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}/`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {session.service_type?.name || 'Unknown Service'}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${sessionStatusColors[session.status] || sessionStatusColors.draft}`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {parseLocalDate(session.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {' · '}{session.duration_minutes} min
                          {session.contractor?.name && ` · ${session.contractor.name}`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No sessions found for this client.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Invoice history for {client.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {clientInvoices && clientInvoices.length > 0 ? (
                <div className="space-y-2">
                  {clientInvoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}/`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {formatCurrency(invoice.amount)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${invoiceStatusColors[invoice.status] || invoiceStatusColors.pending}`}>
                            {invoice.status}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {paymentMethodLabels[invoice.payment_method] || invoice.payment_method}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {new Date(invoice.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {invoice.due_date && ` · Due ${new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No invoices found for this client.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
