import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/pdf/invoice-pdf'
import { createElement, ReactElement } from 'react'
import { can } from '@/lib/auth/permissions'
import { uuidSchema } from '@/lib/validation/schemas'
import { fetchInvoicePdfData } from '@/lib/invoices/pdf-data'
import type { UserRole } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with role and organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single<{ role: string; organization_id: string }>()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const isAdmin = can(userProfile.role as UserRole, 'invoice:bulk-action')

    // Same data source as the email sender, so a previewed PDF is byte-for-byte
    // what sendInvoiceById would attach.
    const bundle = await fetchInvoicePdfData(supabase, id)
    if (!bundle) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    const { invoice, footerText, paymentInstructions } = bundle

    // Authorization: developers can access all, admins can access their org, contractors can access their own sessions
    const isDeveloper = userProfile.role === 'developer'
    const isOrgAdmin = isAdmin && invoice.organization_id === userProfile.organization_id
    const isOwnSession = invoice.session?.contractor_id === user.id

    if (!isDeveloper && !isOrgAdmin && !isOwnSession) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      createElement(InvoicePDF, { invoice, footerText, paymentInstructions }) as ReactElement<DocumentProps>
    )

    // ?inline=1 renders in the browser (invoice preview); default stays a download.
    const inline = request.nextUrl.searchParams.get('inline') === '1'

    // Return PDF response
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer)
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="invoice-${id.slice(0, 8)}.pdf"`,
        // Allow the invoice detail page's same-origin preview iframe; the
        // global next.config headers would otherwise send DENY/'none'.
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "frame-ancestors 'self'",
      },
    })
  } catch {
    console.error('[MCA] PDF generation error')
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
