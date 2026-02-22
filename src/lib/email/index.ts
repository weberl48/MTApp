import { Resend } from 'resend'
import { escape as escapeHtml } from 'he'
import { format, parse } from 'date-fns'
import { parseLocalDate } from '@/lib/dates'

// Lazy initialize Resend to avoid build-time errors
let resend: Resend | null = null

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required')
    }
    resend = new Resend(apiKey)
  }
  return resend
}

interface SendInvoiceEmailParams {
  to: string
  clientName: string
  invoiceNumber: string
  amount: number
  sessionDate: string
  serviceType: string
  dueDate?: string
  pdfBuffer?: Buffer
  footerText?: string
  paymentInstructions?: string
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
  footerText,
  paymentInstructions,
}: SendInvoiceEmailParams) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)

  // Use date-fns for consistent date formatting
  const formattedDate = format(new Date(sessionDate), 'MMMM d, yyyy')
  const formattedDueDate = dueDate ? format(new Date(dueDate), 'MMMM d, yyyy') : null

  const attachments = pdfBuffer
    ? [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ]
    : []

  const { data, error } = await getResendClient().emails.send({
    from: 'May Creative Arts <noreply@rattatata.xyz>',
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

              ${paymentInstructions ? `
              <div style="background-color: #f0f9ff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #0369a1; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Payment Instructions</p>
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 22px; white-space: pre-line;">${escapeHtml(paymentInstructions)}</p>
              </div>
              ` : ''}

              <p style="margin: 0; color: #4b5563; font-size: 14px;">
                ${footerText ? escapeHtml(footerText) : 'Thank you for choosing May Creative Arts!'}
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
    console.error('[MCA] Email send error')
    throw error
  }

  return data
}

// Invoice Reminder Email

interface SendInvoiceReminderEmailParams {
  to: string
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  isOverdue: boolean
  paymentInstructions?: string
  footerText?: string
}

export async function sendInvoiceReminderEmail({
  to,
  clientName,
  invoiceNumber,
  amount,
  dueDate,
  isOverdue,
  paymentInstructions,
  footerText,
}: SendInvoiceReminderEmailParams) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)

  const formattedDueDate = format(new Date(dueDate), 'MMMM d, yyyy')
  const subject = isOverdue
    ? `Overdue: Invoice ${invoiceNumber} - May Creative Arts`
    : `Payment Reminder: Invoice ${invoiceNumber} — Due ${formattedDueDate}`

  const urgencyColor = isOverdue ? '#dc2626' : '#d97706'
  const urgencyBg = isOverdue ? '#fee2e2' : '#fef3c7'
  const urgencyText = isOverdue
    ? 'This invoice is past due. Please submit payment at your earliest convenience.'
    : `This is a friendly reminder that your invoice is due on <strong>${formattedDueDate}</strong>.`

  const { data, error } = await getResendClient().emails.send({
    from: 'May Creative Arts <noreply@rattatata.xyz>',
    to: [to],
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Reminder</title>
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
              <p style="margin: 8px 0 0; color: #93c5fd; font-size: 14px;">Payment Reminder</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px;">Hello ${escapeHtml(clientName)},</h2>

              <!-- Urgency Banner -->
              <div style="background-color: ${urgencyBg}; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: ${urgencyColor}; font-size: 15px; line-height: 22px;">
                  ${urgencyText}
                </p>
              </div>

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
                          <span style="color: #6b7280; font-size: 14px;">Due Date:</span>
                          <span style="color: #111827; font-size: 14px; margin-left: 12px;">${formattedDueDate}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${paymentInstructions ? `
              <div style="background-color: #f0f9ff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #0369a1; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Payment Instructions</p>
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 22px; white-space: pre-line;">${escapeHtml(paymentInstructions)}</p>
              </div>
              ` : ''}

              <p style="margin: 0; color: #4b5563; font-size: 14px;">
                ${footerText ? escapeHtml(footerText) : 'Thank you for choosing May Creative Arts!'}
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
  })

  if (error) {
    console.error('[MCA] Invoice reminder email error')
    throw error
  }

  return data
}

// Portal Email Templates

interface SendMagicLinkEmailParams {
  to: string
  clientName: string
  organizationName: string
  portalUrl: string
}

export async function sendMagicLinkEmail({
  to,
  clientName,
  organizationName,
  portalUrl,
}: SendMagicLinkEmailParams) {
  const { data, error } = await getResendClient().emails.send({
    from: `${organizationName} <noreply@rattatata.xyz>`,
    to: [to],
    subject: `Your Portal Access Link - ${organizationName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Portal Access</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #1e40af; padding: 30px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">${organizationName}</h1>
              <p style="margin: 8px 0 0; color: #93c5fd; font-size: 14px;">Client Portal</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px;">Hello ${clientName},</h2>

              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 24px;">
                Here's your secure link to access your client portal. Click the button below to view your sessions, resources, and goals.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Access Your Portal
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 22px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px; color: #1e40af; font-size: 14px; word-break: break-all;">
                ${portalUrl}
              </p>

              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Security note:</strong> This link is unique to you. Please don't share it with others. The link will expire after 30 days of inactivity.
                </p>
              </div>

              <p style="margin: 0; color: #4b5563; font-size: 14px;">
                If you didn't request this link, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-align: center;">
                ${organizationName}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                This is an automated message. Please do not reply directly to this email.
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
  })

  if (error) {
    console.error('[MCA] Magic link email error')
    throw error
  }

  return data
}

interface SendSessionRequestStatusEmailParams {
  to: string
  clientName: string
  organizationName: string
  status: 'approved' | 'declined'
  preferredDate: string
  preferredTime?: string | null
  responseNotes?: string | null
  portalUrl: string
}

export async function sendSessionRequestStatusEmail({
  to,
  clientName,
  organizationName,
  status,
  preferredDate,
  preferredTime,
  responseNotes,
  portalUrl,
}: SendSessionRequestStatusEmailParams) {
  // Use date-fns for consistent date/time formatting
  const formattedDate = format(parseLocalDate(preferredDate), 'EEEE, MMMM d, yyyy')
  const formattedTime = preferredTime
    ? format(parse(preferredTime, 'HH:mm', new Date()), 'h:mm a')
    : null

  const isApproved = status === 'approved'
  const statusColor = isApproved ? '#059669' : '#dc2626'
  const statusBgColor = isApproved ? '#d1fae5' : '#fee2e2'
  const statusText = isApproved ? 'Approved' : 'Declined'
  const statusEmoji = isApproved ? '✓' : '✗'

  const { data, error } = await getResendClient().emails.send({
    from: `${organizationName} <noreply@rattatata.xyz>`,
    to: [to],
    subject: `Session Request ${statusText} - ${organizationName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Request ${statusText}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #1e40af; padding: 30px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">${organizationName}</h1>
              <p style="margin: 8px 0 0; color: #93c5fd; font-size: 14px;">Session Request Update</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px;">Hello ${clientName},</h2>

              <!-- Status Badge -->
              <div style="background-color: ${statusBgColor}; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0; color: ${statusColor}; font-size: 18px; font-weight: 600;">
                  ${statusEmoji} Your session request has been ${statusText.toLowerCase()}
                </p>
              </div>

              <!-- Request Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Requested Date & Time</p>
                    <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 500;">
                      ${formattedDate}${formattedTime ? ` at ${formattedTime}` : ''}
                    </p>
                  </td>
                </tr>
              </table>

              ${responseNotes ? `
              <div style="border-left: 4px solid #1e40af; padding-left: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Message from your therapist</p>
                <p style="margin: 0; color: #374151; font-size: 15px; line-height: 24px;">${escapeHtml(responseNotes)}</p>
              </div>
              ` : ''}

              <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 24px;">
                ${isApproved
                  ? 'Great news! Your session has been confirmed. You can view the details in your portal.'
                  : 'We were unable to accommodate this request. Please visit your portal to request a different time.'}
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      View in Portal
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-align: center;">
                ${organizationName}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                This is an automated message. Please do not reply directly to this email.
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
  })

  if (error) {
    console.error('[MCA] Session request status email error')
    throw error
  }

  return data
}

// Team Invite Email

interface SendTeamInviteEmailParams {
  to: string
  inviteeName?: string
  organizationName: string
  role: 'owner' | 'admin' | 'contractor'
  inviteUrl: string
  expiresAt: string
  invitedBy: string
}

export async function sendTeamInviteEmail({
  to,
  inviteeName,
  organizationName,
  role,
  inviteUrl,
  expiresAt,
  invitedBy,
}: SendTeamInviteEmailParams) {
  const formattedExpiry = format(new Date(expiresAt), 'MMMM d, yyyy')
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1)

  const { data, error } = await getResendClient().emails.send({
    from: `${organizationName} <noreply@rattatata.xyz>`,
    to: [to],
    subject: `You're invited to join ${organizationName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #1e40af; padding: 30px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">${organizationName}</h1>
              <p style="margin: 8px 0 0; color: #93c5fd; font-size: 14px;">Team Invitation</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px;">Hello${inviteeName ? ` ${inviteeName}` : ''},</h2>

              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 24px;">
                <strong>${invitedBy}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${roleDisplay}</strong>.
              </p>

              <!-- Role Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #0369a1; font-size: 14px; font-weight: 600;">Your Role: ${roleDisplay}</p>
                    <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
                      ${role === 'owner' ? 'Full access to manage the organization, team, and all settings.' :
                        role === 'admin' ? 'Manage sessions, invoices, clients, and team members.' :
                        'Log sessions and view your invoices and earnings.'}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 22px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px; color: #1e40af; font-size: 14px; word-break: break-all;">
                ${inviteUrl}
              </p>

              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Note:</strong> This invitation link expires on ${formattedExpiry} and can only be used once.
                </p>
              </div>

              <p style="margin: 0; color: #4b5563; font-size: 14px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-align: center;">
                ${organizationName}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                This is an automated message. Please do not reply directly to this email.
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
  })

  if (error) {
    console.error('[MCA] Team invite email error')
    throw error
  }

  return data
}
