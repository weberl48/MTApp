'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { SessionsChart } from '@/components/charts/sessions-chart'
import { PaymentStatusChart } from '@/components/charts/payment-status-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/pricing'
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react'
import { AdminGuard } from '@/components/guards/admin-guard'
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns'
import { SkeletonCard, Skeleton } from '@/components/ui/skeleton'

type DateRange = '3m' | '6m' | '12m' | 'ytd'

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

function getDateRangeBounds(range: DateRange): { start: Date; end: Date } {
  const now = new Date()
  const end = endOfMonth(now)
  if (range === 'ytd') {
    return { start: new Date(now.getFullYear(), 0, 1), end }
  }
  const monthsBack = range === '3m' ? 3 : range === '6m' ? 6 : 12
  return { start: startOfMonth(subMonths(now, monthsBack - 1)), end }
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [clientsCount, setClientsCount] = useState(0)
  const [dateRange, setDateRange] = useState<DateRange>('6m')

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

      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>()

      const role = userProfile?.role as UserRole | undefined
      if (!can(role ?? null, 'analytics:view')) {
        router.push('/dashboard/')
        return
      }

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

  // Compute filtered data based on date range
  const { filteredInvoices, filteredSessions } = useMemo(() => {
    const { start, end } = getDateRangeBounds(dateRange)
    return {
      filteredInvoices: invoices.filter(inv => {
        const d = new Date(inv.created_at)
        return d >= start && d <= end
      }),
      filteredSessions: sessions.filter(s => {
        const d = new Date(s.date)
        return d >= start && d <= end
      }),
    }
  }, [invoices, sessions, dateRange])

  // Calculate totals from filtered data
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const totalMcaCut = filteredInvoices.reduce((sum, inv) => sum + Number(inv.mca_cut), 0)
  const paidRevenue = filteredInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0)
  const pendingRevenue = filteredInvoices.filter(i => i.status === 'pending').reduce((sum, inv) => sum + Number(inv.amount), 0)
  const sentRevenue = filteredInvoices.filter(i => i.status === 'sent').reduce((sum, inv) => sum + Number(inv.amount), 0)

  // Generate year-aware monthly data for charts
  const { revenueData, sessionsData: sessionsChartData } = useMemo(() => {
    const { start } = getDateRangeBounds(dateRange)
    const now = new Date()
    const endMonth = startOfMonth(now)

    const revenue: RevenueDataPoint[] = []
    const sessionsByMonth: SessionsDataPoint[] = []

    let cursor = startOfMonth(start)
    while (cursor <= endMonth) {
      const year = cursor.getFullYear()
      const month = cursor.getMonth()
      const label = format(cursor, 'MMM yyyy')

      const monthInvoices = filteredInvoices.filter(inv => {
        const d = new Date(inv.created_at)
        return d.getFullYear() === year && d.getMonth() === month
      })

      revenue.push({
        month: label,
        revenue: monthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
        mcaCut: monthInvoices.reduce((sum, inv) => sum + Number(inv.mca_cut), 0),
        contractorPay: monthInvoices.reduce((sum, inv) => sum + Number(inv.contractor_pay), 0),
      })

      const monthSessions = filteredSessions.filter(s => {
        const d = new Date(s.date)
        return d.getFullYear() === year && d.getMonth() === month
      })

      sessionsByMonth.push({
        month: label,
        individual: monthSessions.filter(s => s.service_type?.category?.includes('individual')).length,
        group: monthSessions.filter(s => s.service_type?.category?.includes('group')).length,
      })

      cursor = new Date(year, month + 1, 1)
    }

    return { revenueData: revenue, sessionsData: sessionsByMonth }
  }, [filteredInvoices, filteredSessions, dateRange])

  // Payment status data for pie chart
  const paymentStatusData: PaymentStatusDataPoint[] = [
    { name: 'Paid', value: paidRevenue, color: '#10b981' },
    { name: 'Sent', value: sentRevenue, color: '#3b82f6' },
    { name: 'Pending', value: pendingRevenue, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const rangeLabel = dateRange === 'ytd' ? 'Year to date' : `Last ${dateRange === '3m' ? '3' : dateRange === '6m' ? '6' : '12'} months`

  if (loading) {
    return (
      <AdminGuard>
        <AnalyticsSkeleton />
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Business insights and performance metrics
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {([['3m', '3M'], ['6m', '6M'], ['12m', '12M'], ['ytd', 'YTD']] as const).map(([value, label]) => (
            <Button
              key={value}
              variant={dateRange === value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDateRange(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{rangeLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MCA Earnings
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalMcaCut)}</div>
            <p className="text-xs text-muted-foreground">Total commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sessions
            </CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSessions.length}</div>
            <p className="text-xs text-muted-foreground">{rangeLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Clients
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsCount}</div>
            <p className="text-xs text-muted-foreground">Total clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={revenueData} />
        <SessionsChart data={sessionsChartData} />
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
              <span className="text-muted-foreground">Collected</span>
              <span className="font-medium text-green-600">{formatCurrency(paidRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Awaiting Payment</span>
              <span className="font-medium text-blue-600">{formatCurrency(sentRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending Review</span>
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
    </AdminGuard>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6"><Skeleton className="h-[300px] w-full" /></div>
        <div className="rounded-lg border bg-card p-6"><Skeleton className="h-[300px] w-full" /></div>
      </div>
    </div>
  )
}
