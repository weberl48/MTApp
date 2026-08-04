'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SessionsData {
  month: string
  individual: number
  group: number
}

interface SessionsChartProps {
  data: SessionsData[]
}

export function SessionsChart({ data }: SessionsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions by Type</CardTitle>
        <CardDescription>Individual vs Group sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                isAnimationActive={false}
              />
              <Legend />
              <Bar dataKey="individual" fill="var(--chart-1)" name="Individual" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="group" fill="var(--chart-2)" name="Group" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
