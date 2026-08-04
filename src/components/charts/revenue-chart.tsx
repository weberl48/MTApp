'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface RevenueData {
  month: string
  revenue: number
  mcaCut: number
  contractorPay: number
}

interface RevenueChartProps {
  data: RevenueData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'var(--muted-foreground)' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => [`$${Number(value ?? 0).toFixed(2)}`, name]}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.6}
                name="Total Revenue"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="mcaCut"
                stackId="2"
                stroke="var(--chart-2)"
                fill="var(--chart-2)"
                fillOpacity={0.6}
                name="MCA Cut"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
