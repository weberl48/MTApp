'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Plus, Search, CheckCircle, Trash2, Pencil, ClipboardList, DollarSign, Clock } from 'lucide-react'
import { AdminGuard } from '@/components/guards/admin-guard'
import { AdminWorkForm } from '@/components/forms/admin-work-form'
import { useOrganization } from '@/contexts/organization-context'
import { approveAdminWork, bulkApproveAdminWork, deleteAdminWork } from '@/app/actions/admin-work'
import { adminWorkStatusColors, adminWorkStatusLabels } from '@/lib/constants/display'
import { formatCurrency } from '@/lib/pricing'
import { format } from 'date-fns'
import { parseLocalDate } from '@/lib/dates'
import { toast } from 'sonner'
import type { AdminWork, ServiceType } from '@/types/database'

interface AdminWorkWithUser extends AdminWork {
  admin_user: { id: string; name: string; email: string } | null
}

export default function AdminWorkPage() {
  const { can } = useOrganization()
  const [entries, setEntries] = useState<AdminWorkWithUser[]>([])
  const [admins, setAdmins] = useState<Array<{ id: string; name: string }>>([])
  const [adminServiceType, setAdminServiceType] = useState<ServiceType | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formDialog, setFormDialog] = useState<{ isOpen: boolean; entry?: AdminWork }>({ isOpen: false })
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; entry: AdminWorkWithUser | null }>({ isOpen: false, entry: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const loadData = useCallback(async () => {
    const supabase = createClient()

    const [{ data: entriesData }, { data: adminsData }] = await Promise.all([
      supabase
        .from('admin_work')
        .select(`
          *,
          admin_user:users!admin_user_id(id, name, email)
        `)
        .order('date', { ascending: false }),
      supabase
        .from('users')
        .select('id, name')
        .eq('role', 'admin'),
    ])

    // Find the admin service type: first try requires_client=false, then fall back to name match
    let { data: adminSt } = await supabase
      .from('service_types')
      .select('*')
      .eq('requires_client', false)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!adminSt) {
      const { data: fallback } = await supabase
        .from('service_types')
        .select('*')
        .ilike('name', '%admin%')
        .eq('is_active', true)
        .limit(1)
        .single()
      adminSt = fallback
    }

    setEntries((entriesData as unknown as AdminWorkWithUser[]) || [])
    setAdmins(adminsData || [])
    setAdminServiceType((adminSt as unknown as ServiceType) || null)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.admin_user?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const submittedEntries = entries.filter((e) => e.status === 'submitted')
  const totalPending = entries
    .filter((e) => !e.paid_date)
    .reduce((sum, e) => sum + Number(e.pay_amount), 0)
  const totalEntries = entries.length

  async function handleApprove(id: string) {
    const result = await approveAdminWork(id)
    if (result.success) {
      toast.success('Admin work approved')
      void loadData()
    } else {
      toast.error(result.error || 'Failed to approve')
    }
  }

  async function handleBulkApprove() {
    const ids = Array.from(selectedIds)
    const result = await bulkApproveAdminWork(ids)
    if (result.success) {
      toast.success(`${ids.length} entries approved`)
      setSelectedIds(new Set())
      void loadData()
    } else {
      toast.error(result.error || 'Failed to approve')
    }
  }

  async function handleDelete() {
    if (!deleteDialog.entry) return
    setIsDeleting(true)
    try {
      const result = await deleteAdminWork(deleteDialog.entry.id)
      if (result.success) {
        toast.success('Admin work deleted')
        setDeleteDialog({ isOpen: false, entry: null })
        void loadData()
      } else {
        toast.error(result.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  function toggleSelectAll() {
    const submittedFiltered = filteredEntries.filter((e) => e.status === 'submitted')
    if (selectedIds.size === submittedFiltered.length && submittedFiltered.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(submittedFiltered.map((e) => e.id)))
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Work</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Track administrative tasks and pay for admin team members
            </p>
          </div>
          {can('admin-work:create') && (
            <Button onClick={() => setFormDialog({ isOpen: true })}>
              <Plus className="mr-2 h-4 w-4" />
              New Admin Work
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Entries
              </CardTitle>
              <ClipboardList className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEntries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Approval
              </CardTitle>
              <Clock className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{submittedEntries.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Unpaid Total
              </CardTitle>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and bulk actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Admin Work Entries</CardTitle>
                <CardDescription>
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-56"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedIds.size > 0 && can('admin-work:approve') && (
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" onClick={handleBulkApprove}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve {selectedIds.size} selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
                  Clear selection
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {can('admin-work:approve') && (
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={
                            filteredEntries.filter((e) => e.status === 'submitted').length > 0 &&
                            selectedIds.size === filteredEntries.filter((e) => e.status === 'submitted').length
                          }
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                    )}
                    <TableHead>Date</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Duration</TableHead>
                    <TableHead className="text-right">Pay</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={can('admin-work:approve') ? 8 : 7} className="h-24 text-center text-gray-500">
                        {entries.length === 0
                          ? 'No admin work entries yet'
                          : 'No entries match your filters'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        {can('admin-work:approve') && (
                          <TableCell>
                            {entry.status === 'submitted' && (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(entry.id)}
                                onChange={() => toggleSelect(entry.id)}
                                className="rounded border-gray-300"
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell className="whitespace-nowrap">
                          {format(parseLocalDate(entry.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{entry.admin_user?.name || 'Unknown'}</div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {entry.description}
                        </TableCell>
                        <TableCell className="text-center">{entry.duration_minutes} min</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(entry.pay_amount))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={adminWorkStatusColors[entry.status] || ''}>
                            {adminWorkStatusLabels[entry.status] || entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {entry.status === 'submitted' && can('admin-work:approve') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                                onClick={() => handleApprove(entry.id)}
                                title="Approve"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {!entry.paid_date && can('admin-work:create') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setFormDialog({ isOpen: true, entry })}
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {can('admin-work:delete') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => setDeleteDialog({ isOpen: true, entry })}
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog.isOpen} onOpenChange={(open) => !open && setFormDialog({ isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formDialog.entry ? 'Edit Admin Work' : 'New Admin Work'}</DialogTitle>
          </DialogHeader>
          <AdminWorkForm
            admins={admins}
            adminServiceType={adminServiceType}
            existingEntry={formDialog.entry}
            onSuccess={() => {
              setFormDialog({ isOpen: false })
              void loadData()
            }}
            onCancel={() => setFormDialog({ isOpen: false })}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, entry: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin Work</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this admin work entry for{' '}
              <strong>{deleteDialog.entry?.admin_user?.name}</strong> on{' '}
              <strong>
                {deleteDialog.entry ? format(parseLocalDate(deleteDialog.entry.date), 'MMM d, yyyy') : ''}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminGuard>
  )
}
