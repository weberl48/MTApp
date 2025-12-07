import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Use service role for webhooks since there's no user context
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    }

    // Handle payment events (as backup)
    if (event.type === 'payment.completed') {
      const paymentData = event.data?.object?.payment
      const invoiceId = paymentData?.invoice_id

      if (invoiceId) {
        await supabaseAdmin
          .from('invoices')
          .update({
            status: 'paid',
            paid_date: new Date().toISOString().split('T')[0],
          })
          .eq('square_invoice_id', invoiceId)

        console.log(`Marked invoice ${invoiceId} as paid from payment event`)
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
