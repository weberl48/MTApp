import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Use service role for cron jobs since there's no user context
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Verify the cron secret to ensure this is called by Vercel Cron
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  // In production, verify against the cron secret
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }

  // In development, allow all requests
  return process.env.NODE_ENV !== 'production'
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get pending reminders that are due
    const { data: reminders, error: fetchError } = await supabaseAdmin
      .from('session_reminders')
      .select(`
        id,
        organization_id,
        session_id,
        reminder_type,
        recipient_email,
        recipient_name,
        scheduled_for,
        session:sessions(
          date,
          duration_minutes,
          notes,
          service_type:service_types(name),
          contractor:users(name),
          session_attendees(client:clients(name))
        ),
        organization:organizations(name, email)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50) // Process in batches

    if (fetchError) {
      console.error('Error fetching reminders:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({ message: 'No pending reminders', processed: 0 })
    }

    let successCount = 0
    let failCount = 0

    for (const reminder of reminders) {
      try {
        // Skip if no email configured
        if (!resend) {
          console.log('Resend not configured, skipping reminder:', reminder.id)
          await supabaseAdmin
            .from('session_reminders')
            .update({
              status: 'failed',
              error_message: 'Email service not configured',
              updated_at: new Date().toISOString(),
            })
            .eq('id', reminder.id)
          failCount++
          continue
        }

        // Supabase returns single relations as arrays, extract first element
        const sessionData = reminder.session as unknown as {
          date: string
          duration_minutes: number
          notes: string | null
          service_type: { name: string }[]
          contractor: { name: string }[]
          session_attendees: { client: { name: string }[] }[]
        }[] | null

        const session = sessionData?.[0] ? {
          ...sessionData[0],
          service_type: sessionData[0].service_type?.[0] || null,
          contractor: sessionData[0].contractor?.[0] || null,
          session_attendees: sessionData[0].session_attendees?.map(a => ({
            client: a.client?.[0] || null
          })) || []
        } : null

        const orgData = reminder.organization as unknown as { name: string; email: string | null }[] | null
        const org = orgData?.[0] || null

        if (!session) {
          await supabaseAdmin
            .from('session_reminders')
            .update({
              status: 'failed',
              error_message: 'Session not found',
              updated_at: new Date().toISOString(),
            })
            .eq('id', reminder.id)
          failCount++
          continue
        }

        // Build client list
        const clients = session.session_attendees
          ?.map(a => a.client?.name)
          .filter((name): name is string => !!name)
          .join(', ') || 'No clients'

        // Format date
        const sessionDate = new Date(session.date)
        const formattedDate = sessionDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        // Build email content
        const subject = `Session Reminder: ${session.service_type?.name || 'Session'} on ${formattedDate}`

        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Session Reminder</h2>
            <p>Hi ${reminder.recipient_name || 'there'},</p>
            <p>This is a reminder about your upcoming session:</p>

            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 4px 0;"><strong>Service:</strong> ${session.service_type?.name || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>Duration:</strong> ${session.duration_minutes} minutes</p>
              <p style="margin: 4px 0;"><strong>Clients:</strong> ${clients}</p>
            </div>

            ${session.notes ? `<p><strong>Notes:</strong> ${session.notes}</p>` : ''}

            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              - ${org?.name || 'Your Practice'}
            </p>
          </div>
        `

        // Send email
        const { error: emailError } = await resend.emails.send({
          from: org?.email || 'noreply@maycreativearts.com',
          to: reminder.recipient_email,
          subject,
          html: htmlContent,
        })

        if (emailError) {
          console.error('Error sending reminder email:', emailError)
          await supabaseAdmin
            .from('session_reminders')
            .update({
              status: 'failed',
              error_message: emailError.message,
              updated_at: new Date().toISOString(),
            })
            .eq('id', reminder.id)
          failCount++
          continue
        }

        // Mark as sent
        await supabaseAdmin
          .from('session_reminders')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', reminder.id)

        successCount++
      } catch (error) {
        console.error('Error processing reminder:', reminder.id, error)
        await supabaseAdmin
          .from('session_reminders')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reminder.id)
        failCount++
      }
    }

    return NextResponse.json({
      message: 'Reminders processed',
      processed: reminders.length,
      success: successCount,
      failed: failCount,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
