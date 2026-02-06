import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/pdf/invoice-pdf'
import { createElement, ReactElement } from 'react'
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Fetch invoice with related data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, contact_email),
        session:sessions(
          id,
          date,
          duration_minutes,
          notes,
          contractor_id,
          contractor:users(id, name),
          service_type:service_types(name)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Authorization: developers can access all, admins can access their org, contractors can access their own sessions
    const isDeveloper = userProfile.role === 'developer'
    const isOrgAdmin = isAdmin && invoice.organization_id === userProfile.organization_id
    const isOwnSession = (invoice.session as { contractor_id?: string })?.contractor_id === user.id

    if (!isDeveloper && !isOrgAdmin && !isOwnSession) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      createElement(InvoicePDF, { invoice }) as ReactElement<DocumentProps>
    )

    // Return PDF response
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer)
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${id.slice(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[MCA] PDF generation error')
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
