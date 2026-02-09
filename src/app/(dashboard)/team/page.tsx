import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'
import { Users, Calendar, DollarSign, Mail, Phone } from 'lucide-react'
import { AdminGuard } from '@/components/guards/admin-guard'
import { TeamMemberActions } from '@/components/team/team-member-actions'
import { TeamPageTabs } from '@/components/team/team-page-tabs'
import { PayRateMatrix } from '@/components/team/pay-rate-matrix'

export default async function TeamPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is admin
  let isAdmin = false
  let currentUserRole = ''
  if (user) {
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>()

    if (profileError) {
      console.error('[MCA] Failed to load user profile for team page')
    }
    const role = userProfile?.role
    currentUserRole = role || ''
    isAdmin = can(role as UserRole, 'team:view')
  }

  if (!isAdmin) {
    redirect('/dashboard/')
  }

  const canManage = can(currentUserRole as UserRole, 'team:manage')

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage contractors and view their performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Team Members
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalAdmins} admin{totalAdmins !== 1 ? 's' : ''}, {totalContractors} contractor{totalContractors !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Sessions
            </CardTitle>
            <Calendar className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending Contractor Pay
            </CardTitle>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPendingPay)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Contractors
            </CardTitle>
            <Users className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalContractors}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
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
                      <TableHead className="text-right">Total Earned</TableHead>
                      <TableHead className="text-right">Pending Pay</TableHead>
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
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {member.email && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {member.email}
                                </div>
                              )}
                              {member.phone && (
                                <div className="flex items-center text-sm text-gray-500">
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
                                  ? 'bg-purple-600 text-white dark:bg-purple-500'
                                  : member.role === 'owner'
                                    ? 'bg-amber-600 text-white dark:bg-amber-500'
                                    : undefined
                              }
                            >
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {stats.sessionCount}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(stats.totalEarnings)}
                          </TableCell>
                          <TableCell className="text-right">
                            {stats.pendingPay > 0 ? (
                              <span className="text-amber-600 font-medium">
                                {formatCurrency(stats.pendingPay)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
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
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No team members found</p>
                </div>
              )
            }
            ratesContent={
              users?.[0]?.organization_id ? (
                <PayRateMatrix
                  organizationId={users[0].organization_id}
                  canEdit={canManage}
                />
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No team members found
                </div>
              )
            }
          />
        </CardContent>
      </Card>
    </div>
    </AdminGuard>
  )
}
