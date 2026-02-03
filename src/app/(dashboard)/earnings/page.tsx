'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/contexts/organization-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, calculateSessionPricing, ContractorPricingOverrides } from '@/lib/pricing'
import type { ServiceType } from '@/types/database'
import { DollarSign, TrendingUp, Clock, CalendarDays } from 'lucide-react'
import { format, startOfYear, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { redirect } from 'next/navigation'

interface EarningsSummary {
  ytdEarnings: number
  ytdPaid: number
  ytdPending: number
  currentMonthEarnings: number
  lastMonthEarnings: number
  sessionsThisMonth: number
  sessionsYtd: number
}

interface MonthlyBreakdown {
  month: string
  earnings: number
  sessions: number
}

export default function EarningsPage() {
  const { user, organization } = useOrganization()
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([])
  const [loading, setLoading] = useState(true)

  // Only contractors should see this page
  if (user && user.role !== 'contractor') {
    redirect('/dashboard')
  }

  useEffect(() => {
    async function fetchEarnings() {
      if (!user || !organization) return

      const supabase = createClient()
      const yearStart = startOfYear(new Date()).toISOString().split('T')[0]
      const monthStart = startOfMonth(new Date()).toISOString().split('T')[0]
      const monthEnd = endOfMonth(new Date()).toISOString().split('T')[0]
      const lastMonthStart = startOfMonth(subMonths(new Date(), 1)).toISOString().split('T')[0]
      const lastMonthEnd = endOfMonth(subMonths(new Date(), 1)).toISOString().split('T')[0]

      // Fetch all sessions for this contractor YTD
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          id,
          date,
          status,
          contractor_paid_date,
          contractor_paid_amount,
          duration_minutes,
          service_type:service_types(
            id,
            name,
            base_rate,
            per_person_rate,
            mca_percentage,
            contractor_cap,
            rent_percentage
          ),
          attendees:session_attendees(id)
        `)
        .eq('contractor_id', user.id)
        .eq('organization_id', organization.id)
        .gte('date', yearStart)
        .in('status', ['submitted', 'approved'])
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching earnings:', error)
        setLoading(false)
        return
      }

      // Fetch contractor-specific rates
      const [{ data: contractorData }, { data: customRates }] = await Promise.all([
        supabase
          .from('users')
          .select('pay_increase')
          .eq('id', user.id)
          .single(),
        supabase
          .from('contractor_rates')
          .select('service_type_id, contractor_pay')
          .eq('contractor_id', user.id)
      ])

      const payIncrease = contractorData?.pay_increase || 0
      const customRatesMap = new Map<string, number>()
      for (const rate of customRates || []) {
        customRatesMap.set(rate.service_type_id, rate.contractor_pay)
      }

      // Calculate earnings from sessions
      let ytdEarnings = 0
      let ytdPaid = 0
      let currentMonthEarnings = 0
      let lastMonthEarnings = 0
      let sessionsThisMonth = 0
      const sessionsYtd = sessions?.length || 0

      const monthlyMap = new Map<string, { earnings: number; sessions: number }>()

      for (const session of sessions || []) {
        // Calculate contractor pay for this session
        // Handle both single object and array from Supabase join
        const serviceTypeData = session.service_type
        const serviceType = Array.isArray(serviceTypeData)
          ? serviceTypeData[0]
          : serviceTypeData

        if (!serviceType) continue

        const attendeeCount = Math.max(1, (session.attendees as { id: string }[])?.length || 1)

        // Build contractor pricing overrides
        const customPay = customRatesMap.get(serviceType.id)
        const overrides: ContractorPricingOverrides | undefined =
          customPay || payIncrease ? { customContractorPay: customPay, payIncrease } : undefined

        // Use shared pricing calculation
        const pricing = calculateSessionPricing(
          serviceType as ServiceType,
          attendeeCount,
          session.duration_minutes || 30,
          overrides
        )

        // Use actual paid amount if available, otherwise use calculated
        const earnings = session.contractor_paid_amount || pricing.contractorPay

        ytdEarnings += earnings
        if (session.contractor_paid_date) {
          ytdPaid += earnings
        }

        // Check if in current month
        if (session.date >= monthStart && session.date <= monthEnd) {
          currentMonthEarnings += earnings
          sessionsThisMonth++
        }

        // Check if in last month
        if (session.date >= lastMonthStart && session.date <= lastMonthEnd) {
          lastMonthEarnings += earnings
        }

        // Monthly breakdown
        const monthKey = session.date.substring(0, 7) // YYYY-MM
        const existing = monthlyMap.get(monthKey) || { earnings: 0, sessions: 0 }
        monthlyMap.set(monthKey, {
          earnings: existing.earnings + earnings,
          sessions: existing.sessions + 1,
        })
      }

      setSummary({
        ytdEarnings,
        ytdPaid,
        ytdPending: ytdEarnings - ytdPaid,
        currentMonthEarnings,
        lastMonthEarnings,
        sessionsThisMonth,
        sessionsYtd,
      })

      // Convert monthly map to array, sorted by month descending
      const breakdown = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month: format(new Date(month + '-01'), 'MMMM yyyy'),
          earnings: data.earnings,
          sessions: data.sessions,
        }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 6) // Last 6 months

      setMonthlyBreakdown(breakdown)
      setLoading(false)
    }

    fetchEarnings()
  }, [user, organization])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Earnings</h1>
          <p className="text-gray-500 dark:text-gray-400">Loading your earnings data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Earnings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Track your earnings and payment status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YTD Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.ytdEarnings || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.sessionsYtd || 0} sessions this year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.ytdPaid || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Payments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(summary?.ytdPending || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.currentMonthEarnings || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.sessionsThisMonth || 0} sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>Your earnings by month</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No earnings data yet. Complete sessions to see your earnings here.
            </p>
          ) : (
            <div className="space-y-4">
              {monthlyBreakdown.map((month, index) => (
                <div key={month.month}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{month.month}</p>
                      <p className="text-sm text-muted-foreground">
                        {month.sessions} session{month.sessions !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(month.earnings)}</p>
                    </div>
                  </div>
                  {index < monthlyBreakdown.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
