'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/pricing'
import {
  availableTaxYears,
  summarizeByContractor,
  type ContractorPaidSessionInput,
} from '@/lib/payroll/annual-summary'

interface ContractorJoin {
  id: string
  name: string
}

interface NameJoin {
  name: string
}

interface PaidSessionRow {
  date: string
  duration_minutes: number
  contractor_paid_date: string | null
  contractor_paid_amount: number | null
  contractor_pay: number | null
  contractor: ContractorJoin | ContractorJoin[] | null
  service_type: NameJoin | NameJoin[] | null
}

export function TaxSummariesCard() {
  const [rows, setRows] = useState<ContractorPaidSessionInput[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [downloading, setDownloading] = useState<'summary' | 'detail' | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          date,
          duration_minutes,
          contractor_paid_date,
          contractor_paid_amount,
          contractor_pay,
          contractor:users(id, name),
          service_type:service_types(name)
        `)
        .not('contractor_paid_date', 'is', null)
        .order('contractor_paid_date', { ascending: false })

      if (error) {
        toast.error('Failed to load tax summaries')
        setLoading(false)
        return
      }

      const mapped = ((data as unknown as PaidSessionRow[]) || []).map((session) => {
        const contractor = Array.isArray(session.contractor)
          ? session.contractor[0]
          : session.contractor
        const serviceType = Array.isArray(session.service_type)
          ? session.service_type[0]
          : session.service_type
        return {
          date: session.date,
          duration_minutes: session.duration_minutes,
          contractor_paid_date: session.contractor_paid_date,
          contractor_paid_amount: session.contractor_paid_amount,
          contractor_pay: session.contractor_pay,
          contractor_id: contractor?.id ?? 'unknown',
          contractor_name: contractor?.name ?? 'Unknown contractor',
          service_type_name: serviceType?.name ?? null,
        }
      })

      setRows(mapped)
      setLoading(false)
    }
    void load()
  }, [])

  const years = useMemo(
    () =>
      availableTaxYears(
        rows.map((row) => row.contractor_paid_date),
        new Date().getFullYear()
      ),
    [rows]
  )
  const totals = useMemo(() => summarizeByContractor(rows, year), [rows, year])
  const grandTotal = totals.reduce((sum, t) => sum + t.totalPaid, 0)
  const grandSessions = totals.reduce((sum, t) => sum + t.sessionCount, 0)

  const download = async (kind: 'summary' | 'detail') => {
    setDownloading(kind)
    try {
      const detailParam = kind === 'detail' ? '&detail=1' : ''
      const response = await fetch(`/api/payroll/tax-summary/?year=${year}${detailParam}`)
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download =
        kind === 'detail'
          ? `contractor-payments-detail-${year}.csv`
          : `contractor-tax-summary-${year}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download CSV')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Tax Summaries</CardTitle>
            <CardDescription>
              Cash-basis totals per contractor (grouped by payment date) for 1099 preparation
            </CardDescription>
          </div>
          <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
            <SelectTrigger className="w-[120px]" aria-label="Tax year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : totals.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No contractor payments recorded in {year}.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contractor</TableHead>
                  <TableHead className="text-center">Sessions Paid</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totals.map((total) => (
                  <TableRow key={total.contractorId}>
                    <TableCell className="font-medium">{total.contractorName}</TableCell>
                    <TableCell className="text-center">{total.sessionCount}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(total.totalPaid)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="text-center">{grandSessions}</TableCell>
                  <TableCell className="text-right">{formatCurrency(grandTotal)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            <div className="flex flex-col gap-2 sm:flex-row mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => download('summary')}
                disabled={downloading !== null}
              >
                {downloading === 'summary' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Summary CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => download('detail')}
                disabled={downloading !== null}
              >
                {downloading === 'detail' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Detail CSV
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
