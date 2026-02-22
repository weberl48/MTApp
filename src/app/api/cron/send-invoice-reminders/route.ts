import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { sendInvoiceReminderEmail } from '@/lib/email'
import { formatInvoiceNumber } from '@/lib/constants/display'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { OrganizationSettings } from '@/types/database'

// Lazy initialize clients to avoid build-time errors
let supabaseAdmin: SupabaseClient | null = null

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
    const db = getSupabaseAdmin()
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
        .select('id, amount, due_date, reminder_sent_days, client:clients(name, contact_email)')
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
        const alreadySent: number[] = (invoice.reminder_sent_days as number[]) || []

        // Check each configured reminder day
        for (const day of reminderDays) {
          if (daysUntilDue === day && !alreadySent.includes(day)) {
            // Time to send this reminder
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

              // Record that this reminder day was sent
              await db
                .from('invoices')
                .update({ reminder_sent_days: [...alreadySent, day] })
                .eq('id', invoice.id)

              alreadySent.push(day) // Update local copy for subsequent iterations
              totalSent++
            } catch {
              console.error('[MCA] Failed to send invoice reminder for', invoice.id)
              totalFailed++
            }
          }
        }

        // Check for overdue (day 0 in reminder_days means "on due date", negative means past due)
        if (daysUntilDue < 0 && reminderDays.includes(0) && !alreadySent.includes(-1)) {
          // Send overdue notice (use -1 as the sentinel for "overdue sent")
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

            await db
              .from('invoices')
              .update({ reminder_sent_days: [...alreadySent, -1] })
              .eq('id', invoice.id)

            totalSent++
          } catch {
            console.error('[MCA] Failed to send overdue notice for', invoice.id)
            totalFailed++
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
