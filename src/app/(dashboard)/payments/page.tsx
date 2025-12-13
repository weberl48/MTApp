'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/pricing'
import { DollarSign, Users, Calendar, TrendingUp, Loader2, AlertCircle, Receipt, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ContractorPaymentsTable } from '@/components/tables/contractor-payments-table'
import { PayrollHubTable, ContractorPayout, UnpaidSession } from '@/components/tables/payroll-hub-table'
import { PaymentReconciliationTable } from '@/components/tables/payment-reconciliation-table'

interface InvoiceData {
  id: string
  amount: number
  mca_cut: number
  contractor_pay: number
  status: string
  created_at: string
  paid_date: string | null
  session: {
    id: string
    date: string
    contractor: { id: string; name: string; email: string } | null
    service_type: { name: string } | null
  } | null
  client: { name: string } | null
}

interface ContractorPayment {
  id: string
  name: string
  email: string
  totalEarned: number
  totalPaid: number
  totalPending: number
  sessionCount: number
  invoices: InvoiceData[]
}

interface SessionWithInvoices {
  id: string
  date: string
  duration_minutes: number
  contractor_id: string
  contractor_paid_date: string | null
  service_type: { name: string } | null
  contractor: { id: string; name: string; email: string } | null
  invoices: { contractor_pay: number }[]
  session_attendees: { client: { name: string } | null }[]
}

// Helper to get default date range (start of current month to today)
function getDefaultDateRange() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    from: startOfMonth.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  }
}

export default function PaymentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [contractors, setContractors] = useState<ContractorPayment[]>([])
  const [unpaidContractors, setUnpaidContractors] = useState<ContractorPayout[]>([])
  const [activeTab, setActiveTab] = useState('payroll')

  // Date range filtering
  const [dateRange, setDateRange] = useState(getDefaultDateRange())
  const [showAllDates, setShowAllDates] = useState(true)

  const loadPayments = async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login/')
      return
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>()

    const role = userProfile?.role
    if (role !== 'admin' && role !== 'owner' && role !== 'developer') {
      router.push('/dashboard/')
      return
    }

    // Fetch all invoices with contractor information (for the history tab)
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select(`
        id,
        amount,
        mca_cut,
        contractor_pay,
        status,
        created_at,
        paid_date,
        session:sessions(
          id,
          date,
          contractor:users(id, name, email),
          service_type:service_types(name)
        ),
        client:clients(name)
      `)
      .order('created_at', { ascending: false })

    const typedInvoices = (invoicesData as unknown as InvoiceData[]) || []
    setInvoices(typedInvoices)

    // Group by contractor for history view
    const contractorPayments: Record<string, ContractorPayment> = {}

    typedInvoices.forEach((invoice) => {
      const contractor = invoice.session?.contractor
      if (!contractor?.id) return

      if (!contractorPayments[contractor.id]) {
        contractorPayments[contractor.id] = {
          id: contractor.id,
          name: contractor.name || 'Unknown',
          email: contractor.email || '',
          totalEarned: 0,
          totalPaid: 0,
          totalPending: 0,
          sessionCount: 0,
          invoices: [],
        }
      }

      contractorPayments[contractor.id].totalEarned += Number(invoice.contractor_pay)
      contractorPayments[contractor.id].sessionCount += 1
      contractorPayments[contractor.id].invoices.push(invoice)

      if (invoice.status === 'paid') {
        contractorPayments[contractor.id].totalPaid += Number(invoice.contractor_pay)
      } else {
        contractorPayments[contractor.id].totalPending += Number(invoice.contractor_pay)
      }
    })

    setContractors(Object.values(contractorPayments))

    // Fetch unpaid sessions for payroll hub
    const { data: unpaidSessions } = await supabase
      .from('sessions')
      .select(`
        id,
        date,
        duration_minutes,
        contractor_id,
        contractor_paid_date,
        service_type:service_types(name),
        contractor:users(id, name, email),
        invoices(contractor_pay),
        session_attendees(client:clients(name))
      `)
      .is('contractor_paid_date', null)
      .eq('status', 'submitted')
      .order('date', { ascending: false })

    const typedSessions = (unpaidSessions as unknown as SessionWithInvoices[]) || []

    // Group unpaid sessions by contractor
    const unpaidByContractor: Record<string, ContractorPayout> = {}

    typedSessions.forEach((session) => {
      const contractor = session.contractor
      if (!contractor?.id) return

      // Calculate contractor pay from invoices
      const contractorPay = session.invoices.reduce((sum, inv) => sum + Number(inv.contractor_pay), 0)

      if (!unpaidByContractor[contractor.id]) {
        unpaidByContractor[contractor.id] = {
          id: contractor.id,
          name: contractor.name || 'Unknown',
          email: contractor.email || '',
          unpaidSessions: [],
          totalPending: 0,
          sessionCount: 0,
        }
      }

      const clients = session.session_attendees
        .map((a) => a.client?.name)
        .filter((name): name is string => !!name)

      const unpaidSession: UnpaidSession = {
        id: session.id,
        date: session.date,
        service_type: session.service_type,
        duration_minutes: session.duration_minutes,
        contractor_pay: contractorPay,
        clients,
      }

      unpaidByContractor[contractor.id].unpaidSessions.push(unpaidSession)
      unpaidByContractor[contractor.id].totalPending += contractorPay
      unpaidByContractor[contractor.id].sessionCount += 1
    })

    setUnpaidContractors(Object.values(unpaidByContractor))
    setLoading(false)
  }

  useEffect(() => {
    void loadPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter unpaid contractors by date range (must be before conditional return)
  const filteredUnpaidContractors = useMemo(() => {
    if (showAllDates) return unpaidContractors

    return unpaidContractors
      .map((contractor) => {
        const filteredSessions = contractor.unpaidSessions.filter((session) => {
          const sessionDate = session.date
          return sessionDate >= dateRange.from && sessionDate <= dateRange.to
        })

        if (filteredSessions.length === 0) return null

        return {
          ...contractor,
          unpaidSessions: filteredSessions,
          totalPending: filteredSessions.reduce((sum, s) => sum + s.contractor_pay, 0),
          sessionCount: filteredSessions.length,
        }
      })
      .filter((c): c is ContractorPayout => c !== null)
  }, [unpaidContractors, showAllDates, dateRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Calculate totals for history view
  const totalContractorPay = contractors.reduce((sum, c) => sum + c.totalEarned, 0)
  const totalPaidOut = contractors.reduce((sum, c) => sum + c.totalPaid, 0)
  const totalPending = unpaidContractors.reduce((sum, c) => sum + c.totalPending, 0)
  const totalMcaCut = invoices.reduce((sum, inv) => sum + Number(inv.mca_cut), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contractor Payments</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage contractor payouts and view payment history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Contractor Earnings
            </CardTitle>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalContractorPay)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Paid Out
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaidOut)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Completed payments</p>
          </CardContent>
        </Card>

        <Card className={totalPending > 0 ? 'border-amber-200 dark:border-amber-800' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending Payouts
            </CardTitle>
            {totalPending > 0 ? (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            ) : (
              <Calendar className="w-4 h-4 text-gray-400" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {unpaidContractors.reduce((sum, c) => sum + c.sessionCount, 0)} sessions awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              MCA Revenue
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalMcaCut)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total commission</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Payroll Hub vs History */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Payroll Hub
            {unpaidContractors.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                {unpaidContractors.reduce((sum, c) => sum + c.sessionCount, 0)}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Payment History
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Invoice Reconciliation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Unpaid Sessions</CardTitle>
                  <CardDescription>
                    {filteredUnpaidContractors.length === 0
                      ? 'All contractors have been paid!'
                      : `${filteredUnpaidContractors.length} contractor${
                          filteredUnpaidContractors.length !== 1 ? 's' : ''
                        } with unpaid sessions`}
                  </CardDescription>
                </div>

                {/* Date Range Filter */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">Filter by Date</span>
                    <Button
                      variant={showAllDates ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowAllDates(true)}
                    >
                      All
                    </Button>
                    <Button
                      variant={!showAllDates ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowAllDates(false)}
                    >
                      Range
                    </Button>
                  </div>
                  {!showAllDates && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="fromDate" className="text-xs">From:</Label>
                        <Input
                          id="fromDate"
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                          className="h-8 w-36 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Label htmlFor="toDate" className="text-xs">To:</Label>
                        <Input
                          id="toDate"
                          type="date"
                          value={dateRange.to}
                          onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                          className="h-8 w-36 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PayrollHubTable
                contractors={filteredUnpaidContractors}
                onPayoutComplete={loadPayments}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contractor Summary</CardTitle>
              <CardDescription>
                {contractors.length} contractor{contractors.length !== 1 ? 's' : ''} with payment
                activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractorPaymentsTable contractors={contractors} invoices={invoices} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Reconciliation</CardTitle>
              <CardDescription>
                Track invoice status and Square payment integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentReconciliationTable onRefresh={loadPayments} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
