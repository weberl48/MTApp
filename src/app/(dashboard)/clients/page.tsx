import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddClientDialog } from '@/components/forms/add-client-dialog'
import { ClientsTable } from '@/components/clients/clients-table'
import type { Client, UserRole } from '@/types/database'
import { can } from '@/lib/auth/permissions'
import { decryptField, isEncrypted } from '@/lib/crypto'

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

  // Decrypt notes SERVER-SIDE. `notes` is PHI encrypted at rest; the list previously rendered the
  // raw value, so any client edited since encryption was enabled showed an `enc:...` ciphertext
  // blob in the table + tooltip. ENCRYPTION_KEY is server-only, so this must happen here.
  const allClients = await Promise.all(
    ((clients || []) as Client[]).map(async (c) => ({
      ...c,
      notes: c.notes && isEncrypted(c.notes) ? await decryptField(c.notes) : c.notes,
    }))
  )
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
          <div data-tour="clients-add-button">
          <AddClientDialog
            trigger={
              <Button size="lg" className="gap-2">
                <UserPlus className="h-5 w-5" />
                Add Client
              </Button>
            }
          />
          </div>
        )}
      </div>

      {/* Quick Stats — same card pattern as the dashboard/team/payroll stat cards */}
      {canManageClients && allClients.length > 0 && (
        <div data-tour="clients-stats" className="grid grid-cols-2 gap-4">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clients
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allClients.length}</div>
            </CardContent>
          </Card>
          <Card className="h-full border-amber-200 dark:border-amber-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Missing Contact Info
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{noContactCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card data-tour="clients-table">
        <CardContent className="pt-6">
          <ClientsTable clients={allClients} canManageClients={canManageClients} />
        </CardContent>
      </Card>
    </div>
  )
}
