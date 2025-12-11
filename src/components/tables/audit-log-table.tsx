'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/contexts/organization-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Loader2,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'

interface AuditLog {
  id: string
  organization_id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_fields: string[] | null
  user_id: string | null
  user_email: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

const TABLE_LABELS: Record<string, string> = {
  sessions: 'Sessions',
  invoices: 'Invoices',
  clients: 'Clients',
  users: 'Users',
  service_types: 'Service Types',
  session_attendees: 'Session Attendees',
  organizations: 'Organization',
}

const ACTION_ICONS = {
  INSERT: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
}

const ACTION_COLORS = {
  INSERT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function AuditLogTable() {
  const { organization } = useOrganization()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [tableFilter, setTableFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')

  const pageSize = 20

  useEffect(() => {
    if (!organization) return

    const loadLogs = async () => {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (tableFilter !== 'all') {
        query = query.eq('table_name', tableFilter)
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter)
      }

      if (searchTerm) {
        query = query.or(`user_email.ilike.%${searchTerm}%,record_id.ilike.%${searchTerm}%`)
      }

      const { data, count, error } = await query

      if (error) {
        console.error('Error loading audit logs:', error)
        setLogs([])
      } else {
        setLogs(data || [])
        setTotalCount(count || 0)
      }

      setLoading(false)
    }

    void loadLogs()
  }, [organization, page, tableFilter, actionFilter, searchTerm])

  function viewDetails(log: AuditLog) {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  function formatValue(value: unknown): string {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  function getRecordLabel(log: AuditLog): string {
    const data = log.new_data || log.old_data
    if (!data) return log.record_id.slice(0, 8) + '...'

    // Try to get a meaningful label from the record
    if (data.name) return String(data.name)
    if (data.email) return String(data.email)
    if (data.date) return String(data.date)

    return log.record_id.slice(0, 8) + '...'
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by email or record ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(0)
            }}
            className="pl-10"
          />
        </div>
        <Select value={tableFilter} onValueChange={(v) => { setTableFilter(v); setPage(0) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by table" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            {Object.entries(TABLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0) }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="INSERT">Created</SelectItem>
            <SelectItem value="UPDATE">Updated</SelectItem>
            <SelectItem value="DELETE">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No audit logs found
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Timestamp</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Record</TableHead>
                <TableHead>Changed By</TableHead>
                <TableHead className="w-[80px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const ActionIcon = ACTION_ICONS[log.action]
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(log.created_at), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={ACTION_COLORS[log.action]}>
                        <ActionIcon className="w-3 h-3 mr-1" />
                        {log.action === 'INSERT' ? 'Created' : log.action === 'UPDATE' ? 'Updated' : 'Deleted'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {TABLE_LABELS[log.table_name] || log.table_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {getRecordLabel(log)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user_email || 'System'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => viewDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              {selectedLog && (
                <span>
                  {TABLE_LABELS[selectedLog.table_name] || selectedLog.table_name} - {selectedLog.action}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Timestamp</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), 'MMM d, yyyy h:mm:ss a')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">User</p>
                  <p className="font-medium">{selectedLog.user_email || 'System'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Record ID</p>
                  <p className="font-mono text-xs">{selectedLog.record_id}</p>
                </div>
                {selectedLog.ip_address && (
                  <div>
                    <p className="text-gray-500">IP Address</p>
                    <p className="font-mono text-xs">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              {/* Changed fields for updates */}
              {selectedLog.action === 'UPDATE' && selectedLog.changed_fields && selectedLog.changed_fields.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Changed Fields</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLog.changed_fields.map((field) => (
                      <Badge key={field} variant="secondary">{field}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Before/After comparison for updates */}
              {selectedLog.action === 'UPDATE' && selectedLog.changed_fields && (
                <div className="space-y-4">
                  <p className="text-sm font-medium">Changes</p>
                  <div className="border rounded-lg divide-y">
                    {selectedLog.changed_fields.map((field) => (
                      <div key={field} className="grid grid-cols-3 text-sm">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 font-medium">
                          {field}
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20">
                          <p className="text-xs text-gray-500 mb-1">Before</p>
                          <pre className="whitespace-pre-wrap text-xs">
                            {formatValue(selectedLog.old_data?.[field])}
                          </pre>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20">
                          <p className="text-xs text-gray-500 mb-1">After</p>
                          <pre className="whitespace-pre-wrap text-xs">
                            {formatValue(selectedLog.new_data?.[field])}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full data for insert/delete */}
              {selectedLog.action === 'INSERT' && selectedLog.new_data && (
                <div>
                  <p className="text-sm font-medium mb-2">Created Record</p>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.action === 'DELETE' && selectedLog.old_data && (
                <div>
                  <p className="text-sm font-medium mb-2">Deleted Record</p>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
