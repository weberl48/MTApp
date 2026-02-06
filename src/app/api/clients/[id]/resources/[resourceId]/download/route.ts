import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/clients/[id]/resources/[resourceId]/download
 *
 * Download a file resource.
 * Staff only (client download goes through portal API).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const { id: clientId, resourceId } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the resource
    const { data: resource, error: resourceError } = await supabase
      .from('client_resources')
      .select('*')
      .eq('id', resourceId)
      .eq('client_id', clientId)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Verify organization access
    if (resource.organization_id !== profile.organization_id && profile.role !== 'developer' && profile.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only file resources can be downloaded
    if (resource.resource_type !== 'file') {
      return NextResponse.json(
        { error: 'This resource is not a file' },
        { status: 400 }
      )
    }

    // Download from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('client-resources')
      .download(resource.content)

    if (downloadError || !fileData) {
      console.error('[MCA] Download error')
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      )
    }

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer()

    // Return the file with appropriate headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': resource.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${resource.file_name || 'download'}"`,
        'Content-Length': String(resource.file_size || arrayBuffer.byteLength),
      },
    })
  } catch (error) {
    console.error('[MCA] Error downloading file')
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}
