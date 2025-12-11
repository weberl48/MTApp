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
import { Users, Mail, Phone } from 'lucide-react'
import { AddClientDialog } from '@/components/forms/add-client-dialog'
import { ClientActions } from '@/components/clients/client-actions'
import type { Client } from '@/types/database'

const paymentMethodLabels: Record<string, string> = {
  private_pay: 'Private Pay',
  self_directed: 'Self-Directed',
  group_home: 'Group Home',
  scholarship: 'Scholarship',
}

export default async function ClientsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is admin
  let isAdmin = false
  if (user) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>()
    isAdmin = userProfile?.role === 'admin'
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
        {isAdmin && <AddClientDialog />}
      </div>

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
                  <TableHead>Notes</TableHead>
                  {isAdmin && <TableHead className="w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
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
                    <TableCell className="max-w-xs truncate">
                      {client.notes || '-'}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
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
              {isAdmin && <AddClientDialog />}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
