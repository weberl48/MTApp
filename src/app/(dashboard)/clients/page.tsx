import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Users, UserPlus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddClientDialog } from '@/components/forms/add-client-dialog'
import { ClientsTable } from '@/components/clients/clients-table'
import type { Client, UserRole } from '@/types/database'
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

  const allClients = (clients || []) as Client[]
  const noContactCount = allClients.filter(c => !c.contact_email && !c.contact_phone).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
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
      {canManageClients && allClients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{allClients.length}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{noContactCount}</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">Missing Contact Info</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <ClientsTable clients={allClients} canManageClients={canManageClients} />
        </CardContent>
      </Card>
    </div>
  )
}
