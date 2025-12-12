import { NextRequest, NextResponse } from 'next/server'
import { validateAccessToken } from '@/lib/portal/token'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * GET /api/portal/resources
 *
 * Get all resources (homework, files, links) shared with the client.
 */
export async function GET(request: NextRequest) {
  try {
    // Validate token
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 401 }
      )
    }

    const validation = await validateAccessToken(token)
    if (!validation.valid || !validation.clientId) {
      return NextResponse.json(
        { error: validation.error || 'Invalid token' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // Get optional filter from query params
    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get('type') // 'homework', 'file', 'link', or null for all

    let query = supabase
      .from('client_resources')
      .select(`
        id,
        title,
        description,
        resource_type,
        content,
        file_name,
        file_size,
        mime_type,
        due_date,
        is_completed,
        completed_at,
        created_at,
        created_by:users(id, name)
      `)
      .eq('client_id', validation.clientId)
      .order('created_at', { ascending: false })

    if (resourceType && ['homework', 'file', 'link'].includes(resourceType)) {
      query = query.eq('resource_type', resourceType)
    }

    const { data: resources, error } = await query

    if (error) {
      throw error
    }

    // Transform data
    const transformedResources = (resources || []).map((resource) => ({
      ...resource,
      created_by: Array.isArray(resource.created_by)
        ? resource.created_by[0]
        : resource.created_by,
      // Don't expose storage paths for files - client will use download endpoint
      content: resource.resource_type === 'file' ? undefined : resource.content,
    }))

    return NextResponse.json({ resources: transformedResources })
  } catch (error) {
    console.error('Error fetching portal resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/portal/resources
 *
 * Update a resource (e.g., mark homework as completed).
 */
export async function PATCH(request: NextRequest) {
  try {
    // Validate token
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 401 }
      )
    }

    const validation = await validateAccessToken(token)
    if (!validation.valid || !validation.clientId) {
      return NextResponse.json(
        { error: validation.error || 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { resourceId, is_completed } = body

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Verify the resource belongs to this client
    const { data: resource, error: fetchError } = await supabase
      .from('client_resources')
      .select('id, client_id, resource_type')
      .eq('id', resourceId)
      .single()

    if (fetchError || !resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    if (resource.client_id !== validation.clientId) {
      return NextResponse.json(
        { error: 'Not authorized to update this resource' },
        { status: 403 }
      )
    }

    // Only homework can be marked as completed
    if (resource.resource_type !== 'homework') {
      return NextResponse.json(
        { error: 'Only homework can be marked as completed' },
        { status: 400 }
      )
    }

    // Update the resource
    const { data: updated, error: updateError } = await supabase
      .from('client_resources')
      .update({
        is_completed: is_completed === true,
        completed_at: is_completed === true ? new Date().toISOString() : null,
      })
      .eq('id', resourceId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ resource: updated })
  } catch (error) {
    console.error('Error updating portal resource:', error)
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    )
  }
}
