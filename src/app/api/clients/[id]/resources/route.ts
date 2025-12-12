import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/clients/[id]/resources
 *
 * Get all resources for a client.
 * Staff only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
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

    // Verify client belongs to same org
    const { data: client } = await supabase
      .from('clients')
      .select('id, organization_id')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (client.organization_id !== profile.organization_id && profile.role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get resources
    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get('type')

    let query = supabase
      .from('client_resources')
      .select(`
        *,
        created_by:users(id, name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (resourceType && ['homework', 'file', 'link'].includes(resourceType)) {
      query = query.eq('resource_type', resourceType)
    }

    const { data: resources, error } = await query

    if (error) {
      throw error
    }

    // Transform
    const transformed = (resources || []).map((r) => ({
      ...r,
      created_by: Array.isArray(r.created_by) ? r.created_by[0] : r.created_by,
    }))

    return NextResponse.json({ resources: transformed })
  } catch (error) {
    console.error('Error fetching client resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/clients/[id]/resources
 *
 * Create a new resource for a client.
 * Staff only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
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

    // All staff can create resources
    const allowedRoles = ['developer', 'owner', 'admin', 'contractor']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify client belongs to same org
    const { data: client } = await supabase
      .from('clients')
      .select('id, organization_id')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (client.organization_id !== profile.organization_id && profile.role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      resource_type,
      content,
      file_name,
      file_size,
      mime_type,
      due_date,
    } = body

    if (!title || !resource_type || !content) {
      return NextResponse.json(
        { error: 'Title, resource type, and content are required' },
        { status: 400 }
      )
    }

    if (!['homework', 'file', 'link'].includes(resource_type)) {
      return NextResponse.json(
        { error: 'Invalid resource type' },
        { status: 400 }
      )
    }

    // Validate URL for links
    if (resource_type === 'link') {
      try {
        new URL(content)
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL' },
          { status: 400 }
        )
      }
    }

    // Create resource
    const { data: resource, error } = await supabase
      .from('client_resources')
      .insert({
        client_id: clientId,
        organization_id: client.organization_id,
        title,
        description: description || null,
        resource_type,
        content,
        file_name: file_name || null,
        file_size: file_size || null,
        mime_type: mime_type || null,
        due_date: due_date || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ resource })
  } catch (error) {
    console.error('Error creating client resource:', error)
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/clients/[id]/resources
 *
 * Delete a resource.
 * Staff only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
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

    // Only admins+ can delete
    const allowedRoles = ['developer', 'owner', 'admin']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { resourceId } = body

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    // Verify resource belongs to this client and org
    const { data: resource } = await supabase
      .from('client_resources')
      .select('id, client_id, organization_id, resource_type, content')
      .eq('id', resourceId)
      .single()

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    if (resource.client_id !== clientId) {
      return NextResponse.json({ error: 'Resource does not belong to this client' }, { status: 400 })
    }

    if (resource.organization_id !== profile.organization_id && profile.role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If it's a file, delete from storage too
    if (resource.resource_type === 'file' && resource.content) {
      await supabase.storage
        .from('client-resources')
        .remove([resource.content])
    }

    // Delete the resource
    const { error } = await supabase
      .from('client_resources')
      .delete()
      .eq('id', resourceId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client resource:', error)
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    )
  }
}
