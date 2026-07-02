import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { Resend } from 'resend'
import { formatCurrency } from '@/lib/pricing'
import { parseLocalDate } from '@/lib/dates'
import { logger } from '@/lib/logger'
import { resolveSquareWebhookStatus } from '@/lib/square/webhook-status'

// Types for Supabase join results
interface ClientJoinResult {
  name: string
}

interface ServiceTypeJoinResult {
  name: string
}

interface SessionJoinResult {
  date: string
  service_type: ServiceTypeJoinResult | ServiceTypeJoinResult[] | null
}

interface InvoiceWithJoins {
  id: string
  amount: number
  organization_id: string
  client: ClientJoinResult | ClientJoinResult[] | null
  session: SessionJoinResult | SessionJoinResult[] | null
}

// Lazy initialize clients to avoid build-time errors
let supabaseAdmin: SupabaseClient | null = null
let resendClient: Resend | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }
    supabaseAdmin = createClient(url, key)
  }
  return supabaseAdmin
}

function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY
    if (!key) {
      throw new Error('Missing RESEND_API_KEY environment variable')
    }
    resendClient = new Resend(key)
  }
  return resendClient
}

// Send payment notification to organization owner
async function sendPaymentNotification(squareInvoiceId: string) {
  try {
    // Fetch invoice with related data
    const { data: invoice } = await getSupabaseAdmin()
      .from('invoices')
      .select(`
        id,
        amount,
        organization_id,
        client:clients(name),
        session:sessions(
          date,
          service_type:service_types(name)
        )
      `)
      .eq('square_invoice_id', squareInvoiceId)
      .single()

    if (!invoice) return

    // Cast to typed interface
    const typedInvoice = invoice as InvoiceWithJoins

    // Fetch organization owner
    const { data: owner } = await getSupabaseAdmin()
      .from('users')
      .select('email, name')
      .eq('organization_id', typedInvoice.organization_id)
      .eq('role', 'owner')
      .single()

    if (!owner?.email) return

    // Extract nested data (handle Supabase join types which can be arrays or objects)
    const clientData = typedInvoice.client
    const clientName = Array.isArray(clientData) ? clientData[0]?.name : clientData?.name

    const sessionData = typedInvoice.session
    const session = Array.isArray(sessionData) ? sessionData[0] : sessionData
    const serviceType = session?.service_type
    const serviceTypeName = Array.isArray(serviceType) ? serviceType[0]?.name : serviceType?.name

    // Send notification email
    await getResend().emails.send({
      from: `May Creative Arts <noreply@${process.env.EMAIL_FROM_DOMAIN || 'rattatata.xyz'}>`,
      to: [owner.email],
      subject: `Payment Received - ${formatCurrency(typedInvoice.amount)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Payment Received!</h2>
          <p>A Square invoice has been paid:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Client:</strong> ${clientName || 'Unknown'}</p>
            <p style="margin: 4px 0;"><strong>Service:</strong> ${serviceTypeName || 'Unknown'}</p>
            <p style="margin: 4px 0;"><strong>Amount:</strong> ${formatCurrency(typedInvoice.amount)}</p>
            ${session?.date ? `<p style="margin: 4px 0;"><strong>Session Date:</strong> ${parseLocalDate(session.date).toLocaleDateString()}</p>` : ''}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This is an automated notification from your MCA Manager.</p>
        </div>
      `,
    })

    logger.info('Payment notification sent')
  } catch (error) {
    // Don't fail the webhook if notification fails
    logger.error('Failed to send payment notification')
  }
}

// Verify Square webhook signature
function verifySquareSignature(
  body: string,
  signature: string,
  webhookSignatureKey: string,
  notificationUrl: string
): boolean {
  const hmac = crypto.createHmac('sha256', webhookSignatureKey)
  hmac.update(notificationUrl + body)
  const expectedSignature = hmac.digest('base64')
  // Constant-time comparison to avoid leaking the expected HMAC via timing.
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expectedSignature)
  if (sigBuf.length !== expBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, expBuf)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-square-hmacsha256-signature')

    // Verify webhook signature in production (fail closed)
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
        logger.error('SQUARE_WEBHOOK_SIGNATURE_KEY is not configured')
        return NextResponse.json({ error: 'Webhook verification not configured' }, { status: 503 })
      }

      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }

      const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/square/`
      const isValid = verifySquareSignature(
        body,
        signature,
        process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
        notificationUrl
      )

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)

    // Sanitize log output to prevent log injection
    const eventType = String(event.type).replace(/[\r\n]/g, '')
    logger.info(`Square webhook event: ${eventType}`)

    // Replay/duplicate protection (CHECK): if this delivery was already fully processed, ack and
    // skip. We record the event id only AFTER processing succeeds (see end of handler) — recording
    // it first meant a transient failure during processing left the row committed, so Square's
    // retry was treated as a duplicate and the payment update was permanently lost.
    const eventId = typeof event.event_id === 'string' ? event.event_id : null
    if (eventId) {
      const { data: seen } = await getSupabaseAdmin()
        .from('square_webhook_events')
        .select('event_id')
        .eq('event_id', eventId)
        .maybeSingle()
      if (seen) {
        return NextResponse.json({ received: true, duplicate: true })
      }
    }

    // Handle invoice events
    if (event.type === 'invoice.payment_made' || event.type === 'invoice.updated') {
      const invoiceData = event.data?.object?.invoice

      if (!invoiceData?.id) {
        logger.error('Square webhook: no invoice ID in event data')
        return NextResponse.json({ error: 'Invalid invoice data' }, { status: 400 })
      }

      const squareInvoiceId = invoiceData.id
      const squareStatus = invoiceData.status

      // Find our invoice
      const { data: existingInvoice } = await getSupabaseAdmin()
        .from('invoices')
        .select('id, status, square_invoice_id')
        .eq('square_invoice_id', squareInvoiceId)
        .single()

      // Resolve the new status forward-only (never un-pay a paid invoice).
      const resolved = resolveSquareWebhookStatus(existingInvoice?.status, squareStatus)
      if (resolved) {
        const updateData: Record<string, unknown> = { status: resolved.status }
        if (resolved.setPaidDate) {
          updateData.paid_date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        }

        const { error } = await getSupabaseAdmin()
          .from('invoices')
          .update(updateData)
          .eq('square_invoice_id', squareInvoiceId)

        if (error) {
          logger.error('Error updating invoice from webhook')
          return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
        }

        logger.info(`Updated invoice to status ${resolved.status}`)

        // Notify the owner only on the transition INTO paid (not on every paid event/replay).
        if (resolved.status === 'paid' && existingInvoice?.status !== 'paid') {
          await sendPaymentNotification(squareInvoiceId)
        }
      }
    }

    // Handle payment events (as backup)
    if (event.type === 'payment.completed') {
      const paymentData = event.data?.object?.payment
      const invoiceId = paymentData?.invoice_id

      if (invoiceId) {
        const { data: existingInvoice } = await getSupabaseAdmin()
          .from('invoices')
          .select('id, status')
          .eq('square_invoice_id', invoiceId)
          .single()

        // Only act on the transition into paid — avoids a second notification for the same
        // payment when invoice.payment_made already marked it paid.
        if (existingInvoice && existingInvoice.status !== 'paid') {
          const { error } = await getSupabaseAdmin()
            .from('invoices')
            .update({
              status: 'paid',
              paid_date: new Date().toISOString().split('T')[0],
            })
            .eq('square_invoice_id', invoiceId)

          if (!error) {
            logger.info('Marked invoice as paid from payment event')
            await sendPaymentNotification(invoiceId)
          }
        }
      }
    }

    // Record the event ONLY after successful processing, so a failure above (which returns 500)
    // leaves no dedupe row and Square's retry reprocesses. A concurrent duplicate delivery could
    // still both process, but the invoice status mapping is forward-only and idempotent, so that
    // is safe (worst case: a second owner notification, already possible for distinct events).
    if (eventId) {
      const { error: dedupeError } = await getSupabaseAdmin()
        .from('square_webhook_events')
        .insert({ event_id: eventId, event_type: event.type })
      if (dedupeError && dedupeError.code !== '23505') {
        logger.error('Square webhook dedupe insert failed', dedupeError)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Square webhook error')
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
