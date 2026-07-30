import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiRateLimit } from '@/lib/rate-limit'
import { helpChatSchema } from '@/lib/validation/schemas'
import { isFeatureEnabled } from '@/lib/features'
import { can } from '@/lib/auth/permissions'
import { buildOrgContext, streamHelpAnswer } from '@/lib/help/ai'
import { logger } from '@/lib/logger'
import type { OrganizationSettings, ServiceType, UserRole } from '@/types/database'

export const maxDuration = 60

/** Config probe for the chat UI: reveals only that a key exists. */
export async function GET() {
  return NextResponse.json({ configured: !!process.env.ANTHROPIC_API_KEY })
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: org } = await supabase
    .from('organizations')
    .select('name, settings')
    .eq('id', profile.organization_id)
    .single()
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const settings = (org.settings || {}) as OrganizationSettings
  if (!isFeatureEnabled(settings, 'ai_help')) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 })
  }

  if (aiRateLimit) {
    const { success } = await aiRateLimit.limit(`user:${profile.id}`)
    if (!success) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }
  }

  const parsed = helpChatSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { messages } = parsed.data

  const role = profile.role as UserRole
  const { data: serviceTypes } = await supabase
    .from('service_types')
    .select('*')
    .eq('organization_id', profile.organization_id)

  // Gap detection: what people ask the AI is content-planning signal.
  const lastQuestion = messages[messages.length - 1].content
  supabase
    .from('help_events')
    .insert({
      organization_id: profile.organization_id,
      user_id: profile.id,
      event_type: 'ai_question',
      query: lastQuestion.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200),
    })
    .then(
      () => {},
      () => {}
    )

  const stream = streamHelpAnswer({
    apiKey,
    messages,
    includeAdminOnly: can(role, 'session:view-all'),
    orgContext: buildOrgContext(org.name, settings, (serviceTypes || []) as ServiceType[], role),
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        logger.error('AI help stream failed', err)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'stream_failed' })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
