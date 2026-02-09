'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EarningsData {
  month: string
  earnings: number
  sessions: number
}

interface EarningsChartProps {
  data: EarningsData[]
}

export function EarningsChart({ data }: EarningsChartProps) {
  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Trend</CardTitle>
        <CardDescription>Your monthly earnings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => {
                  // Shorten "February 2026" to "Feb '26"
                  const parts = value.split(' ')
                  if (parts.length === 2) {
                    return `${parts[0].slice(0, 3)} '${parts[1].slice(2)}`
                  }
                  return value
                }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => [
                  name === 'earnings' ? `$${Number(value ?? 0).toFixed(2)}` : value,
                  name === 'earnings' ? 'Earnings' : 'Sessions',
                ]}
              />
              <Bar
                dataKey="earnings"
                fill="#3b82f6"
                name="earnings"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
