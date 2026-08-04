import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHelp } from '@/components/help/page-help'
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
import { formatCurrency } from '@/lib/pricing'
import { roleLabels } from '@/lib/constants/display'
import { can, canWithGrants, type AdminGrants } from '@/lib/auth/permissions'
import { fetchAdminGrants } from '@/lib/auth/admin-grants'
import { resolveEffectiveRole, VIEW_AS_COOKIE } from '@/lib/auth/view-as'
import type { UserRole } from '@/types/database'
import { Users, Calendar, DollarSign, Mail, Phone } from 'lucide-react'
import { AdminGuard } from '@/components/guards/admin-guard'
import { TeamMemberActions } from '@/components/team/team-member-actions'
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
      <div data-tour="team-stats" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-center">Sessions</TableHead>
                      {canViewRates && <TableHead className="text-right">Total Earned</TableHead>}
                      {canViewRates && <TableHead className="text-right">Pending Pay</TableHead>}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((member) => {
                      const stats = userStats[member.id] || { sessionCount: 0, totalEarnings: 0, pendingPay: 0 }
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="font-medium">{member.name || 'Unnamed'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {member.email && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {member.email}
                                </div>
                              )}
                              {member.phone && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {member.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={member.role === 'contractor' ? 'secondary' : 'default'}
                              className={
                                member.role === 'developer'
                                  ? 'bg-info text-info-foreground'
                                  : member.role === 'owner'
                                    ? 'bg-info-soft text-info-soft-foreground'
                                    : undefined
                              }
                            >
                              {roleLabels[member.role] || member.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {stats.sessionCount}
                          </TableCell>
                          {canViewRates && (
                            <TableCell className="text-right font-medium">
                              {formatCurrency(stats.totalEarnings)}
                            </TableCell>
                          )}
                          {canViewRates && (
                            <TableCell className="text-right">
                              {stats.pendingPay > 0 ? (
                                <span className="text-warning font-medium">
                                  {formatCurrency(stats.pendingPay)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <TeamMemberActions
                              member={{
                                id: member.id,
                                name: member.name,
                                role: member.role,
                              }}
                              currentUserId={user?.id || ''}
                              currentUserRole={currentUserRole}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
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
