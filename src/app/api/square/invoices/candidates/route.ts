import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { squareClient, getDefaultLocationId, isSquareConfigured } from '@/lib/square/client'
import {
  squareInvoiceToCandidate,
  sortCandidates,
  NON_LINKABLE_SQUARE_STATUSES,
  type SquareInvoiceCandidate,
} from '@/lib/square/link'
import { uuidSchema } from '@/lib/validation/schemas'
import { can } from '@/lib/auth/permissions'
import { logger } from '@/lib/logger'
import type { UserRole } from '@/types/database'

export const dynamic = 'force-dynamic'

/**
 * GET /api/square/invoices/candidates/?invoiceId=<uuid>
 *
 * Recent Square invoices that could be linked to the given local invoice —
 * feeds the "Link Square invoice" picker. Excludes Square invoices already
 * linked to one of this org's invoices and unpayable statuses; suggested
 * matches (exact amount / same Square customer) sort first.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSquareConfigured()) {
      return NextResponse.json({ error: 'Square is not configured' }, { status: 503 })
    }

    const invoiceId = request.nextUrl.searchParams.get('invoiceId')
    if (!uuidSchema.safeParse(invoiceId).success) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

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

    const role = userProfile?.role as UserRole | undefined
    if (!can(role ?? null, 'invoice:send')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, amount, status, square_invoice_id, organization_id, client_id')
      .eq('id', invoiceId)
      .single()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    if (role !== 'developer' && invoice.organization_id !== userProfile?.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'This invoice is already marked paid' }, { status: 400 })
    }
    if (invoice.square_invoice_id) {
      return NextResponse.json({ error: 'This invoice is already linked to a Square invoice' }, { status: 400 })
    }

    const { data: clientRow } = await supabase
      .from('clients')
      .select('square_customer_id')
      .eq('id', invoice.client_id)
      .single<{ square_customer_id: string | null }>()

    // Square IDs already linked anywhere in this org — those invoices are taken.
    const { data: linkedRows } = await supabase
      .from('invoices')
      .select('square_invoice_id')
      .eq('organization_id', invoice.organization_id)
      .not('square_invoice_id', 'is', null)
    const linkedIds = new Set((linkedRows ?? []).map((row) => row.square_invoice_id as string))

    const locationId = await getDefaultLocationId()
    // One page of 200 = the most recent invoices; plenty for a small practice,
    // and the picker's search covers the rest of the page.
    const page = await squareClient.invoices.list({ locationId, limit: 200 })

    const candidates: SquareInvoiceCandidate[] = []
    for (const squareInvoice of page.data) {
      const candidate = squareInvoiceToCandidate(squareInvoice)
      if (!candidate) continue
      if (NON_LINKABLE_SQUARE_STATUSES.has(candidate.status)) continue
      if (linkedIds.has(candidate.id)) continue
      candidates.push(candidate)
    }

    const sorted = sortCandidates(candidates, {
      amount: invoice.amount != null ? Number(invoice.amount) : null,
      squareCustomerId: clientRow?.square_customer_id ?? null,
    })

    return NextResponse.json({ candidates: sorted })
  } catch (error) {
    logger.error('Failed to list Square invoice candidates', error)
    return NextResponse.json(
      { error: 'Failed to load Square invoices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
