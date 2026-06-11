import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendInvoiceReminderEmail } from '@/lib/email'
import { formatInvoiceNumber } from '@/lib/constants/display'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { OrganizationSettings } from '@/types/database'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }

  return process.env.NODE_ENV !== 'production'
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createServiceClient()
    const today = new Date()

    // Fetch all organizations with their settings
    const { data: orgs, error: orgsError } = await db
      .from('organizations')
      .select('id, settings')

    if (orgsError) {
      console.error('[MCA] Error fetching organizations for invoice reminders')
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }

    let totalSent = 0
    let totalSkipped = 0
    let totalFailed = 0

    for (const org of orgs || []) {
      const settings = org.settings as OrganizationSettings | null
      if (!settings?.invoice?.send_reminders) continue

      const reminderDays = settings.invoice.reminder_days
      if (!reminderDays || reminderDays.length === 0) continue

      const footerText = settings.invoice.footer_text || undefined
      const paymentInstructions = settings.invoice.payment_instructions || undefined

      // Fetch sent invoices with due dates for this org
      const { data: invoices, error: invoicesError } = await db
        .from('invoices')
        .select('id, amount, due_date, client:clients(name, contact_email)')
        .eq('organization_id', org.id)
        .eq('status', 'sent')
        .not('due_date', 'is', null)
        .limit(100)

      if (invoicesError) {
        console.error('[MCA] Error fetching invoices for org', org.id)
        totalFailed++
        continue
      }

      for (const invoice of invoices || []) {
        const client = Array.isArray(invoice.client) ? invoice.client[0] : invoice.client
        if (!client?.contact_email) {
          totalSkipped++
          continue
        }

        const dueDate = parseISO(invoice.due_date!)
        const daysUntilDue = differenceInCalendarDays(dueDate, today)

        // Check each configured reminder day. Claim the day ATOMICALLY before sending, so a
        // reminder is sent at most once even under cron retries or overlapping runs.
        for (const day of reminderDays) {
          if (daysUntilDue !== day) continue
          const { data: claimed } = await db.rpc('claim_invoice_reminder_day', {
            p_invoice_id: invoice.id,
            p_day: day,
          })
          if (!claimed) continue
          try {
            await sendInvoiceReminderEmail({
              to: client.contact_email,
              clientName: client.name,
              invoiceNumber: formatInvoiceNumber(invoice.id),
              amount: Number(invoice.amount),
              dueDate: invoice.due_date!,
              isOverdue: false,
              paymentInstructions,
              footerText,
            })
            totalSent++
          } catch {
            console.error('[MCA] Failed to send invoice reminder for', invoice.id)
            totalFailed++
          }
        }

        // Overdue notice (claimed once via the -1 sentinel — previously this re-sent EVERY day).
        if (daysUntilDue < 0 && reminderDays.includes(0)) {
          const { data: claimed } = await db.rpc('claim_invoice_reminder_day', {
            p_invoice_id: invoice.id,
            p_day: -1,
          })
          if (claimed) {
            try {
              await sendInvoiceReminderEmail({
                to: client.contact_email,
                clientName: client.name,
                invoiceNumber: formatInvoiceNumber(invoice.id),
                amount: Number(invoice.amount),
                dueDate: invoice.due_date!,
                isOverdue: true,
                paymentInstructions,
                footerText,
              })
              totalSent++
            } catch {
              console.error('[MCA] Failed to send overdue notice for', invoice.id)
              totalFailed++
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Invoice reminders processed',
      sent: totalSent,
      skipped: totalSkipped,
      failed: totalFailed,
    })
  } catch {
    console.error('[MCA] Invoice reminder cron error')
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
