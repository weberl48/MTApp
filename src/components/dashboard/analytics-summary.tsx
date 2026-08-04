'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/contexts/organization-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import Link from 'next/link'

interface MonthlyStats {
  revenue: number
  mcaEarnings: number
}

export function AnalyticsSummary() {
  // Revenue and MCA earnings belong to the owner-only Analytics page; this strip
  // is the same headline, so it takes the same permission.
  const { can } = useOrganization()
  const canViewAnalytics = can('analytics:view')
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(canViewAnalytics)

  useEffect(() => {
    if (!canViewAnalytics) return

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

      if (invoiceError) {
        setLoading(false)
        return
      }

      const revenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0
      const mcaEarnings = invoices?.reduce((sum, inv) => sum + Number(inv.mca_cut), 0) || 0

      setStats({
        revenue,
        mcaEarnings,
      })
      setLoading(false)
    }
    load()
  }, [canViewAnalytics])

  if (!canViewAnalytics || loading) return null

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(stats?.revenue || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">MCA Earnings</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(stats?.mcaEarnings || 0)}</p>
              </div>
            </div>
          </div>
          <Link href="/analytics/">
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
