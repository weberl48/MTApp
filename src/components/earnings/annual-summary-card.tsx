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
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { downloadFromUrl } from '@/lib/download'
import { formatCurrency } from '@/lib/pricing'
import {
  availableTaxYears,
  summarizeContractorYear,
  type PaidSessionInput,
} from '@/lib/payroll/annual-summary'

interface NameJoin {
  name: string
}

interface PaidSessionRow {
  contractor_paid_date: string | null
  contractor_paid_amount: number | null
  contractor_pay: number | null
  service_type: NameJoin | NameJoin[] | null
}

interface AnnualSummaryCardProps {
  contractorId: string
  organizationId: string
}

export function AnnualSummaryCard({ contractorId, organizationId }: AnnualSummaryCardProps) {
  const [rows, setRows] = useState<PaidSessionInput[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    // Guards against a stale-response race: if contractorId/organizationId change
    // (e.g. owner switches "View As" mid-fetch) without unmounting, a slow in-flight
    // load for the PREVIOUS contractor could otherwise setRows() after the new
    // contractor's load already finished, showing contractor A's totals under
    // contractor B's name. Mirrors the cancelled-flag pattern in
    // src/app/(dashboard)/invoices/page.tsx.
    let cancelled = false

    async function load() {
      setLoading(true)
      setRows([])
      const supabase = createClient()

      // PostgREST caps a single response at the project's max-rows setting
      // (default 1000). This fetch spans ALL years of paid sessions, so page
      // through explicitly; advance by the rows actually returned (the server
      // may clamp below PAGE_SIZE). The .order('id') gives stable page
      // boundaries; display grouping is done by the lib, not fetch order.
      const PAGE_SIZE = 1000
      const all: PaidSessionRow[] = []
      for (let from = 0; ; ) {
        const { data, error } = await supabase
          .from('sessions')
          .select(`
            contractor_paid_date,
            contractor_paid_amount,
            contractor_pay,
            service_type:service_types(name)
          `)
          .eq('contractor_id', contractorId)
          .eq('organization_id', organizationId)
          .not('contractor_paid_date', 'is', null)
          .order('id', { ascending: true })
          .range(from, from + PAGE_SIZE - 1)

        if (cancelled) return

        if (error) {
          toast.error('Failed to load annual summary')
          setLoading(false)
          return
        }
        const page = (data as unknown as PaidSessionRow[]) || []
        all.push(...page)
        if (page.length === 0) break
        from += page.length
      }

      if (cancelled) return

      const mapped = all.map((session) => {
        const serviceType = Array.isArray(session.service_type)
          ? session.service_type[0]
          : session.service_type
        return {
          contractor_paid_date: session.contractor_paid_date,
          contractor_paid_amount: session.contractor_paid_amount,
          contractor_pay: session.contractor_pay,
          service_type_name: serviceType?.name ?? null,
        }
      })
      setRows(mapped)
      setLoading(false)
    }
    void load()

    return () => {
      cancelled = true
    }
  }, [contractorId, organizationId])

  const years = useMemo(
    () =>
      availableTaxYears(
        rows.map((row) => row.contractor_paid_date),
        new Date().getFullYear()
      ),
    [rows]
  )

  // If the contractor changes and the currently-selected year has no data for
  // them, snap back to the newest available year rather than showing a Select
  // value with no matching item. `years` always includes the current calendar
  // year, so years[0] is always defined.
  useEffect(() => {
    if (!years.includes(year)) setYear(years[0])
  }, [years, year])

  const summary = useMemo(() => summarizeContractorYear(rows, year), [rows, year])

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      await downloadFromUrl(
        `/api/payroll/annual-summary/pdf/?year=${year}&contractorId=${contractorId}`,
        `earnings-summary-${year}.pdf`
      )
    } catch {
      toast.error('Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Annual Summary</CardTitle>
            <CardDescription>
              Payments received per calendar year, by payment date (cash basis) — differs
              from Paid Out above, which counts this year&apos;s sessions
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
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid in {year}</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions Paid</p>
                <p className="text-2xl font-bold">{summary.sessionCount}</p>
              </div>
            </div>
            {summary.sessionCount === 0 && (
              <p className="text-sm text-muted-foreground">
                Payments appear here once your sessions are marked paid by your admin.
              </p>
            )}
            <Button variant="outline" size="sm" onClick={downloadPdf} disabled={downloading}>
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
            <p className="text-xs text-muted-foreground">
              Informal summary of payments recorded in this system — not an official tax
              document (not a 1099).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
