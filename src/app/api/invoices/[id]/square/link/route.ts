import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { squareClient, isSquareConfigured } from '@/lib/square/client'
import { linkStatusUpdate } from '@/lib/square/link'
import { invoiceStatusUpdate } from '@/lib/invoices/status'
import { uuidSchema } from '@/lib/validation/schemas'
import { can } from '@/lib/auth/permissions'
import { logger } from '@/lib/logger'
import type { UserRole } from '@/types/database'

/**
 * Link/unlink a dashboard-created Square invoice to a local invoice
 * (spec: docs/superpowers/specs/2026-08-08-square-invoice-linking-design.md).
 * Once linked, the existing Square webhook keeps the local status current.
 */

const linkBodySchema = z.object({
  squareInvoiceId: z.string().min(1).max(255),
})

interface InvoiceRow {
  id: string
  status: string
  square_invoice_id: string | null
  organization_id: string
  client_id: string
}

async function authorizeInvoice(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single<{ role: string; organization_id: string }>()

  const role = userProfile?.role as UserRole | undefined
  if (!can(role ?? null, 'invoice:send')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, status, square_invoice_id, organization_id, client_id')
    .eq('id', id)
    .single<InvoiceRow>()

  if (!invoice) {
    return { error: NextResponse.json({ error: 'Invoice not found' }, { status: 404 }) } as const
  }
  if (role !== 'developer' && invoice.organization_id !== userProfile?.organization_id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const
  }

  return { supabase, invoice } as const
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSquareConfigured()) {
      return NextResponse.json({ error: 'Square is not configured' }, { status: 503 })
    }

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    const parsedBody = linkBodySchema.safeParse(await request.json().catch(() => null))
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'squareInvoiceId is required' }, { status: 400 })
    }
    const { squareInvoiceId } = parsedBody.data

    const auth = await authorizeInvoice(id)
    if ('error' in auth) return auth.error
    const { supabase, invoice } = auth

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'This invoice is already marked paid' }, { status: 400 })
    }
    if (invoice.square_invoice_id) {
      return NextResponse.json({ error: 'This invoice is already linked to a Square invoice' }, { status: 400 })
    }

    // Taken by another local invoice? (Racing links are caught again by the
    // partial unique index on invoices.square_invoice_id → 23505 below.)
    const { data: existingLink } = await supabase
      .from('invoices')
      .select('id')
      .eq('square_invoice_id', squareInvoiceId)
      .limit(1)
      .maybeSingle()
    if (existingLink) {
      return NextResponse.json(
        { error: 'That Square invoice is already linked to another invoice' },
        { status: 409 }
      )
    }

    // Confirm the Square invoice exists and grab its current state.
    let squareInvoice
    try {
      const result = await squareClient.invoices.get({ invoiceId: squareInvoiceId })
      squareInvoice = result?.invoice
    } catch {
      squareInvoice = null
    }
    if (!squareInvoice?.id) {
      return NextResponse.json({ error: 'Square invoice not found' }, { status: 404 })
    }

    // Adopt the Square status forward-only; the webhook owns all later updates.
    const statusChange = linkStatusUpdate(invoice.status, squareInvoice.status)
    const today = new Date().toISOString().split('T')[0]
    const updateData: Record<string, unknown> = {
      square_invoice_id: squareInvoice.id,
      square_payment_url: squareInvoice.publicUrl || null,
      ...(statusChange ? invoiceStatusUpdate(statusChange.status, today) : {}),
    }

    const { error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'That Square invoice is already linked to another invoice' },
          { status: 409 }
        )
      }
      logger.error('Failed to link Square invoice', updateError)
      return NextResponse.json({ error: 'Failed to link Square invoice' }, { status: 500 })
    }

    // Backfill the client's Square customer id for future suggestions/auto-send.
    const squareCustomerId = squareInvoice.primaryRecipient?.customerId
    if (squareCustomerId) {
      const { data: clientRow } = await supabase
        .from('clients')
        .select('square_customer_id')
        .eq('id', invoice.client_id)
        .single<{ square_customer_id: string | null }>()
      if (clientRow && !clientRow.square_customer_id) {
        await supabase
          .from('clients')
          .update({ square_customer_id: squareCustomerId })
          .eq('id', invoice.client_id)
      }
    }

    return NextResponse.json({
      success: true,
      status: statusChange?.status ?? invoice.status,
      paymentUrl: squareInvoice.publicUrl || null,
    })
  } catch (error) {
    logger.error('Square invoice link error', error)
    return NextResponse.json({ error: 'Failed to link Square invoice' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    const auth = await authorizeInvoice(id)
    if ('error' in auth) return auth.error
    const { supabase, invoice } = auth

    if (!invoice.square_invoice_id) {
      return NextResponse.json({ error: 'This invoice is not linked to a Square invoice' }, { status: 400 })
    }

    // Unlink is explicit human mistake-recovery: clear the mapping and reset to
    // pending (clears paid_date too). The webhook's forward-only rule guards
    // against stale EVENTS, not against the owner undoing a wrong link.
    const today = new Date().toISOString().split('T')[0]
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        square_invoice_id: null,
        square_payment_url: null,
        ...invoiceStatusUpdate('pending', today),
      })
      .eq('id', id)

    if (updateError) {
      logger.error('Failed to unlink Square invoice', updateError)
      return NextResponse.json({ error: 'Failed to unlink Square invoice' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Square invoice unlink error', error)
    return NextResponse.json({ error: 'Failed to unlink Square invoice' }, { status: 500 })
  }
}
