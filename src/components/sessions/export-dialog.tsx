'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

interface Client {
  id: string
  name: string
}

interface ExportDialogProps {
  organizationId: string
  /** If provided, limits client list to clients this contractor has worked with */
  contractorId?: string
}

export function SessionExportDialog({ organizationId, contractorId }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Load clients when dialog opens
  useEffect(() => {
    if (!open) return

    async function loadClients() {
      const supabase = createClient()

      if (contractorId) {
        // Contractor: only show clients they've had sessions with
        const { data: sessions } = await supabase
          .from('sessions')
          .select('attendees:session_attendees(client:clients(id, name))')
          .eq('contractor_id', contractorId)

        // Extract unique clients from session attendees
        const clientMap = new Map<string, Client>()
        sessions?.forEach((session: { attendees: { client: { id: string; name: string } | { id: string; name: string }[] | null }[] | null }) => {
          session.attendees?.forEach((a) => {
            const client = Array.isArray(a.client) ? a.client[0] : a.client
            if (client) {
              clientMap.set(client.id, { id: client.id, name: client.name })
            }
          })
        })
        setClients(Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name)))
      } else {
        // Admin: show all clients
        const { data } = await supabase
          .from('clients')
          .select('id, name')
          .eq('organization_id', organizationId)
          .order('name')

        setClients(data || [])
      }
    }

    loadClients()

    // Set default date range (last month)
    const lastMonth = subMonths(new Date(), 1)
    setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'))
  }, [open, organizationId, contractorId])

  async function handleExport() {
    setLoading(true)

    try {
      const params = new URLSearchParams()
      if (clientId && clientId !== 'all') {
        params.set('clientId', clientId)
      }
      if (startDate) {
        params.set('startDate', startDate)
      }
      if (endDate) {
        params.set('endDate', endDate)
      }
      params.set('format', 'csv')

      const response = await fetch(`/api/sessions/export?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Download the CSV
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sessions-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Sessions exported successfully')
      setOpen(false)
    } catch (error) {
      console.error('[MCA] Export error')
      toast.error('Failed to export sessions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Sessions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Sessions</DialogTitle>
          <DialogDescription>
            Export {contractorId ? 'your' : ''} session data including notes to CSV format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Filter */}
          <div className="space-y-2">
            <Label htmlFor="client">Client (optional)</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="All clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <p className="text-sm text-gray-500">
            The export will include session details, notes (decrypted), and client information.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
