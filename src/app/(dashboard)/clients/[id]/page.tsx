import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Mail, Phone, CreditCard, FileText, Calendar, Key, Copy, Check } from 'lucide-react'
import { ClientResourcesManager } from '@/components/portal/client-resources-manager'
import { ClientPortalAccess } from '@/components/clients/client-portal-access'

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

const paymentMethodLabels: Record<string, string> = {
  private_pay: 'Private Pay',
  self_directed: 'Self-Directed',
  group_home: 'Group Home',
  scholarship: 'Scholarship',
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile to check permissions
  const { data: profile } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
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

  const isAdmin = ['admin', 'owner', 'developer'].includes(profile.role)

  // Get session count for this client
  const { count: sessionCount } = await supabase
    .from('session_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', id)

  // Get pending invoice count
  const { count: pendingInvoiceCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', id)
    .eq('status', 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">Client Details</p>
        </div>
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

            {client.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-500">{client.notes}</p>
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
              <span className="font-semibold">{sessionCount || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="h-4 w-4" />
                <span>Pending Invoices</span>
              </div>
              <Badge variant={pendingInvoiceCount && pendingInvoiceCount > 0 ? 'destructive' : 'secondary'}>
                {pendingInvoiceCount || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Portal Access Card */}
        {isAdmin && (
          <ClientPortalAccess clientId={id} clientEmail={client.contact_email} />
        )}
      </div>

      {/* Tabs for Resources and other sections */}
      <Tabs defaultValue="resources" className="w-full">
        <TabsList>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="mt-4">
          <ClientResourcesManager clientId={id} clientName={client.name} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Recent sessions with {client.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                View sessions on the <Link href="/sessions" className="text-blue-600 hover:underline">Sessions page</Link>
              </p>
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
              <p className="text-gray-500 text-center py-8">
                View invoices on the <Link href="/invoices" className="text-blue-600 hover:underline">Invoices page</Link>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
