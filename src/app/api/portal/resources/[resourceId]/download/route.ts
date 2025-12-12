import { NextRequest, NextResponse } from 'next/server'
import { validateAccessToken } from '@/lib/portal/token'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * GET /api/portal/resources/[resourceId]/download
 *
 * Download a file resource for a client via portal.
 * Requires valid portal token in Authorization header.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params

    // Validate portal token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const validation = await validateAccessToken(token)

    if (!validation.valid || !validation.client) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Get the resource - must belong to this client
    const { data: resource, error: resourceError } = await supabase
      .from('client_resources')
      .select('*')
      .eq('id', resourceId)
      .eq('client_id', validation.client.id)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
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
      console.error('Download error:', downloadError)
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
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}
