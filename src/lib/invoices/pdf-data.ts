import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptClientNotesForPortal } from '@/lib/portal/decrypt-notes'
import type { OrganizationSettings } from '@/types/database'

/**
 * Single source for the data that goes onto a client-facing invoice PDF.
 *
 * Both the download/preview route (`/api/invoices/[id]/pdf`) and the email
 * sender (`sendInvoiceById`) MUST build their PDF from this function — the
 * preview's whole value is that it shows exactly what the client receives, and
 * two hand-rolled queries drift (they already had: both selected the session's
 * internal `notes`, which the template rightly never renders, while omitting
 * `client_notes`, the field the template's "Session Notes" section actually
 * displays — so client-facing notes never appeared on any sent invoice).
 *
 * Internal `session.notes` is staff-only PHI and is deliberately never
 * selected here.
 */

export interface InvoicePdfLineItem {
  description: string
  session_date: string
  duration_minutes: number | null
  amount: number
  service_type_name: string | null
  contractor_name: string | null
}

export interface InvoicePdfSession {
  id: string
  date: string
  duration_minutes: number | null
  /** Client-facing notes, decrypted — safe to render on the PDF. */
  client_notes: string | null
  contractor_id: string | null
  contractor: { id: string; name: string } | null
  service_type: { name: string } | null
}

export interface InvoicePdfInvoice {
  id: string
  organization_id: string
  client_id: string
  session_id: string | null
  amount: number
  mca_cut: number
  contractor_pay: number
  status: 'pending' | 'sent' | 'paid'
  payment_method: string
  invoice_type: string | null
  billing_period: string | null
  due_date: string | null
  paid_date: string | null
  created_at: string
  client: { id: string; name: string; contact_email: string | null } | null
  session: InvoicePdfSession | null
  items?: InvoicePdfLineItem[]
}

export interface InvoicePdfBundle {
  invoice: InvoicePdfInvoice
  footerText?: string
  paymentInstructions?: string
}

export async function fetchInvoicePdfData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  invoiceId: string
): Promise<InvoicePdfBundle | null> {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients(id, name, contact_email),
      session:sessions(
        id,
        date,
        duration_minutes,
        client_notes,
        contractor_id,
        contractor:users(id, name),
        service_type:service_types(name)
      )
    `)
    .eq('id', invoiceId)
    .single()

  if (error || !invoice) return null

  // client_notes is encrypted at rest (ENCRYPTION_KEY is server-only, so this
  // function must only ever run server-side); tolerate legacy plaintext rows.
  if (invoice.session?.client_notes) {
    invoice.session.client_notes = await decryptClientNotesForPortal(invoice.session.client_notes)
  }

  let items: InvoicePdfLineItem[] | undefined
  if (invoice.invoice_type === 'batch') {
    const { data: itemsData } = await supabase
      .from('invoice_items')
      .select('description, session_date, duration_minutes, amount, service_type_name, contractor_name')
      .eq('invoice_id', invoiceId)
      .order('session_date', { ascending: true })

    items = itemsData && itemsData.length > 0 ? (itemsData as InvoicePdfLineItem[]) : undefined
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', invoice.organization_id)
    .single()

  const settings = org?.settings as OrganizationSettings | undefined

  return {
    invoice: { ...invoice, items } as InvoicePdfInvoice,
    footerText: settings?.invoice?.footer_text || undefined,
    paymentInstructions: settings?.invoice?.payment_instructions || undefined,
  }
}
