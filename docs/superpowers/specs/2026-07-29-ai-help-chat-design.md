# AI Help Chat — Design Spec

**Date:** 2026-07-29
**Goal:** An "Ask the AI helper" chat that answers questions about how MCA Manager works, grounded in the Help Center content plus the organization's own (non-PHI) configuration, available on the Help page and as a floating bubble on every dashboard page.
**Builds on:** the 2026-07-29 help-section overhaul (36 articles, 26 FAQs, `help_events`). This is the Phase 2 that spec deferred.

## Decisions (settled with the user)

- **Grounding:** help content + org settings/service types. Never client, session, invoice, or team-member data — zero PHI to the AI by design.
- **Placement:** chat panel on `/help/` + floating bubble → slide-over on all dashboard pages.
- **Model:** `claude-sonnet-5` (env-overridable). **Approach:** full-corpus system prompt with Anthropic prompt caching — no retrieval layer (36 docs ≈ 35k tokens; caching makes repeat questions cheap; zero retrieval misses).
- **Key:** `ANTHROPIC_API_KEY` already in `.env.local`; add to Vercel prod when shipping. Server-side only, never `NEXT_PUBLIC_`.

## 1. Server pieces

### `src/lib/help/ai.ts` (server-only module)

- `buildHelpCorpus(includeAdminOnly: boolean): string` — deterministic serialization of `HELP_ARTICLES` + `HELP_FAQS` (imported from `../../app/(dashboard)/help/_data/help-articles` — pure TS, server-importable). Two variants: full, and contractor (drops every `adminOnly` article/FAQ). Format per item: title, slug, category, then content/answer. This string is the **cached** system-prompt block (`cache_control: { type: 'ephemeral' }`).
- `buildOrgContext(orgName, settings, serviceTypes, role): string` — **whitelist** serializer of non-PHI config: org name; merged settings sections `pricing`, `invoice`, `session`, `automation`, `features`, `custom_lists` (labels/visibility only), `portal.token_expiry_days`; service types (name, duration behavior, base_rate, per_person_rate, scholarship flag — plus `mca_percentage`/`contractor_cap`/pay schedule only when `can(role, 'financial:view-details')`). Explicitly excluded: `security` section, anything client/session/team/user-derived. Small and dynamic — sits OUTSIDE the cached block.
- `HELP_AI_SYSTEM_RULES` — the behavior prompt: answer only from the documentation and organization configuration provided; when the docs don't cover something, say so plainly and suggest checking with the practice owner — never invent screens, buttons, or behavior; decline questions unrelated to using MCA Manager, and all medical/clinical questions; keep answers short and practical, formatted as markdown; end every answer that used documentation with a line `Sources: [[slug]] [[slug]]` naming the article slugs relied on; the user's role is provided — do not describe admin-only capabilities to contractors.
- `streamHelpAnswer({ messages, includeAdminOnly, orgContext })` — calls Anthropic Messages API (`@anthropic-ai/sdk`) with `model: process.env.HELP_AI_MODEL || 'claude-sonnet-5'`, `max_tokens: 1024`, system = [rules, corpus (cache_control), orgContext], streaming; returns the SDK stream.

### `POST /api/help/chat` (`src/app/api/help/chat/route.ts`)

1. If `!process.env.ANTHROPIC_API_KEY` → 503 `{ error: 'not_configured' }`.
2. Auth: supabase server client `getUser()`; 401 if none. Load profile (role, organization_id); load org (name, settings) and org service types.
3. Feature gate: `isFeatureEnabled(settings, 'ai_help')` → 403 if off.
4. Rate limit: dedicated `aiRateLimit` (Upstash sliding window, **20 requests / 60 min per user id**, gracefully skipped when Upstash absent — same pattern as `src/lib/rate-limit.ts`) → 429.
5. Validate body with zod: `{ messages: [{ role: 'user'|'assistant', content: string(1..2000) }] (1..20) }`, last message must be `user`.
6. Log the question: insert `help_events` row `{ event_type: 'ai_question', query: normalized first 200 chars of last user message }` — fire-and-forget.
7. Stream the answer back as `text/event-stream` (`data: {"text": "..."}` chunks, `data: [DONE]` terminator) via a `ReadableStream`.

Role → corpus variant: `includeAdminOnly = can(role, 'session:view-all')` (same test the Help pages use).

### Migration `20260730_help_events_ai_question.sql`

Widen the check constraints (applied by hand, dev ref first, then prod — with the note that `help_events` itself is still pending on prod, so prod gets both files together):

```sql
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

## 2. Feature flag

- `FeatureFlags` (src/types/database.ts) gains `ai_help: boolean`; `DEFAULT_SETTINGS.features.ai_help = true` (fail-open, consistent with `client_portal`).
- Settings > Features tab gets an "AI help assistant" toggle (same pattern as the client-portal toggle).
- UI visibility = flag AND server-configured: the dashboard layout (server component) computes `aiHelpConfigured = !!process.env.ANTHROPIC_API_KEY` and passes it down; when false the bubble and panel render nothing.

## 3. UI pieces

### `src/components/help/ai-chat.tsx`

Client component, self-contained chat: local `messages` state; on send, POST `/api/help/chat` with full history, read the SSE stream incrementally into the last assistant message; render assistant markdown with the FAQ markdown components; convert `[[slug]]` markers into `/help/<slug>/` links (title from `getArticleBySlug`, unknown slugs render as plain text); input `placeholder="Ask how something works…"` with the permanent notice line *"Don't include client names or health details."*; states: idle / streaming (stop-aware) / error (message + Try again); 429 and 503 get specific friendly copy. History capped at 20 messages (drop oldest pair client-side).

### Placement

- **Help page:** an "Ask the AI helper" `Card` above the search box hosting `AiChat` (collapsed to a one-line teaser button until clicked, so the page stays scannable). Rendered only when flag+configured.
- **Floating bubble:** `src/components/help/ai-chat-bubble.tsx` — `fixed bottom-24 right-6 lg:bottom-6 z-40` (clears the mobile QuickSessionFAB at `bottom-6 right-6 lg:hidden`), sparkles/message icon, `aria-label="Ask the AI helper"`; opens a right-side slide-over (shadcn `Sheet`, added via CLI) containing `AiChat`. Mounted once in the dashboard layout, gated by flag+configured. Chat state lives in `AiChat`, so an open sheet keeps its conversation until closed page-navigation unmounts it (acceptable v1).

## 4. Docs & self-documentation

- New help article `ai-helper` (getting-started, adminOnly false): what it can answer, that it cites sources, that it can't see client data, the no-PHI-in-questions rule, the org toggle. New FAQ `ask-the-ai` linking to it. (Integrity test picks both up automatically; add `ai-helper` to the coverage matrix under a new `ai-chat` surface row.)
- CLAUDE.md: env vars (`ANTHROPIC_API_KEY`, `HELP_AI_MODEL`), the `/api/help/chat` route row, `src/lib/help/ai.ts` module line, `features.ai_help` flag row.
- `src/lib/env.ts`: `ANTHROPIC_API_KEY` added to *recommended* (warn-only) vars.

## 5. Error handling

- Anthropic API error / network failure mid-stream → the route closes the stream with `data: {"error": "..."}`; UI shows "Something went wrong — try again." with the partial answer preserved.
- All `help_events` logging fire-and-forget.
- The route sets `export const maxDuration = 60` (Vercel function limit for streaming).

## 6. Privacy & compliance posture

Typed questions are sent to the Anthropic API. The system is designed so no PHI is needed or useful in a question (the model has no client data to correlate), and the UI says not to include any. `help_events.ai_question` rows store the question text in our own DB with the same posture as `search_miss` (org-scoped, staff-only read). If a future phase gives the assistant real data access, that requires a BAA with Anthropic and a compliance review first — out of scope here.

## 7. Testing

- **Unit (colocated):** `src/lib/help/ai.test.ts` — contractor corpus contains zero adminOnly titles/slugs; full corpus contains all; `buildOrgContext` includes pricing/no-show fee, excludes `security`, excludes financial fields for contractor role; deterministic output. `src/lib/help/citations.test.ts` (with `citations.ts` extracted parser) — `[[slug]]` split/rendering cases incl. unknown slug. Route body schema tests.
- **E2E:** `tests/e2e/help-ai.spec.ts` — `test.skip` unless `ANTHROPIC_API_KEY` present in the runner env; opens Help page chat, asks "How do scholarship invoices work?", expects streamed text containing "scholarship" and a Sources link; bubble opens the sheet on the dashboard.
- **Live check:** dev server question answered end-to-end; `ai_question` row visible in dev `help_events`.

## Out of scope

- Data-aware answers (BAA required), per-answer feedback buttons, conversation persistence, gaps-card surfacing of AI questions (query `help_events` manually for now), voice, prod key setup (user adds to Vercel when shipping).

## Acceptance

1. Owner on `/help/` asks "how do scholarship invoices work" → grounded streamed answer citing `scholarship-billing`.
2. Contractor asking about admin-only topics gets no admin-only content (corpus variant verified by unit test).
3. Bubble on `/sessions/` opens the same chat; hidden when flag off or key missing.
4. `ai_question` rows land in dev `help_events`; rate limit returns 429 after 20/hr.
5. Full gate green: lint, tsc, unit, help e2e (AI spec auto-skips without key), integrity test (new article + FAQ).
