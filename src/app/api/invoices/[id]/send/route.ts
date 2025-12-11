import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/pdf/invoice-pdf'
import { sendInvoiceEmail } from '@/lib/email'
import { createElement, ReactElement } from 'react'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>()

    if (userProfile?.role !== 'admin') {
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

    // Check if client has email
    if (!invoice.client?.contact_email) {
      return NextResponse.json(
        { error: 'Client does not have an email address' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      createElement(InvoicePDF, { invoice }) as ReactElement<DocumentProps>
    )

    // Send email
    const invoiceNumber = `INV-${invoice.id.slice(0, 8).toUpperCase()}`

    await sendInvoiceEmail({
      to: invoice.client.contact_email,
      clientName: invoice.client.name,
      invoiceNumber,
      amount: invoice.amount,
      sessionDate: invoice.session?.date || invoice.created_at,
      serviceType: invoice.session?.service_type?.name || 'Session',
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
    console.error('Send invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
