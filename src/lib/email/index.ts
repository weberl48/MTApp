import { Resend } from 'resend'

// Initialize Resend - will use API key from environment
const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInvoiceEmailParams {
  to: string
  clientName: string
  invoiceNumber: string
  amount: number
  sessionDate: string
  serviceType: string
  dueDate?: string
  pdfBuffer?: Buffer
}

export async function sendInvoiceEmail({
  to,
  clientName,
  invoiceNumber,
  amount,
  sessionDate,
  serviceType,
  dueDate,
  pdfBuffer,
}: SendInvoiceEmailParams) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)

  const formattedDate = new Date(sessionDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const attachments = pdfBuffer
    ? [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ]
    : []

  const { data, error } = await resend.emails.send({
    from: 'May Creative Arts <onboarding@resend.dev>',
    to: [to],
    subject: `Invoice ${invoiceNumber} - May Creative Arts`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice from May Creative Arts</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #1e40af; padding: 30px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">May Creative Arts</h1>
              <p style="margin: 8px 0 0; color: #93c5fd; font-size: 14px;">Music Therapy Services</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px;">Hello ${clientName},</h2>

              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 24px;">
                Thank you for your recent session with May Creative Arts. Please find your invoice details below.
              </p>

              <!-- Invoice Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Number</p>
                          <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${invoiceNumber}</p>
                        </td>
                        <td align="right">
                          <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Amount Due</p>
                          <p style="margin: 0; color: #1e40af; font-size: 24px; font-weight: bold;">${formattedAmount}</p>
                        </td>
                      </tr>
                    </table>

                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Service:</span>
                          <span style="color: #111827; font-size: 14px; margin-left: 12px;">${serviceType}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Session Date:</span>
                          <span style="color: #111827; font-size: 14px; margin-left: 12px;">${formattedDate}</span>
                        </td>
                      </tr>
                      ${
                        formattedDueDate
                          ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Due Date:</span>
                          <span style="color: #111827; font-size: 14px; margin-left: 12px;">${formattedDueDate}</span>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; color: #4b5563; font-size: 14px; line-height: 22px;">
                ${pdfBuffer ? 'A PDF copy of your invoice is attached to this email. ' : ''}If you have any questions about this invoice, please don't hesitate to reach out.
              </p>

              <p style="margin: 0; color: #4b5563; font-size: 14px;">
                Thank you for choosing May Creative Arts!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-align: center;">
                May Creative Arts | Music Therapy Services
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Questions? Contact us at maycreativearts@gmail.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    attachments,
  })

  if (error) {
    console.error('Email send error:', error)
    throw error
  }

  return data
}
