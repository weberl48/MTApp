import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/pdf/invoice-pdf'
import { sendInvoiceEmail } from '@/lib/email'
import { uuidSchema } from '@/lib/validation/schemas'
import { createElement, ReactElement } from 'react'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        { error: 'Client does not have an email address' },
        { status: 400 }
      )
    }

    // Fetch invoice items for batch invoices
    let items: Array<{ description: string; session_date: string; duration_minutes: number | null; amount: number; service_type_name: string | null; contractor_name: string | null }> = []
    if (invoice.invoice_type === 'batch') {
      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('description, session_date, duration_minutes, amount, service_type_name, contractor_name')
        .eq('invoice_id', id)
        .order('session_date', { ascending: true })

      items = itemsData || []
    }

    // Generate PDF
    const invoiceData = { ...invoice, items: items.length > 0 ? items : undefined }
    const pdfBuffer = await renderToBuffer(
      createElement(InvoicePDF, { invoice: invoiceData }) as ReactElement<DocumentProps>
    )

    // Send email
    const invoiceNumber = `INV-${invoice.id.slice(0, 8).toUpperCase()}`
    const isBatch = invoice.invoice_type === 'batch'

    await sendInvoiceEmail({
      to: invoice.client.contact_email,
      clientName: invoice.client.name,
      invoiceNumber,
      amount: invoice.amount,
      sessionDate: isBatch
        ? (invoice.billing_period ? new Date(invoice.billing_period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : invoice.created_at)
        : (invoice.session?.date || invoice.created_at),
      serviceType: isBatch
        ? `Monthly Statement (${items.length} sessions)`
        : (invoice.session?.service_type?.name || 'Session'),
      dueDate: invoice.due_date,
      pdfBuffer: Buffer.from(pdfBuffer),
    })

    // Update invoice status to 'sent'
    await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', id)

    return NextResponse.json({ success: true, message: 'Invoice sent successfully' })
  } catch (error) {
    console.error('[MCA] Send invoice error')
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
