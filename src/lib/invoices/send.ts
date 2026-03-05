import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/pdf/invoice-pdf'
import { sendInvoiceEmail } from '@/lib/email'
import { formatInvoiceNumber } from '@/lib/constants/display'
import { createElement, type ReactElement } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { OrganizationSettings } from '@/types/database'

interface SendResult {
  success: boolean
  invoiceId: string
  error?: string
}

/**
 * Send a single invoice via email: generates PDF, sends email, updates status.
 * Works with any Supabase client (server or service role).
 */
export async function sendInvoiceById(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  invoiceId: string
): Promise<SendResult> {
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
    .eq('id', invoiceId)
    .single()

  if (error || !invoice) {
    return { success: false, invoiceId, error: 'Invoice not found' }
  }

  if (!invoice.client?.contact_email) {
    return { success: false, invoiceId, error: 'Client has no email address on file' }
  }

  // Fetch org settings for footer_text and payment_instructions
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', invoice.organization_id)
    .single()

  const settings = org?.settings as OrganizationSettings | undefined
  const footerText = settings?.invoice?.footer_text || undefined
  const paymentInstructions = settings?.invoice?.payment_instructions || undefined

  // Fetch invoice items for batch invoices
  let items: Array<{
    description: string; session_date: string; duration_minutes: number | null
    amount: number; service_type_name: string | null; contractor_name: string | null
  }> = []

  if (invoice.invoice_type === 'batch') {
    const { data: itemsData } = await supabase
      .from('invoice_items')
      .select('description, session_date, duration_minutes, amount, service_type_name, contractor_name')
      .eq('invoice_id', invoiceId)
      .order('session_date', { ascending: true })

    items = itemsData || []
  }

  // Generate PDF
  const invoiceData = { ...invoice, items: items.length > 0 ? items : undefined }
  const pdfBuffer = await renderToBuffer(
    createElement(InvoicePDF, { invoice: invoiceData, footerText, paymentInstructions }) as ReactElement<DocumentProps>
  )

  // Send email
  const invoiceNumber = formatInvoiceNumber(invoice.id)
  const isBatch = invoice.invoice_type === 'batch'

  try {
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
      footerText,
      paymentInstructions,
    })
  } catch {
    return { success: false, invoiceId, error: 'Failed to send email' }
  }

  // Update invoice status to 'sent' only after email succeeds
  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', invoiceId)

  if (updateError) {
    return { success: false, invoiceId, error: 'Email sent but failed to update invoice status' }
  }

  return { success: true, invoiceId }
}
