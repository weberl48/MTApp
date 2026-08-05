import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHelp } from '@/components/help/page-help'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/pricing'
import { can, canWithGrants, type AdminGrants } from '@/lib/auth/permissions'
import { fetchAdminGrants } from '@/lib/auth/admin-grants'
import { resolveEffectiveRole, VIEW_AS_COOKIE } from '@/lib/auth/view-as'
import type { UserRole } from '@/types/database'
import { Users, Calendar, DollarSign } from 'lucide-react'
import { AdminGuard } from '@/components/guards/admin-guard'
import { TeamMembersList } from '@/components/team/team-members-list'
import { TeamPageTabs } from '@/components/team/team-page-tabs'
import { PayRateMatrix } from '@/components/team/pay-rate-matrix'
import { InviteTeamMemberDialog } from '@/components/team/invite-team-member-dialog'

export default async function TeamPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is admin
  let isAdmin = false
  let currentUserRole = ''
  let adminGrants: AdminGrants = {}
  if (user) {
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single<{ role: string; organization_id: string }>()

    if (profileError) {
      console.error('[MCA] Failed to load user profile for team page')
    }
    // Honour the "View As" switcher. This is a SERVER component, so it cannot
    // read OrganizationContext; without the cookie it gated on the real role and
    // showed a developer previewing "As Admin" the Rates tab, the Pending
    // Contractor Pay card and every contractor's earnings — exactly the figures
    // an admin must never see. resolveEffectiveRole re-validates against the
    // real role, so the cookie can only narrow access, never widen it.
    const viewAs = (await cookies()).get(VIEW_AS_COOKIE)?.value
    const role = resolveEffectiveRole((userProfile?.role as UserRole) ?? null, viewAs)
    currentUserRole = role || ''
    isAdmin = can(role as UserRole, 'team:view')
    adminGrants = await fetchAdminGrants(supabase, userProfile?.organization_id)
  }

  if (!isAdmin) {
    redirect('/dashboard/')
  }

  const canManage = can(currentUserRole as UserRole, 'team:manage')
  const canInvite = can(currentUserRole as UserRole, 'team:invite')
  // Admins reach this page via team:view but must not see contractor pay rates —
  // or, below, what each contractor has earned. The owner can grant this back.
  const canViewRates = canWithGrants(currentUserRole as UserRole, 'team:view-rates', adminGrants)

  // Fetch all users with their session and invoice stats
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('name')

  if (usersError) {
    console.error('[MCA] Failed to fetch team members')
  }

  // Get session counts per contractor
  const { data: sessionCounts } = await supabase
    .from('sessions')
    .select('contractor_id, id')

  // Get invoice totals per contractor
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      amount,
      contractor_pay,
      status,
      session:sessions(contractor_id)
    `)

  // Calculate stats per user
  const userStats: Record<string, {
    sessionCount: number
    totalEarnings: number
    pendingPay: number
  }> = {}

  users?.forEach(u => {
    userStats[u.id] = { sessionCount: 0, totalEarnings: 0, pendingPay: 0 }
  })

  sessionCounts?.forEach(s => {
    if (userStats[s.contractor_id]) {
      userStats[s.contractor_id].sessionCount++
    }
  })

  invoices?.forEach(inv => {
    const contractorId = (inv.session as { contractor_id?: string } | null)?.contractor_id
    if (contractorId && userStats[contractorId]) {
      userStats[contractorId].totalEarnings += Number(inv.contractor_pay)
      if (inv.status !== 'paid') {
        userStats[contractorId].pendingPay += Number(inv.contractor_pay)
      }
    }
  })

  // Summary stats
  const totalContractors = users?.filter(u => u.role === 'contractor').length || 0
  const totalAdmins = users?.filter(u => u.role === 'admin').length || 0
  const totalSessions = sessionCounts?.length || 0
  const totalPendingPay = Object.values(userStats).reduce((sum, s) => sum + s.pendingPay, 0)

  return (
    <AdminGuard>
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold">Team Management</h1>
            <PageHelp article="inviting-team-members" />
          </div>
          <p className="text-muted-foreground">
            Manage contractors and view their performance
          </p>
        </div>
        {canInvite && users?.[0]?.organization_id && (
          <div data-tour="team-invite-button">
            <InviteTeamMemberDialog organizationId={users[0].organization_id} />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div data-tour="team-stats" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Team Members
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {totalAdmins} admin{totalAdmins !== 1 ? 's' : ''}, {totalContractors} contractor{totalContractors !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sessions
            </CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        {canViewRates && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Contractor Pay
              </CardTitle>
              <DollarSign className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{formatCurrency(totalPendingPay)}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting payment
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Contractors
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContractors}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card data-tour="team-members-card">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            All users with access to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamPageTabs
            overviewContent={
              users && users.length > 0 ? (
                <TeamMembersList
                  members={users}
                  userStats={userStats}
                  canViewRates={canViewRates}
                  currentUserId={user?.id || ''}
                  currentUserRole={currentUserRole}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No team members found</p>
                </div>
              )
            }
            ratesContent={
              canViewRates
                ? users?.[0]?.organization_id
                  ? (
                    <div>
                      <PayRateMatrix
                        organizationId={users[0].organization_id}
                        canEdit={canManage}
                      />
                    </div>
                  )
                  : (
                    <div className="text-center py-8 text-muted-foreground">
                      No team members found
                    </div>
                  )
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
    </AdminGuard>
  )
}
