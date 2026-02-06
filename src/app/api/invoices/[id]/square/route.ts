import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSquareInvoice } from '@/lib/square/invoices'
import { isSquareConfigured } from '@/lib/square/client'
import { uuidSchema } from '@/lib/validation/schemas'

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

    const role = userProfile?.role
    if (role !== 'admin' && role !== 'owner' && role !== 'developer') {
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
    const invoiceNumber = `INV-${invoice.id.slice(0, 8).toUpperCase()}`

    // Calculate due date (30 days from now if not set)
    const dueDate = invoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Create description
    const sessionDate = invoice.session?.date
      ? new Date(invoice.session.date).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : 'N/A'

    const description = `${invoice.session?.service_type?.name || 'Session'} on ${sessionDate}`

    // Create Square invoice
    const squareResult = await createSquareInvoice({
      clientName: invoice.client.name,
      clientEmail: invoice.client.contact_email,
      amount: Number(invoice.amount),
      description,
      dueDate,
      invoiceNumber,
      note: invoice.session?.notes || undefined,
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
