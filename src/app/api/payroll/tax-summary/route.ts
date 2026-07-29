import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { can } from '@/lib/auth/permissions'
import { taxYearSchema } from '@/lib/validation/schemas'
import {
  taxYearRange,
  summarizeByContractor,
  buildSummaryCsv,
  buildDetailCsv,
  type ContractorPaidSessionInput,
} from '@/lib/payroll/annual-summary'
import type { UserRole } from '@/types/database'

interface NameJoin {
  name: string
}

interface ContractorJoin {
  id: string
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single<{ role: string; organization_id: string }>()

    if (!userProfile || !can(userProfile.role as UserRole, 'payments:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const yearParse = taxYearSchema.safeParse(request.nextUrl.searchParams.get('year'))
    if (!yearParse.success) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }
    const year = yearParse.data
    const detail = request.nextUrl.searchParams.get('detail') === '1'

    // gte on contractor_paid_date also excludes null (never-paid) rows.
    const { start, end } = taxYearRange(year)
    // PostgREST caps a single response at the project's max-rows setting (default
    // 1000). A year of paid sessions can exceed that, and a silently truncated
    // tax export under-reports totals — page through explicitly. The .order('id')
    // gives stable page boundaries (no dup/missed rows between pages). Advance by
    // the rows actually returned, not PAGE_SIZE: the server clamps to max-rows,
    // and if that setting ever drops below PAGE_SIZE a fixed stride would skip rows.
    const PAGE_SIZE = 1000
    const rows: PaidSessionRow[] = []
    for (let from = 0; ; ) {
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
        .eq('organization_id', userProfile.organization_id)
        .gte('contractor_paid_date', start)
        .lte('contractor_paid_date', end)
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)

      if (error) {
        console.error('[MCA] Tax summary export: query failed')
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
      }
      const page = (data as unknown as PaidSessionRow[]) || []
      rows.push(...page)
      if (page.length === 0) break
      from += page.length
    }

    // A paid session must never be dropped from a tax export. Unresolved contractor
    // joins are believed unreachable today (sessions.contractor_id is NOT NULL with an
    // FK, and team removal is blocked while sessions exist) but if one ever occurs, it
    // must surface as "Unknown contractor" rather than silently reducing totals.
    const inputs: ContractorPaidSessionInput[] = rows
      .map((session) => {
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

    const csv = detail
      ? buildDetailCsv(inputs, year)
      : buildSummaryCsv(summarizeByContractor(inputs, year), year)

    const filename = detail
      ? `contractor-payments-detail-${year}.csv`
      : `contractor-tax-summary-${year}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    console.error('[MCA] Tax summary export failed')
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
