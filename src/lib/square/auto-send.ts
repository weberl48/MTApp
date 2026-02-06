import { createClient } from '@/lib/supabase/server'
import { createSquareInvoice } from '@/lib/square/invoices'
import { isSquareConfigured } from '@/lib/square/client'
import { logger } from '@/lib/logger'
import type { OrganizationSettings } from '@/types/database'

export interface AutoSendResult {
  attempted: number
  sent: number
  skipped: number
  failed: string[]
}

/**
 * Auto-send pending invoices via Square for a session.
 * Called after session approval when the org setting is enabled.
 * Never throws — returns a result summary instead.
 */
export async function autoSendInvoicesViaSquare(sessionId: string): Promise<AutoSendResult> {
  const empty: AutoSendResult = { attempted: 0, sent: 0, skipped: 0, failed: [] }

  if (!isSquareConfigured()) {
    return empty
  }

  const supabase = await createClient()

  // Fetch session with org settings to check if auto-send is enabled
  const { data: session } = await supabase
    .from('sessions')
    .select('organization_id, date, duration_minutes, service_type:service_types(name)')
    .eq('id', sessionId)
    .single()

  if (!session) return empty

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', session.organization_id)
    .single()

  const settings = org?.settings as OrganizationSettings | null
  if (!settings?.invoice?.auto_send_square_on_approve) {
    return empty
  }

  // Fetch pending invoices for this session that haven't been sent via Square
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount, due_date, client:clients(id, name, contact_email, square_customer_id, billing_method)')
    .eq('session_id', sessionId)
    .eq('status', 'pending')
    .is('square_invoice_id', null)

  if (!invoices || invoices.length === 0) return empty

  const result: AutoSendResult = { attempted: 0, sent: 0, skipped: 0, failed: [] }

  // Build description from session data (same pattern as /api/invoices/[id]/square)
  const serviceType = Array.isArray(session.service_type) ? session.service_type[0] : session.service_type
  const sessionDate = session.date
    ? new Date(session.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'N/A'
  const description = `${serviceType?.name || 'Session'} on ${sessionDate}`

  for (const invoice of invoices) {
    const client = Array.isArray(invoice.client) ? invoice.client[0] : invoice.client

    // Only auto-send to clients whose billing method is 'square' (or legacy clients with a square_customer_id)
    const isSquareBilling = client?.billing_method === 'square' || (!client?.billing_method && client?.square_customer_id)
    if (!isSquareBilling) {
      result.skipped++
      continue
    }

    if (!client.contact_email) {
      result.skipped++
      continue
    }

    result.attempted++

    try {
      const invoiceNumber = `INV-${invoice.id.slice(0, 8).toUpperCase()}`
      const dueDate = invoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const squareResult = await createSquareInvoice({
        clientName: client.name,
        clientEmail: client.contact_email,
        amount: Number(invoice.amount),
        description,
        dueDate,
        invoiceNumber,
      })

      await supabase
        .from('invoices')
        .update({
          square_invoice_id: squareResult.invoiceId,
          square_payment_url: squareResult.invoiceUrl,
          status: 'sent',
        })
        .eq('id', invoice.id)

      // Save Square customer ID on the client if not already set
      if (squareResult.customerId && client.id && !client.square_customer_id) {
        await supabase
          .from('clients')
          .update({ square_customer_id: squareResult.customerId })
          .eq('id', client.id)
      }

      result.sent++
    } catch (err) {
      logger.error(`Auto-send Square invoice failed for client ${client.name}`, err)
      result.failed.push(client.name)
    }
  }

  logger.info('Auto-send Square invoices completed', {
    sessionId,
    attempted: result.attempted,
    sent: result.sent,
    skipped: result.skipped,
    failed: result.failed.length,
  })

  return result
}
