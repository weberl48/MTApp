'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import Link from 'next/link'

interface MonthlyStats {
  revenue: number
  mcaEarnings: number
  sessionCount: number
}

export function AnalyticsSummary() {
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]

      // Fetch this month's invoices for revenue/MCA cut
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('amount, mca_cut')
        .gte('created_at', firstDayOfMonth)

      // Fetch this month's session count
      const { count: sessionCount, error: sessionError } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .gte('date', firstDayOfMonth)

      if (invoiceError || sessionError) {
        setLoading(false)
        return
      }

      const revenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0
      const mcaEarnings = invoices?.reduce((sum, inv) => sum + Number(inv.mca_cut), 0) || 0

      setStats({
        revenue,
        mcaEarnings,
        sessionCount: sessionCount || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return null

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                <p className="text-lg font-bold">{formatCurrency(stats?.revenue || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">MCA Earnings</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats?.mcaEarnings || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
                <p className="text-lg font-bold">{stats?.sessionCount || 0}</p>
              </div>
            </div>
          </div>
          <Link href="/analytics">
            <Button variant="ghost" size="sm">
              <BarChart3 className="w-4 h-4 mr-1" />
              Full Analytics
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
