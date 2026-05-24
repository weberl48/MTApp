'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus } from 'lucide-react'
import { ContractorInvite } from '@/components/invites/contractor-invite'

export function InviteTeamMemberDialog({ organizationId }: { organizationId: string }) {
  const [role, setRole] = useState<'contractor' | 'admin'>('contractor')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invite link to add a new team member to your organization.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite_role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'contractor' | 'admin')}>
              <SelectTrigger id="invite_role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {role === 'contractor'
                ? 'Can log sessions and view their own data.'
                : 'Can manage clients, sessions, invoices, and view the team.'}
            </p>
          </div>
          <ContractorInvite organizationId={organizationId} role={role} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
