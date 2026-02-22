import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uuidSchema } from '@/lib/validation/schemas'
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'
import { sendInvoiceById } from '@/lib/invoices/send'

export async function POST(
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

    // Check if user is admin/owner/developer and get their organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single<{ role: string; organization_id: string }>()

    const role = userProfile?.role as UserRole | undefined
    if (!can(role ?? null, 'invoice:send')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify organization ownership (developers can access all)
    if (role !== 'developer') {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('organization_id')
        .eq('id', id)
        .single()

      if (invoice && invoice.organization_id !== userProfile?.organization_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const result = await sendInvoiceById(supabase, id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Invoice sent successfully' })
  } catch (error) {
    console.error('[MCA] Send invoice error')
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
