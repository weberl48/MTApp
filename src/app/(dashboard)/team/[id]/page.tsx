'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/pricing'
import { can } from '@/lib/auth/permissions'
import { sessionStatusColors, sessionStatusLabels, invoiceStatusColors } from '@/lib/constants/display'
import type { UserRole } from '@/types/database'
import { Calendar, DollarSign, Mail, Phone, User, Loader2, Pencil, Check, X, Settings2 } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ContractorRatesForm } from '@/components/forms/contractor-rates-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import Link from 'next/link'

interface TeamMember {
  id: string
  name: string | null
  email: string
  role: string
  phone: string | null
  organization_id: string
}

interface Session {
  id: string
  date: string
  duration_minutes: number
  status: string
  service_type: { name: string; category: string } | null
  attendees: { id: string; individual_cost: number; client: { name: string } | null }[]
}

interface Invoice {
  id: string
  amount: number
  contractor_pay: number
  status: string
  created_at: string
  client: { name: string } | null
  session: {
    id: string
    date: string
    contractor_id: string
    service_type: { name: string } | null
  } | null
}

export default function TeamMemberPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<TeamMember | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [editingRole, setEditingRole] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [savingRole, setSavingRole] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')

  useEffect(() => {
    async function loadMemberData() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login/')
        return
      }

      // Check if user is admin or above
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>()

      const isAdminOrAbove = can(userProfile?.role as UserRole, 'team:view')
      if (!isAdminOrAbove) {
        router.push('/dashboard/')
        return
      }
      setCurrentUserRole(userProfile?.role || '')

      // Fetch team member details
      const { data: memberData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !memberData) {
        router.push('/team/')
        return
      }

      setMember(memberData as TeamMember)

      // Fetch member's sessions
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select(`
          *,
          service_type:service_types(name, category),
          attendees:session_attendees(
            id,
            individual_cost,
            client:clients(name)
          )
        `)
        .eq('contractor_id', id)
        .order('date', { ascending: false })

      setSessions((sessionsData as unknown as Session[]) || [])

      // Fetch member's invoices (through sessions)
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(name),
          session:sessions!inner(
            id,
            date,
            contractor_id,
            service_type:service_types(name)
          )
        `)
        .eq('session.contractor_id', id)
        .order('created_at', { ascending: false })

      setInvoices((invoicesData as unknown as Invoice[]) || [])
      setLoading(false)
    }

    loadMemberData()
  }, [id, router])

  async function handleSaveRole() {
    if (!member || !newRole || newRole === member.role) {
      setEditingRole(false)
      return
    }

    setSavingRole(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', member.id)

    if (error) {
      console.error('[MCA] Error updating role')
      toast.error('Failed to update role')
    } else {
      setMember({ ...member, role: newRole })
      toast.success('Role updated successfully')
    }

    setSavingRole(false)
    setEditingRole(false)
  }

  function startEditingRole() {
    if (member) {
      setNewRole(member.role)
      setEditingRole(true)
    }
  }

  function cancelEditingRole() {
    setEditingRole(false)
    setNewRole('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!member) {
    return null
  }

  // Calculate stats
  const totalSessions = sessions.length
  const totalEarnings = invoices.reduce((sum, inv) => sum + Number(inv.contractor_pay), 0)
  const paidEarnings = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + Number(inv.contractor_pay), 0)
  const pendingEarnings = invoices.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + Number(inv.contractor_pay), 0)

  // Status colors and labels imported from @/lib/constants/display

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Team', href: '/team' },
        { label: member.name || 'Team Member' },
      ]} />
      {/* Header */}
      <div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold break-words min-w-0">
              {member.name || 'Unnamed User'}
            </h1>
            {editingRole ? (
              <div className="flex items-center gap-2">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveRole}
                  disabled={savingRole}
                >
                  {savingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-600" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={cancelEditingRole}
                  disabled={savingRole}
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant={member.role === 'admin' || member.role === 'owner' ? 'default' : 'secondary'}>
                  {member.role}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={startEditingRole}
                  className="h-6 w-6"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400">{member.email}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Sessions
            </CardTitle>
            <Calendar className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Earnings
            </CardTitle>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Paid Out
            </CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(paidEarnings)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending Pay
            </CardTitle>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(pendingEarnings)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{member.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions and Invoices Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Sessions and invoices for this team member</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sessions">
            <TabsList className="mb-4">
              <TabsTrigger value="sessions">Sessions ({totalSessions})</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
              {member.role === 'contractor' && ['owner', 'developer'].includes(currentUserRole) && (
                <TabsTrigger value="rates" className="flex items-center gap-1">
                  <Settings2 className="w-4 h-4" />
                  Rates
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="sessions">
              {sessions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Clients</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          {new Date(session.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {session.service_type?.name}
                        </TableCell>
                        <TableCell>
                          {session.attendees?.map((a) => a.client?.name).filter(Boolean).join(', ') || '-'}
                        </TableCell>
                        <TableCell>{session.duration_minutes} min</TableCell>
                        <TableCell>
                          <Badge className={sessionStatusColors[session.status]}>
                            {sessionStatusLabels[session.status] || session.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No sessions found
                </div>
              )}
            </TabsContent>

            <TabsContent value="invoices">
              {invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Contractor Pay</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          {new Date(invoice.session?.date || invoice.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.client?.name}
                        </TableCell>
                        <TableCell>
                          {invoice.session?.service_type?.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(invoice.amount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.contractor_pay)}
                        </TableCell>
                        <TableCell>
                          <Badge className={invoiceStatusColors[invoice.status]}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No invoices found
                </div>
              )}
            </TabsContent>

            {member.role === 'contractor' && ['owner', 'developer'].includes(currentUserRole) && (
              <TabsContent value="rates">
                <ContractorRatesForm
                  contractorId={member.id}
                  contractorName={member.name || member.email}
                  organizationId={member.organization_id}
                />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
