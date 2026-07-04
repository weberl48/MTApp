import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/pdf/invoice-pdf'
import { sendInvoiceEmail } from '@/lib/email'
import { formatInvoiceNumber } from '@/lib/constants/display'
import { fetchInvoicePdfData } from '@/lib/invoices/pdf-data'
import { createElement, type ReactElement } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

interface SendResult {
  success: boolean
  invoiceId: string
  error?: string
}

/**
 * Send a single invoice via email: generates PDF, sends email, updates status.
 * Works with any Supabase client (server or service role).
 *
 * PDF data comes from fetchInvoicePdfData — the same source as the
 * /api/invoices/[id]/pdf preview/download route, so what the owner previews is
 * exactly what this attaches.
 */
export async function sendInvoiceById(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  invoiceId: string
): Promise<SendResult> {
  const bundle = await fetchInvoicePdfData(supabase, invoiceId)

  if (!bundle) {
    return { success: false, invoiceId, error: 'Invoice not found' }
  }

  const { invoice, footerText, paymentInstructions } = bundle

  // Never (re)send — and never regress the status of — an invoice that is already paid. This
  // path sets status to 'sent', so sending a paid invoice would un-pay it (clearing dunning
  // state and re-entering the reminder cron). A paid invoice is a settled financial record.
  if (invoice.status === 'paid') {
    return { success: false, invoiceId, error: 'Invoice is already paid' }
  }

  if (!invoice.client?.contact_email) {
    return { success: false, invoiceId, error: 'Client has no email address on file' }
  }

  // Generate PDF
  const pdfBuffer = await renderToBuffer(
    createElement(InvoicePDF, { invoice, footerText, paymentInstructions }) as ReactElement<DocumentProps>
  )

  // Send email
  const invoiceNumber = formatInvoiceNumber(invoice.id)
  const isBatch = invoice.invoice_type === 'batch'
  const itemCount = invoice.items?.length ?? 0

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
        ? `Monthly Statement (${itemCount} sessions)`
        : (invoice.session?.service_type?.name || 'Session'),
      dueDate: invoice.due_date ?? undefined,
      pdfBuffer: Buffer.from(pdfBuffer),
      footerText,
      paymentInstructions,
    })
  } catch {
    return { success: false, invoiceId, error: 'Failed to send email' }
  }

  // Update invoice status to 'sent' only after email succeeds. Guard with neq('paid') so a
  // webhook that marked it paid between the fetch above and here can't be clobbered back to 'sent'.
  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', invoiceId)
    .neq('status', 'paid')

  if (updateError) {
    return { success: false, invoiceId, error: 'Email sent but failed to update invoice status' }
  }

  return { success: true, invoiceId }
}
