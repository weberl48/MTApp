import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { createElement, ReactElement } from 'react'
import { format } from 'date-fns'
import { can } from '@/lib/auth/permissions'
import { taxYearSchema, uuidSchema } from '@/lib/validation/schemas'
import {
  taxYearRange,
  summarizeContractorYear,
  type PaidSessionInput,
} from '@/lib/payroll/annual-summary'
import { AnnualEarningsPDF } from '@/components/pdf/annual-earnings-pdf'
import type { UserRole } from '@/types/database'

interface NameJoin {
  name: string
}

interface PaidSessionRow {
  contractor_paid_date: string | null
  contractor_paid_amount: number | null
  contractor_pay: number | null
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

    if (!userProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const role = userProfile.role as UserRole

    const yearParse = taxYearSchema.safeParse(request.nextUrl.searchParams.get('year'))
    if (!yearParse.success) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }
    const year = yearParse.data

    // Contractors always get their own summary — the param is deliberately
    // ignored for them (never a 403, no ID probing). Admins must name a target.
    let targetContractorId: string
    if (role === 'contractor') {
      targetContractorId = user.id
    } else if (can(role, 'payments:view')) {
      const param = request.nextUrl.searchParams.get('contractorId')
      if (!param || !uuidSchema.safeParse(param).success) {
        return NextResponse.json({ error: 'contractorId is required' }, { status: 400 })
      }
      targetContractorId = param
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: contractor } = await supabase
      .from('users')
      .select('id, name, organization_id')
      .eq('id', targetContractorId)
      .single<{ id: string; name: string | null; organization_id: string }>()

    if (!contractor) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    // Cross-org access is developer-only; others see 404, not 403 (no existence leak).
    if (role !== 'developer' && contractor.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', contractor.organization_id)
      .single<{ name: string }>()

    if (orgError) {
      console.error('[MCA] Annual summary PDF: org lookup failed')
    }

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
          contractor_paid_date,
          contractor_paid_amount,
          contractor_pay,
          service_type:service_types(name)
        `)
        .eq('contractor_id', contractor.id)
        .eq('organization_id', contractor.organization_id)
        .gte('contractor_paid_date', start)
        .lte('contractor_paid_date', end)
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)

      if (error) {
        console.error('[MCA] Annual summary PDF query failed')
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
      }
      const page = (data as unknown as PaidSessionRow[]) || []
      rows.push(...page)
      if (page.length === 0) break
      from += page.length
    }

    const inputs: PaidSessionInput[] = rows.map((session) => {
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

    // A zero-activity year still renders — a "$0 paid" record is legitimate.
    const summary = summarizeContractorYear(inputs, year)
    const contractorName = contractor.name || 'Contractor'

    const pdfBuffer = await renderToBuffer(
      createElement(AnnualEarningsPDF, {
        organizationName: organization?.name || 'Organization',
        contractorName,
        summary,
        generatedOn: format(new Date(), 'MMMM d, yyyy'),
      }) as ReactElement<DocumentProps>
    )

    const nameSlug =
      contractorName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'contractor'
    const inline = request.nextUrl.searchParams.get('inline') === '1'

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="earnings-summary-${year}-${nameSlug}.pdf"`,
      },
    })
  } catch {
    console.error('[MCA] Annual summary PDF generation failed')
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
