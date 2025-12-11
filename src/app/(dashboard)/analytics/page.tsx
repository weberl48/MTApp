'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { SessionsChart } from '@/components/charts/sessions-chart'
import { PaymentStatusChart } from '@/components/charts/payment-status-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/pricing'
import { DollarSign, TrendingUp, Users, Calendar, Loader2 } from 'lucide-react'

interface Invoice {
  amount: number
  mca_cut: number
  contractor_pay: number
  status: string
  created_at: string
}

interface Session {
  id: string
  date: string
  service_type: { category: string } | null
  attendees: { id: string }[]
}

interface RevenueDataPoint {
  month: string
  revenue: number
  mcaCut: number
  contractorPay: number
}

interface SessionsDataPoint {
  month: string
  individual: number
  group: number
}

interface PaymentStatusDataPoint {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [clientsCount, setClientsCount] = useState(0)

  useEffect(() => {
    async function loadAnalytics() {
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

      // Fetch analytics data
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('amount, mca_cut, contractor_pay, status, created_at')

      const { data: sessionsData } = await supabase
        .from('sessions')
        .select(`
          id,
          date,
          service_type:service_types(category),
          attendees:session_attendees(id)
        `)

      const { count } = await supabase
        .from('clients')
        .select('id', { count: 'exact' })

      setInvoices((invoicesData as Invoice[]) || [])
      setSessions((sessionsData as unknown as Session[]) || [])
      setClientsCount(count || 0)
      setLoading(false)
    }

    loadAnalytics()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Calculate totals
  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const totalMcaCut = invoices.reduce((sum, inv) => sum + Number(inv.mca_cut), 0)
  const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0)
  const pendingRevenue = invoices.filter(i => i.status === 'pending').reduce((sum, inv) => sum + Number(inv.amount), 0)
  const sentRevenue = invoices.filter(i => i.status === 'sent').reduce((sum, inv) => sum + Number(inv.amount), 0)

  // Generate monthly data for charts (last 6 months)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = new Date().getMonth()

  const revenueData: RevenueDataPoint[] = []
  const sessionsData: SessionsDataPoint[] = []

  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12
    const monthName = months[monthIndex]

    // Filter invoices for this month
    const monthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.created_at)
      return invDate.getMonth() === monthIndex
    })

    const monthRevenue = monthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
    const monthMcaCut = monthInvoices.reduce((sum, inv) => sum + Number(inv.mca_cut), 0)
    const monthContractorPay = monthInvoices.reduce((sum, inv) => sum + Number(inv.contractor_pay), 0)

    revenueData.push({
      month: monthName,
      revenue: monthRevenue,
      mcaCut: monthMcaCut,
      contractorPay: monthContractorPay,
    })

    // Filter sessions for this month
    const monthSessions = sessions.filter(s => {
      const sessDate = new Date(s.date)
      return sessDate.getMonth() === monthIndex
    })

    const individualSessions = monthSessions.filter(s =>
      s.service_type?.category?.includes('individual')
    ).length
    const groupSessions = monthSessions.filter(s =>
      s.service_type?.category?.includes('group')
    ).length

    sessionsData.push({
      month: monthName,
      individual: individualSessions,
      group: groupSessions,
    })
  }

  // Payment status data for pie chart
  const paymentStatusData: PaymentStatusDataPoint[] = [
    { name: 'Paid', value: paidRevenue, color: '#10b981' },
    { name: 'Sent', value: sentRevenue, color: '#3b82f6' },
    { name: 'Pending', value: pendingRevenue, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Business insights and performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              MCA Earnings
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalMcaCut)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total commission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Sessions
            </CardTitle>
            <Calendar className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Clients
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsCount}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={revenueData} />
        <SessionsChart data={sessionsData} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PaymentStatusChart data={paymentStatusData} />

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Collected</span>
              <span className="font-medium text-green-600">{formatCurrency(paidRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Awaiting Payment</span>
              <span className="font-medium text-blue-600">{formatCurrency(sentRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pending Review</span>
              <span className="font-medium text-amber-600">{formatCurrency(pendingRevenue)}</span>
            </div>
            <div className="border-t pt-4 flex items-center justify-between">
              <span className="font-medium">Total Outstanding</span>
              <span className="font-bold">{formatCurrency(sentRevenue + pendingRevenue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
