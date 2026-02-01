import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { Resend } from 'resend'
import { formatCurrency } from '@/lib/pricing'

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

// Use service role for webhooks since there's no user context
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

// Send payment notification to organization owner
async function sendPaymentNotification(squareInvoiceId: string) {
  try {
    // Fetch invoice with related data
    const { data: invoice } = await supabaseAdmin
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
    const { data: owner } = await supabaseAdmin
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
    await resend.emails.send({
      from: 'May Creative Arts <noreply@rattatata.xyz>',
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
            ${session?.date ? `<p style="margin: 4px 0;"><strong>Session Date:</strong> ${new Date(session.date).toLocaleDateString()}</p>` : ''}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This is an automated notification from your MCA Manager.</p>
        </div>
      `,
    })

    console.log(`Payment notification sent to ${owner.email}`)
  } catch (error) {
    // Don't fail the webhook if notification fails
    console.error('Failed to send payment notification:', error)
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
  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-square-hmacsha256-signature')

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production' && process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }

      const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/square`
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

    console.log('Square webhook event:', event.type)

    // Handle invoice events
    if (event.type === 'invoice.payment_made' || event.type === 'invoice.updated') {
      const invoiceData = event.data?.object?.invoice

      if (!invoiceData?.id) {
        return NextResponse.json({ error: 'Invalid invoice data' }, { status: 400 })
      }

      const squareInvoiceId = invoiceData.id
      const squareStatus = invoiceData.status

      // Map Square status to our status
      let ourStatus: 'pending' | 'sent' | 'paid' = 'sent'
      let paidDate: string | null = null

      if (squareStatus === 'PAID') {
        ourStatus = 'paid'
        paidDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      } else if (squareStatus === 'UNPAID' || squareStatus === 'SCHEDULED') {
        ourStatus = 'sent'
      } else if (squareStatus === 'CANCELED' || squareStatus === 'DRAFT') {
        ourStatus = 'pending'
      }

      // Update our invoice
      const updateData: Record<string, unknown> = { status: ourStatus }
      if (paidDate) {
        updateData.paid_date = paidDate
      }

      const { error } = await supabaseAdmin
        .from('invoices')
        .update(updateData)
        .eq('square_invoice_id', squareInvoiceId)

      if (error) {
        console.error('Error updating invoice from webhook:', error)
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
      }

      console.log(`Updated invoice ${squareInvoiceId} to status ${ourStatus}`)

      // Send notification to owner when invoice is paid
      if (ourStatus === 'paid') {
        await sendPaymentNotification(squareInvoiceId)
      }
    }

    // Handle payment events (as backup)
    if (event.type === 'payment.completed') {
      const paymentData = event.data?.object?.payment
      const invoiceId = paymentData?.invoice_id

      if (invoiceId) {
        const { error } = await supabaseAdmin
          .from('invoices')
          .update({
            status: 'paid',
            paid_date: new Date().toISOString().split('T')[0],
          })
          .eq('square_invoice_id', invoiceId)

        if (!error) {
          console.log(`Marked invoice ${invoiceId} as paid from payment event`)
          await sendPaymentNotification(invoiceId)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Square webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
