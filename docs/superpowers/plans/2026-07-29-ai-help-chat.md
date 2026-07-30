# AI Help Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "Ask the AI helper" chat grounded in the help corpus + non-PHI org config — panel on `/help/`, floating bubble everywhere on the dashboard.

**Architecture:** Full-corpus system prompt (all articles + FAQs, role-filtered, Anthropic prompt caching) — no retrieval layer. Stateless streaming route `POST /api/help/chat`; browser holds history. Visibility = `features.ai_help` flag (client) AND key-configured (GET probe).

**Tech Stack:** Next.js 16 route handlers (SSE via ReadableStream), `@anthropic-ai/sdk`, zod, Upstash rate limiting, shadcn Sheet, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-29-ai-help-chat-design.md`

## Global Constraints

- `ANTHROPIC_API_KEY` is server-only — never `NEXT_PUBLIC_`, never logged, never sent to the browser.
- Model: `process.env.HELP_AI_MODEL || 'claude-sonnet-5'`; `max_tokens: 1024`; `temperature: 0`.
- No client/session/invoice/team data ever enters a prompt; org context is a whitelist (spec §1) and excludes the `security` settings section.
- All internal links trailing-slashed (`/help/<slug>/`).
- `help_events` writes fire-and-forget; migrations applied by hand to DEV ref `gzrukevymmguqxuoynqk` via Management API (prod deferred, called out).
- Commits: user is sole author — NO Co-Authored-By trailers.
- After every task: `npx tsc --noEmit` + `npm run lint` green before commit.

---

### Task 1: Migration + feature flag + env plumbing

**Files:**
- Create: `supabase/migrations/20260730_help_events_ai_question.sql`
- Modify: `src/types/database.ts` (FeatureFlags), `src/lib/organization/settings.ts` (DEFAULT_SETTINGS.features), `src/lib/features/index.ts` (FEATURE_DEFINITIONS), `src/lib/env.ts` (recommended vars)

**Interfaces:**
- Produces: `FeatureFlags.ai_help: boolean` (default `true`); DB accepts `event_type = 'ai_question'` rows with non-null `query`.

- [ ] **Step 1:** Write the migration exactly:

```sql
-- Allow AI-helper questions in the help-events gap-detection table.
alter table help_events drop constraint help_events_event_type_check;
alter table help_events add constraint help_events_event_type_check
  check (event_type in ('search_miss', 'article_feedback', 'ai_question'));
alter table help_events drop constraint help_events_shape;
alter table help_events add constraint help_events_shape check (
  (event_type = 'search_miss' and query is not null)
  or (event_type = 'article_feedback' and article_slug is not null and helpful is not null)
  or (event_type = 'ai_question' and query is not null)
);
```

- [ ] **Step 2:** Apply to DEV (`gzrukevymmguqxuoynqk`) with the existing scratchpad pattern (read `SUPABASE_ACCESS_TOKEN` from `.env.local`, POST the file to `https://api.supabase.com/v1/projects/<ref>/database/query`, never print the token). Verify: `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='help_events'::regclass and contype='c'` shows `ai_question` in both. Prod is NOT touched (note: prod needs `20260729_help_events.sql` + this file together, at next prod deploy).
- [ ] **Step 3:** `src/types/database.ts` — in `FeatureFlags` add `ai_help: boolean` under `client_portal`.
- [ ] **Step 4:** `src/lib/organization/settings.ts` — in `DEFAULT_SETTINGS.features` add `ai_help: true`.
- [ ] **Step 5:** `src/lib/features/index.ts` — add to `FEATURE_DEFINITIONS`:

```ts
ai_help: {
  label: 'AI help assistant',
  description: 'Chat assistant on the Help page and dashboard that answers questions about how the app works. Uses the Claude API; disable to turn it off for this organization.',
},
```

Then grep how the Settings > Business Rules features tab renders toggles (`grep -n FEATURE_DEFINITIONS src/app/\(dashboard\)/settings/business/page.tsx src/components -r`). If the tab iterates `FEATURE_DEFINITIONS`, the toggle appears automatically; if toggles are hand-rolled, copy the `client_portal` toggle block for `ai_help` in the same file.
- [ ] **Step 6:** `src/lib/env.ts` — add `'ANTHROPIC_API_KEY'` to the recommended (warn-only) list with comment `// AI help assistant (feature hides itself when absent)`.
- [ ] **Step 7:** Run `npm run test -- --run src/lib/organization/settings.test.ts src/lib/features` (colocated tests may assert the exact default/definition shapes — update those assertions to include `ai_help` if they fail). Then `npx tsc --noEmit` + `npm run lint`.
- [ ] **Step 8:** Commit: `feat(help-ai): ai_help feature flag, ai_question event type (dev migration applied), env plumbing`

---

### Task 2: Corpus + org-context builders (TDD)

**Files:**
- Create: `src/lib/help/ai.ts`
- Test: `src/lib/help/ai.test.ts`

**Interfaces:**
- Consumes: `HELP_ARTICLES`, `HELP_FAQS` from `@/app/(dashboard)/help/_data/help-articles`; `can` from `@/lib/auth/permissions`; `ServiceType`, `OrganizationSettings`, `UserRole` from `@/types/database`.
- Produces: `buildHelpCorpus(includeAdminOnly: boolean): string`; `buildOrgContext(orgName: string, settings: OrganizationSettings, serviceTypes: ServiceType[], role: UserRole): string`; `HELP_AI_SYSTEM_RULES: string`; `streamHelpAnswer(opts: { apiKey: string; messages: { role: 'user' | 'assistant'; content: string }[]; includeAdminOnly: boolean; orgContext: string })` returning the Anthropic SDK message stream.

- [ ] **Step 1:** `npm install @anthropic-ai/sdk`
- [ ] **Step 2: Failing tests** (`src/lib/help/ai.test.ts`):

```ts
import { describe, it, expect } from 'vitest'
import { buildHelpCorpus, buildOrgContext, HELP_AI_SYSTEM_RULES } from './ai'
import { DEFAULT_SETTINGS } from '@/lib/organization/settings'
import type { ServiceType } from '@/types/database'

const svc = {
  id: 's1', name: 'In-Home Individual', base_rate: 80, per_person_rate: 0,
  mca_percentage: 25, contractor_cap: null, rent_percentage: 0,
} as unknown as ServiceType

describe('buildHelpCorpus', () => {
  it('full corpus includes admin-only and public content', () => {
    const full = buildHelpCorpus(true)
    expect(full).toContain('generating-invoices') // adminOnly article
    expect(full).toContain('my-earnings')         // public article
    expect(full).toContain('why-no-invoice')      // adminOnly FAQ id appears via question block
  })
  it('contractor corpus contains zero admin-only content', () => {
    const c = buildHelpCorpus(false)
    expect(c).not.toContain('generating-invoices')
    expect(c).not.toContain('scholarship-billing')
    expect(c).toContain('my-earnings')
    expect(c).toContain('installing-the-app')
  })
  it('is deterministic', () => {
    expect(buildHelpCorpus(true)).toBe(buildHelpCorpus(true))
  })
})

describe('buildOrgContext', () => {
  it('includes whitelisted settings and excludes security', () => {
    const ctx = buildOrgContext('May Creative Arts', DEFAULT_SETTINGS, [svc], 'owner')
    expect(ctx).toContain('May Creative Arts')
    expect(ctx).toContain('no_show_fee')
    expect(ctx).not.toContain('lockout')
    expect(ctx).not.toContain('max_login_attempts')
  })
  it('hides financial fields from contractors, shows them to owners', () => {
    const owner = buildOrgContext('X', DEFAULT_SETTINGS, [svc], 'owner')
    const contractor = buildOrgContext('X', DEFAULT_SETTINGS, [svc], 'contractor')
    expect(owner).toContain('mca_percentage')
    expect(contractor).not.toContain('mca_percentage')
    expect(contractor).toContain('In-Home Individual') // still sees the service list
  })
})

describe('HELP_AI_SYSTEM_RULES', () => {
  it('mandates sources and forbids invention', () => {
    expect(HELP_AI_SYSTEM_RULES).toMatch(/Sources:/)
    expect(HELP_AI_SYSTEM_RULES).toMatch(/\[\[/)
  })
})
```

- [ ] **Step 3:** Run → FAIL (module missing).
- [ ] **Step 4: Implement** `src/lib/help/ai.ts`:

```ts
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { HELP_ARTICLES, HELP_FAQS } from '@/app/(dashboard)/help/_data/help-articles'
import { can } from '@/lib/auth/permissions'
import type { OrganizationSettings, ServiceType, UserRole } from '@/types/database'

/** Serialize the whole help corpus for the system prompt. Deterministic; the
 *  contractor variant drops everything adminOnly so restricted content can
 *  never leak through an answer. */
export function buildHelpCorpus(includeAdminOnly: boolean): string {
  const articles = HELP_ARTICLES.filter(a => includeAdminOnly || !a.adminOnly)
  const faqs = HELP_FAQS.filter(f => includeAdminOnly || !f.adminOnly)
  const parts: string[] = ['# MCA Manager documentation\n']
  for (const a of articles) {
    parts.push(`## Article: ${a.title}\nslug: ${a.slug}\ncategory: ${a.category}\n\n${a.content.trim()}\n`)
  }
  parts.push('# Frequently asked questions\n')
  for (const f of faqs) {
    parts.push(`## FAQ: ${f.question}\nid: ${f.id}${f.articleSlug ? `\nrelated article slug: ${f.articleSlug}` : ''}\n\n${f.answer.trim()}\n`)
  }
  return parts.join('\n')
}

/** Whitelist serialization of non-PHI org configuration. NEVER add client,
 *  session, invoice, or team data here — that is the compliance boundary. */
export function buildOrgContext(
  orgName: string,
  settings: OrganizationSettings,
  serviceTypes: ServiceType[],
  role: UserRole
): string {
  const showFinancials = can(role, 'financial:view-details')
  const safeSettings = {
    pricing: settings.pricing,
    invoice: settings.invoice,
    session: settings.session,
    automation: settings.automation,
    features: settings.features,
    portal: { token_expiry_days: settings.portal?.token_expiry_days },
    custom_lists: settings.custom_lists,
  }
  const services = serviceTypes.map(s => ({
    name: s.name,
    base_rate: s.base_rate,
    per_person_rate: s.per_person_rate,
    ...(showFinancials
      ? {
          mca_percentage: s.mca_percentage,
          contractor_cap: s.contractor_cap,
          rent_percentage: s.rent_percentage,
        }
      : {}),
  }))
  return [
    `# This organization's configuration (non-sensitive)`,
    `Organization: ${orgName}`,
    `Asking user's role: ${role}`,
    `Settings: ${JSON.stringify(safeSettings)}`,
    `Service types: ${JSON.stringify(services)}`,
  ].join('\n')
}

export const HELP_AI_SYSTEM_RULES = `You are the MCA Manager help assistant for a music/art therapy practice management app.

Rules:
- Answer ONLY from the documentation and organization configuration provided below. If the documentation does not cover something, say so plainly and suggest asking the practice owner — never invent screens, buttons, settings, or behavior.
- End every answer that used the documentation with a final line: Sources: [[slug]] [[slug]] — using the slug values of the articles you relied on. Omit the line only when you could not answer.
- Politely decline questions unrelated to using MCA Manager, and ALL medical or clinical questions.
- The asking user's role is given in the configuration block. Do not describe admin-only capabilities to contractors.
- Keep answers short and practical. Use markdown. Refer to UI elements in bold, e.g. **Settings > Business Rules**.
- Never ask the user for client names or health information; if they include any, answer generally without repeating those details.`

export function streamHelpAnswer(opts: {
  apiKey: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  includeAdminOnly: boolean
  orgContext: string
}) {
  const anthropic = new Anthropic({ apiKey: opts.apiKey })
  return anthropic.messages.stream({
    model: process.env.HELP_AI_MODEL || 'claude-sonnet-5',
    max_tokens: 1024,
    temperature: 0,
    system: [
      { type: 'text', text: HELP_AI_SYSTEM_RULES },
      {
        type: 'text',
        text: buildHelpCorpus(opts.includeAdminOnly),
        cache_control: { type: 'ephemeral' },
      },
      { type: 'text', text: opts.orgContext },
    ],
    messages: opts.messages,
  })
}
```

Note: `npm install server-only` is NOT needed — Next.js provides it; if the import errors, `npm i server-only` (1-line package). If vitest chokes on the `server-only` import, add `server-only` to `test.server.deps.inline`… simpler: mock it — create `src/lib/help/__mocks__` alias? Simplest reliable route used by Next projects: in `vitest.config.ts` add `resolve.alias: { 'server-only': path-to-empty-stub }`. Check `vitest.config.ts` first; if adding an alias is invasive, drop the `server-only` import entirely and rely on the route being the only importer (document with a header comment `// Server-side only: imported exclusively from API routes.`). Choose the drop-the-import option if in doubt — do not spend time on tooling.
- [ ] **Step 5:** Run the test file → PASS. `npx tsc --noEmit` + lint.
- [ ] **Step 6:** Commit: `feat(help-ai): role-filtered corpus + whitelisted org context + system rules`

---

### Task 3: Citation parsing (TDD)

**Files:**
- Create: `src/lib/help/citations.ts`
- Test: `src/lib/help/citations.test.ts`

**Interfaces:**
- Produces: `extractSources(answer: string): { text: string; slugs: string[] }` — strips the trailing `Sources:` line (and any `[[slug]]` markers left in body text), returns unique slugs in order.

- [ ] **Step 1: Failing tests:**

```ts
import { describe, it, expect } from 'vitest'
import { extractSources } from './citations'

describe('extractSources', () => {
  it('pulls slugs from the trailing Sources line and strips it', () => {
    const { text, slugs } = extractSources('Scholarships batch monthly.\n\nSources: [[scholarship-billing]] [[billing-and-pay-rules]]')
    expect(slugs).toEqual(['scholarship-billing', 'billing-and-pay-rules'])
    expect(text).toBe('Scholarships batch monthly.')
  })
  it('handles answers with no sources', () => {
    const { text, slugs } = extractSources('I could not find that in the documentation.')
    expect(slugs).toEqual([])
    expect(text).toBe('I could not find that in the documentation.')
  })
  it('dedupes and strips stray inline markers', () => {
    const { text, slugs } = extractSources('See [[my-earnings]] for details.\nSources: [[my-earnings]]')
    expect(slugs).toEqual(['my-earnings'])
    expect(text).not.toContain('[[')
  })
})
```

- [ ] **Step 2:** Run → FAIL. **Step 3: Implement:**

```ts
/** Split an AI answer into display text and cited article slugs.
 *  The model is instructed to end with "Sources: [[slug]] [[slug]]". */
export function extractSources(answer: string): { text: string; slugs: string[] } {
  const slugs: string[] = []
  for (const m of answer.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
    if (!slugs.includes(m[1])) slugs.push(m[1])
  }
  const text = answer
    .replace(/^\s*Sources?:.*$/gim, '')
    .replace(/\[\[([a-z0-9-]+)\]\]/g, '')
    .trim()
  return { text, slugs }
}
```

- [ ] **Step 4:** Run → PASS. **Step 5:** Commit: `feat(help-ai): citation extraction`

---

### Task 4: Chat route (POST stream + GET probe) + rate limit + validation

**Files:**
- Modify: `src/lib/rate-limit.ts` (add `aiRateLimit`), `src/lib/validation/schemas.ts` (+ its colocated test)
- Create: `src/app/api/help/chat/route.ts`

**Interfaces:**
- Consumes: Task 2's `buildOrgContext`, `streamHelpAnswer`; `isFeatureEnabled` from `@/lib/features`; `can` from `@/lib/auth/permissions`; `normalizeQuery` from `@/lib/help/events`.
- Produces: `POST /api/help/chat` accepting `{ messages: { role: 'user'|'assistant', content: string }[] }`, streaming SSE `data: {"text":...}` chunks then `data: [DONE]`; `GET /api/help/chat` → `{ configured: boolean }`; `helpChatSchema` zod export; `aiRateLimit` (20 req / 60 min, prefix `ratelimit:ai`).

- [ ] **Step 1:** `src/lib/rate-limit.ts` — alongside the existing exports add:

```ts
/** AI helper rate limit: 20 questions per hour per user (cost control) */
export const aiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '3600 s'),
      prefix: 'ratelimit:ai',
    })
  : null
```

- [ ] **Step 2:** `src/lib/validation/schemas.ts` — add + test in its colocated test file:

```ts
export const helpChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(20)
    .refine(msgs => msgs[msgs.length - 1].role === 'user', {
      message: 'Last message must be from the user',
    }),
})
```

Tests: valid single user message passes; 21 messages fails; last-message-assistant fails; 2001-char content fails.
- [ ] **Step 3:** `src/app/api/help/chat/route.ts`:

```ts
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

export async function GET() {
  return NextResponse.json({ configured: !!process.env.ANTHROPIC_API_KEY })
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429 }
      )
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
  supabase.from('help_events').insert({
    organization_id: profile.organization_id,
    user_id: profile.id,
    event_type: 'ai_question',
    query: lastQuestion.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200),
  }).then(() => {}, () => {})

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
```

(Check `logger.error`'s actual signature in `src/lib/logger.ts` before using — match it.)
- [ ] **Step 4:** `npm run test -- --run src/lib/validation` → schema tests PASS. tsc + lint.
- [ ] **Step 5:** Live smoke: with the dev server running, `POST http://localhost:3000/api/help/chat` unauthenticated → 401; `GET` → `{"configured":true}`.
- [ ] **Step 6:** Commit: `feat(help-ai): streaming chat route with auth, flag gate, rate limit, question logging`

---

### Task 5: AiChat component + Help page panel

**Files:**
- Create: `src/components/help/ai-chat.tsx`
- Modify: `src/app/(dashboard)/help/page.tsx`

**Interfaces:**
- Consumes: `extractSources` (Task 3), `getArticleBySlug` from the help data barrel, `isFeatureEnabled`, `useOrganization`, FAQ markdown components pattern from the help page.
- Produces: `<AiChat />` (self-contained; no props) and `useAiHelpVisible(): boolean` hook exported from the same file (flag check + module-cached GET probe).

- [ ] **Step 1:** Implement `ai-chat.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown, { Components } from 'react-markdown'
import { Loader2, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOrganization } from '@/contexts/organization-context'
import { isFeatureEnabled } from '@/lib/features'
import { extractSources } from '@/lib/help/citations'
import { getArticleBySlug } from '@/app/(dashboard)/help/_data/help-articles'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

// Key presence never changes within a session — probe once per page load.
let configuredCache: boolean | null = null

/** Flag + server-configured gate shared by the panel and the bubble. */
export function useAiHelpVisible(): boolean {
  const { organization } = useOrganization()
  const [configured, setConfigured] = useState(configuredCache ?? false)
  useEffect(() => {
    if (configuredCache !== null) return
    fetch('/api/help/chat/')
      .then(r => r.json())
      .then(d => {
        configuredCache = !!d.configured
        setConfigured(configuredCache)
      })
      .catch(() => {
        configuredCache = false
      })
  }, [])
  return configured && isFeatureEnabled(organization?.settings, 'ai_help')
}

const aiMarkdown: Components = {
  p: ({ children }) => <p className="text-sm leading-6 mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
  ul: ({ children }) => <ul className="list-disc list-outside ml-5 mb-2 space-y-1 text-sm">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside ml-5 mb-2 space-y-1 text-sm">{children}</ol>,
  li: ({ children }) => <li className="leading-6">{children}</li>,
}

function AssistantMessage({ content }: { content: string }) {
  const { text, slugs } = extractSources(content)
  const articles = slugs.map(getArticleBySlug).filter(a => a != null)
  return (
    <div>
      <ReactMarkdown components={aiMarkdown}>{text}</ReactMarkdown>
      {articles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {articles.map(a => (
            <Link
              key={a.slug}
              href={`/help/${a.slug}/`}
              className="text-xs text-primary hover:underline border rounded-full px-2 py-0.5"
            >
              {a.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const send = async () => {
    const question = input.trim()
    if (!question || busy) return
    setError(null)
    setInput('')
    // Cap history at 20 messages (drop oldest exchange first)
    const history = [...messages, { role: 'user' as const, content: question }].slice(-19)
    setMessages([...history, { role: 'assistant', content: '' }])
    setBusy(true)
    try {
      const res = await fetch('/api/help/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      if (!res.ok || !res.body) {
        setMessages(history)
        setError(
          res.status === 429
            ? "You've asked a lot of questions this hour — try again in a bit."
            : res.status === 503
              ? 'The AI helper is not configured yet.'
              : 'Something went wrong — try again.'
        )
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      let buffer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') continue
          const parsed = JSON.parse(payload) as { text?: string; error?: string }
          if (parsed.error) {
            setError('The answer was interrupted — try again.')
            continue
          }
          acc += parsed.text ?? ''
          setMessages([...history, { role: 'assistant', content: acc }])
        }
      }
      if (!acc) setMessages(history)
    } catch {
      setMessages(prev => (prev[prev.length - 1]?.content === '' ? prev.slice(0, -1) : prev))
      setError('Something went wrong — try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask how anything in MCA Manager works — pricing, invoices, payroll, settings. Answers
            come from the app&apos;s documentation and link to the full articles.
          </p>
        )}
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="ml-8 rounded-lg bg-primary/10 px-3 py-2 text-sm">{m.content}</div>
          ) : (
            <div key={i} className="mr-4 rounded-lg border px-3 py-2">
              {m.content === '' && busy ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <AssistantMessage content={m.content} />
              )}
            </div>
          )
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <form
        className="mt-3 space-y-1"
        onSubmit={e => {
          e.preventDefault()
          send()
        }}
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask how something works…"
            maxLength={2000}
            disabled={busy}
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send question">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Don&apos;t include client names or health details.
        </p>
      </form>
    </div>
  )
}
```

(The `Sparkles` import in this file is used only if you add the icon to the empty-state; otherwise drop the unused import — lint will flag it.)

- [ ] **Step 2:** Help page (`help/page.tsx`): import `AiChat`, `useAiHelpVisible`; add state `const [aiOpen, setAiOpen] = useState(false)`; render between the header and the search box:

```tsx
{aiVisible && (
  <Card className="border-primary/30">
    <CardContent className="py-4">
      {!aiOpen ? (
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setAiOpen(true)}>
          <Sparkles className="h-4 w-4 text-primary" />
          Ask the AI helper — get an answer instead of searching
        </Button>
      ) : (
        <div className="h-96"><AiChat /></div>
      )}
    </CardContent>
  </Card>
)}
```

with `const aiVisible = useAiHelpVisible()` beside the other hooks (import `Sparkles` from lucide-react).
- [ ] **Step 3:** tsc + lint; browser check: panel teaser renders on `/help/`, expands to chat, a real question streams an answer with source links.
- [ ] **Step 4:** Commit: `feat(help-ai): chat component + Ask-the-AI panel on Help page`

---

### Task 6: Floating bubble + slide-over on all dashboard pages

**Files:**
- Create (via CLI): `src/components/ui/sheet.tsx` — `npx shadcn@latest add sheet --yes`
- Create: `src/components/help/ai-chat-bubble.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `AiChat`, `useAiHelpVisible` (Task 5), shadcn `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle`/`SheetTrigger`.

- [ ] **Step 1:** `npx shadcn@latest add sheet --yes`
- [ ] **Step 2:** `ai-chat-bubble.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { AiChat, useAiHelpVisible } from '@/components/help/ai-chat'

/** Floating "Ask the AI helper" bubble. bottom-24 on mobile clears the
 *  QuickSessionFab at bottom-6; on lg the FAB is hidden so we drop to bottom-6. */
export function AiChatBubble() {
  const visible = useAiHelpVisible()
  const [open, setOpen] = useState(false)

  if (!visible) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          aria-label="Ask the AI helper"
          className="fixed bottom-24 right-6 lg:bottom-6 z-40 h-12 w-12 rounded-full shadow-lg hover:shadow-xl"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Ask the AI helper</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 pt-2">
          <AiChat />
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 3:** `layout.tsx` — import `AiChatBubble` and render `<AiChatBubble />` directly after `<QuickSessionFab />` (line 97). Note the bubble self-hides via `useAiHelpVisible`, so the layout needs no gating logic.
- [ ] **Step 4:** Browser check on `/sessions/`: bubble present (desktop bottom-right), opens sheet, chat works, no overlap with the mobile FAB at a 390px viewport; toggle `features.ai_help` off in Settings > Business Rules > Features and confirm bubble + help panel disappear (then re-enable).
- [ ] **Step 5:** tsc + lint. Commit: `feat(help-ai): floating AI helper bubble with slide-over chat`

---

### Task 7: Self-documentation (article + FAQ + coverage row)

**Files:**
- Modify: `src/app/(dashboard)/help/_data/articles/getting-started.ts`, `src/app/(dashboard)/help/_data/faqs.ts`, `src/app/(dashboard)/help/_data/integrity.test.ts`

**Interfaces:**
- Produces: article slug `ai-helper` (getting-started, `adminOnly: false`, keywords ≥5 incl. `ai`, `assistant`, `chatbot`, `ask`), FAQ id `ask-the-ai` → `articleSlug: 'ai-helper'`.

- [ ] **Step 1:** Write the `ai-helper` article (300–500 words): what it answers (how-the-app-works questions, grounded in these help articles + your organization's settings), that answers cite source articles, what it can NOT see (client, session, invoice, or team data — by design), the don't-include-client-details rule, the hourly question limit, where to turn it off (**Settings > Business Rules > Features**), and that it appears on the Help page and as the sparkle bubble on every page. Related: `getting-started`. Write the `ask-the-ai` FAQ (question: "What can the AI helper answer?") summarizing the same in 2 sentences.
- [ ] **Step 2:** `integrity.test.ts` — add to `COVERAGE_MATRIX`: `'ai-chat': ['ai-helper'],`
- [ ] **Step 3:** `npm run test -- --run "src/app/(dashboard)/help/_data"` → integrity + search suites PASS.
- [ ] **Step 4:** Commit: `docs(help): AI helper article + FAQ, coverage row`

---

### Task 8: E2E + docs + full gate

**Files:**
- Create: `tests/e2e/help-ai.spec.ts`
- Modify: `CLAUDE.md`

- [ ] **Step 1:** E2E spec:

```ts
import { test, expect } from '@playwright/test'
import { login } from './helpers'

// Needs a real Anthropic key in the runner env; CI skips.
test.skip(!process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY not set')

test.describe('AI help chat', () => {
  test('answers a scholarship question with sources', async ({ page }) => {
    await login(page)
    await page.goto('/help/')
    await page.getByRole('button', { name: /ask the ai helper/i }).click()
    await page.getByPlaceholder('Ask how something works…').fill('How do scholarship invoices work?')
    await page.getByRole('button', { name: 'Send question' }).click()
    await expect(page.locator('.mr-4').last()).toContainText(/scholarship/i, { timeout: 60000 })
    await expect(page.getByRole('link', { name: /scholarship/i }).first()).toBeVisible({ timeout: 60000 })
  })

  test('bubble opens the chat on a dashboard page', async ({ page }) => {
    await login(page)
    await page.goto('/sessions/')
    await page.getByRole('button', { name: 'Ask the AI helper' }).click()
    await expect(page.getByRole('heading', { name: 'Ask the AI helper' })).toBeVisible()
  })
})
```

Run with `$env:ANTHROPIC_API_KEY` loaded from `.env.local` (same non-printing pattern as `TEST_USER_PASSWORD`), `--workers=1`.
- [ ] **Step 2:** CLAUDE.md updates: API-routes table row `| /api/help/chat | GET/POST | AI help assistant (config probe / streaming answers) |`; Key Library Modules line for `src/lib/help/ai.ts` (role-filtered corpus + whitelisted org context — the compliance boundary: never add client/session/team data) and `src/lib/help/citations.ts`; env section `ANTHROPIC_API_KEY=` + `HELP_AI_MODEL=` under recommended; `features` row in the settings table gains `ai_help`.
- [ ] **Step 3:** Full gate: `npm run lint`, `npx tsc --noEmit`, `npm run test -- --run`, `npx playwright test tests/e2e/help.spec.ts tests/e2e/help-ai.spec.ts --workers=1` (with key + creds in env). All green.
- [ ] **Step 4:** Commit: `feat(help-ai): e2e coverage + docs`
