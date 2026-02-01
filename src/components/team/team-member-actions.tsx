'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { removeTeamMember } from '@/app/actions/team'
import Link from 'next/link'

interface TeamMemberActionsProps {
  member: {
    id: string
    name: string | null
    role: string
  }
  currentUserId: string
  currentUserRole: string
}

export function TeamMemberActions({ member, currentUserId, currentUserRole }: TeamMemberActionsProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Check if current user can remove this member
  const canRemove = (() => {
    // Can't remove yourself
    if (member.id === currentUserId) return false

    // Developers can remove anyone
    if (currentUserRole === 'developer') return true

    // Owners can remove admins and contractors
    if (currentUserRole === 'owner') {
      return member.role !== 'owner' && member.role !== 'developer'
    }

    // Admins can only remove contractors
    if (currentUserRole === 'admin') {
      return member.role === 'contractor'
    }

    return false
  })()

  function handleRemove() {
    startTransition(async () => {
      const result = await removeTeamMember(member.id)
      if (result.success) {
        toast.success(`${member.name || 'Team member'} has been removed`)
        setDeleteOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to remove team member')
      }
    })
  }

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/team/${member.id}`} className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          {canRemove && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onSelect={(e) => {
                  e.preventDefault()
                  setDeleteOpen(true)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Member
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{member.name || 'this team member'}</strong>?
              This will revoke their access to the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
