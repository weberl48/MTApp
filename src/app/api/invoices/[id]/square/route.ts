import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSquareInvoice } from '@/lib/square/invoices'
import { isSquareConfigured } from '@/lib/square/client'
import { uuidSchema } from '@/lib/validation/schemas'
import { formatInvoiceNumber } from '@/lib/constants/display'
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if Square is configured
    if (!isSquareConfigured()) {
      return NextResponse.json(
        {
          error: 'Square is not configured. Please add SQUARE_ACCESS_TOKEN to your environment variables.',
          setup: 'Get your access token from https://developer.squareup.com'
        },
        { status: 503 }
      )
    }

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner/developer and get their organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single<{ role: string; organization_id: string }>()

    const role = userProfile?.role as UserRole | undefined
    if (!can(role ?? null, 'invoice:send')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch invoice with related data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, contact_email),
        session:sessions(
          id,
          date,
          duration_minutes,
          notes,
          contractor:users(id, name),
          service_type:service_types(name)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Verify organization ownership (developers can access all)
    if (role !== 'developer' && invoice.organization_id !== userProfile?.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if client has email
    if (!invoice.client?.contact_email) {
      return NextResponse.json(
        { error: 'Client does not have an email address. Square invoices require an email.' },
        { status: 400 }
      )
    }

    // Check if Square invoice already exists
    if (invoice.square_invoice_id) {
      return NextResponse.json(
        { error: 'Square invoice already exists for this invoice' },
        { status: 400 }
      )
    }

    // Create the invoice number
    const invoiceNumber = formatInvoiceNumber(invoice.id)

    // Calculate due date (30 days from now if not set)
    const dueDate = invoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Build description based on invoice type
    let description: string
    let note: string | undefined

    const isBatch = invoice.invoice_type === 'batch'

    if (isBatch) {
      // Fetch invoice items for batch invoices
      const { data: items } = await supabase
        .from('invoice_items')
        .select('description, session_date, duration_minutes, amount, service_type_name, contractor_name')
        .eq('invoice_id', id)
        .order('session_date', { ascending: true })

      const itemCount = items?.length || 0
      const periodLabel = invoice.billing_period
        ? new Date(invoice.billing_period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Monthly'

      description = `Monthly Statement - ${periodLabel} (${itemCount} session${itemCount !== 1 ? 's' : ''})`

      // Build a detailed note with session line items
      if (items && items.length > 0) {
        const lines = items.map((item) => {
          const date = new Date(item.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const svc = item.service_type_name || 'Session'
          const dur = item.duration_minutes ? ` (${item.duration_minutes} min)` : ''
          return `${date} - ${svc}${dur}: $${item.amount.toFixed(2)}`
        })
        note = lines.join('\n')
      }
    } else {
      const sessionDate = invoice.session?.date
        ? new Date(invoice.session.date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : 'N/A'

      description = `${invoice.session?.service_type?.name || 'Session'} on ${sessionDate}`
      note = invoice.session?.notes || undefined
    }

    // Create Square invoice
    const squareResult = await createSquareInvoice({
      clientName: invoice.client.name,
      clientEmail: invoice.client.contact_email,
      amount: Number(invoice.amount),
      description,
      dueDate,
      invoiceNumber,
      note,
    })

    // Update our invoice with Square invoice ID and URL
    await supabase
      .from('invoices')
      .update({
        square_invoice_id: squareResult.invoiceId,
        square_payment_url: squareResult.invoiceUrl,
        status: 'sent',
      })
      .eq('id', id)

    // Save Square customer ID on the client for future auto-send
    if (squareResult.customerId && invoice.client?.id) {
      await supabase
        .from('clients')
        .update({ square_customer_id: squareResult.customerId })
        .eq('id', invoice.client.id)
    }

    return NextResponse.json({
      success: true,
      squareInvoiceId: squareResult.invoiceId,
      paymentUrl: squareResult.invoiceUrl,
      message: 'Square invoice created and sent to client',
    })
  } catch (error) {
    console.error('[MCA] Square invoice creation error')
    return NextResponse.json(
      { error: 'Failed to create Square invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
