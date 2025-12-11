'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ClientDialog } from '@/components/forms/add-client-dialog'
import type { Client } from '@/types/database'

interface ClientActionsProps {
  client: Client
}

export function ClientActions({ client }: ClientActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)

    try {
      // Check if client has any sessions
      const { count } = await supabase
        .from('session_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id)

      if (count && count > 0) {
        toast.error(`Cannot delete: ${client.name} has ${count} session record(s). Remove them from sessions first.`)
        setDeleteOpen(false)
        setDeleting(false)
        return
      }

      // Check if client has any invoices
      const { count: invoiceCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id)

      if (invoiceCount && invoiceCount > 0) {
        toast.error(`Cannot delete: ${client.name} has ${invoiceCount} invoice(s).`)
        setDeleteOpen(false)
        setDeleting(false)
        return
      }

      // Safe to delete
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id)

      if (error) throw error

      toast.success('Client deleted successfully')
      setDeleteOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <ClientDialog client={client} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{client.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
