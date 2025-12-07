'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/pricing'
import { DollarSign, Users, Calendar, TrendingUp, Loader2 } from 'lucide-react'
import { ContractorPaymentsTable } from '@/components/tables/contractor-payments-table'

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

export default function PaymentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [contractors, setContractors] = useState<ContractorPayment[]>([])

  useEffect(() => {
    async function loadPayments() {
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

      if (userProfile?.role !== 'admin') {
        router.push('/dashboard/')
        return
      }

      // Fetch all invoices with contractor information
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

      // Group by contractor
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
      setLoading(false)
    }

    loadPayments()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Calculate totals
  const totalContractorPay = contractors.reduce((sum, c) => sum + c.totalEarned, 0)
  const totalPaidOut = contractors.reduce((sum, c) => sum + c.totalPaid, 0)
  const totalPending = contractors.reduce((sum, c) => sum + c.totalPending, 0)
  const totalMcaCut = invoices.reduce((sum, inv) => sum + Number(inv.mca_cut), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contractor Payments</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Track and export contractor payment reports
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All time
            </p>
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending Payouts
            </CardTitle>
            <Calendar className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Awaiting payment
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total commission
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contractor Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contractor Summary</CardTitle>
          <CardDescription>
            {contractors.length} contractor{contractors.length !== 1 ? 's' : ''} with payment activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContractorPaymentsTable contractors={contractors} invoices={invoices} />
        </CardContent>
      </Card>
    </div>
  )
}
