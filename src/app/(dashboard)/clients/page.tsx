import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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
import { Users, Mail, Phone, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddClientDialog } from '@/components/forms/add-client-dialog'
import { ClientActions } from '@/components/clients/client-actions'
import type { Client, UserRole } from '@/types/database'
import { paymentMethodLabels, billingMethodLabels } from '@/lib/constants/display'
import { can } from '@/lib/auth/permissions'

export default async function ClientsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user can manage clients (admin, owner, or developer)
  let canManageClients = false
  if (user) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>()
    canManageClients = can(userProfile?.role as UserRole ?? null, 'team:view')
  }

  // Fetch all clients
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your client list and contact information
          </p>
        </div>
        {canManageClients && (
          <AddClientDialog
            trigger={
              <Button size="lg" className="gap-2">
                <UserPlus className="h-5 w-5" />
                Add Client
              </Button>
            }
          />
        )}
      </div>

      {/* Quick Stats */}
      {canManageClients && clients && clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{clients.length}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">Quick Add</p>
                  <AddClientDialog
                    trigger={
                      <Button size="sm" variant="outline" className="gap-1 border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300">
                        <UserPlus className="h-4 w-4" />
                        Add & Invite Client
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>{clients?.length || 0} clients total</CardDescription>
        </CardHeader>
        <CardContent>
          {clients && clients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Notes</TableHead>
                  {canManageClients && <TableHead className="w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="relative cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <TableCell className="font-medium">
                      <Link href={`/clients/${client.id}`} className="after:absolute after:inset-0">
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell className="relative z-10">
                      <div className="space-y-1">
                        {client.contact_email && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Mail className="w-3 h-3" />
                            <a
                              href={`mailto:${client.contact_email}`}
                              className="hover:underline"
                            >
                              {client.contact_email}
                            </a>
                          </div>
                        )}
                        {client.contact_phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="w-3 h-3" />
                            <a
                              href={`tel:${client.contact_phone}`}
                              className="hover:underline"
                            >
                              {client.contact_phone}
                            </a>
                          </div>
                        )}
                        {!client.contact_email && !client.contact_phone && (
                          <span className="text-sm text-gray-400">No contact info</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {paymentMethodLabels[client.payment_method] || client.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {billingMethodLabels[client.billing_method] || 'Square'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {client.notes || '-'}
                    </TableCell>
                    {canManageClients && (
                      <TableCell className="relative z-10">
                        <ClientActions client={client as Client} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No clients yet</p>
              {canManageClients && <AddClientDialog />}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
