'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Mail, Phone } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import { roleLabels } from '@/lib/constants/display'
import { useIsMobile } from '@/lib/hooks/use-is-mobile'
import { MobileListItem } from '@/components/mobile/list-item'
import { TeamMemberActions } from '@/components/team/team-member-actions'
import type { UserRole } from '@/types/database'

interface TeamMember {
  id: string
  email: string
  name: string
  phone: string | null
  role: UserRole
}

interface TeamMemberStats {
  sessionCount: number
  totalEarnings: number
  pendingPay: number
}

interface TeamMembersListProps {
  members: TeamMember[]
  userStats: Record<string, TeamMemberStats>
  canViewRates: boolean
  currentUserId: string
  currentUserRole: string
}

function roleBadgeClassName(role: string): string | undefined {
  if (role === 'developer') return 'bg-info text-info-foreground'
  if (role === 'owner') return 'bg-info-soft text-info-soft-foreground'
  return undefined
}

/**
 * Mobile: a stack of MobileListItem cards over the SAME members array and
 * the SAME userStats lookups the desktop <Table> below uses — only the
 * container markup differs. Exactly one of these two return statements
 * renders per useIsMobile() branch (Task 3.1,
 * docs/superpowers/plans/2026-08-05-mobile-experience.md), so the desktop
 * table stays byte-identical to what team/page.tsx rendered inline before
 * this component existed. team/page.tsx is a server component (cookies(),
 * redirect(), server Supabase client) so it cannot call useIsMobile()
 * itself — this file is the client boundary, same pattern as the
 * TeamMemberActions/TeamPageTabs/PayRateMatrix components it already
 * imports.
 */
export function TeamMembersList({
  members,
  userStats,
  canViewRates,
  currentUserId,
  currentUserRole,
}: TeamMembersListProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="space-y-2">
        {members.map((member) => {
          const stats = userStats[member.id] || { sessionCount: 0, totalEarnings: 0, pendingPay: 0 }
          return (
            <MobileListItem
              key={member.id}
              href={`/team/${member.id}/`}
              title={
                <span className="inline-flex items-center gap-2">
                  {member.name || 'Unnamed'}
                  <Badge
                    variant={member.role === 'contractor' ? 'secondary' : 'default'}
                    className={roleBadgeClassName(member.role)}
                  >
                    {roleLabels[member.role] || member.role}
                  </Badge>
                </span>
              }
              meta={
                <>
                  {member.email && <span>{member.email}</span>}
                  {canViewRates && (
                    <span className="w-full">
                      Earned {formatCurrency(stats.totalEarnings)}
                      {' · '}
                      {/* Amber only when money is actually pending — matches the
                          desktop column's zero-guard (a $0.00 alarm is noise). */}
                      {stats.pendingPay > 0 ? (
                        <span className="text-warning">Pending {formatCurrency(stats.pendingPay)}</span>
                      ) : (
                        <span>Pending —</span>
                      )}
                    </span>
                  )}
                </>
              }
            />
          )
        })}
      </div>
    )
  }

  return (
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
        {members.map((member) => {
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
                  className={roleBadgeClassName(member.role)}
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
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
