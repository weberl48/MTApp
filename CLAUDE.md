# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCA App is a multi-tenant practice management system for May Creative Arts, handling session tracking, invoicing, and contractor payments for music/art therapy practices.

`README.md` contains the initial owner/organization SQL setup flow, but its tech-stack section is stale (says Next.js 15 + Capacitor; the app is Next.js 16 + PWA) — this file is authoritative.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix primitives)
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Mobile**: PWA (Progressive Web App)
- **Testing**: Vitest + React Testing Library
- **Email**: Resend
- **Payments**: Square API
- **Rate Limiting**: Upstash Redis
- **Theming**: next-themes (light/dark/system)
- **Key Libraries**: date-fns (dates), sonner (toasts), react-pdf (PDFs), zod (validation)

## Development Commands

```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint (flat config in eslint.config.mjs — script is bare `eslint`, NOT `next lint`)
npx tsc --noEmit     # Type check (used in CI)
npm run test         # Run Vitest tests
npm run test -- --watch  # Run tests in watch mode
npm run portal       # Local dev portal (http://localhost:4321): env health, endpoint sweep, error feed — see tools/dev-portal/README.md
                     # 24/7 mirror runs on the HA Pi at http://192.168.1.160:4321 (docker `mca-portal`, deploy notes in the README)
node scripts/dev-seed/apply.mjs  # Reseed MCA-Dev with the full scenario dataset (idempotent, dev-only) — see scripts/dev-seed/README.md
```

### PWA (Mobile)

The app is a Progressive Web App that can be installed on mobile devices:

- **Install**: Users visit the site and tap "Add to Home Screen"
- **Offline**: Service worker caches pages for offline access
- **Icons**: Add 192x192 and 512x512 PNG icons to `public/icons/`
- **Manifest**: Configuration in `public/manifest.json`

Note: Native app builds (Capacitor) are shelved in `feature/capacitor-mobile` branch.

### Health Checks
```bash
npm run health         # Check localhost:3000
npm run health:prod    # Check production (NOTE: script has a placeholder URL — run `npx tsx scripts/health-check.ts <prod-url>` instead)
```

## Architecture

### Route Groups
- `(auth)` - Login, signup, password reset (public)
- `(dashboard)` - Main app with sidebar (requires auth)
- `(portal)` - Client portal (token-based access, no auth)
- `api/` - API routes for PDF generation, webhooks, etc.

**Note**: `trailingSlash: true` is set in `next.config.ts` — all route links must include trailing slashes.

**Note**: The `mca-app/` directory at the repo root is a legacy/reference copy. Ignore it — all active code is in `src/`.

### Key Patterns

**Supabase Client Usage**:
- Server Components/API routes: `import { createClient } from '@/lib/supabase/server'`
- Client Components: `import { createClient } from '@/lib/supabase/client'`
- Service role (webhooks): `import { createServiceClient } from '@/lib/supabase/service'`

**Context Providers** (files live in `src/contexts/`):
- `OrganizationContext` (`src/contexts/organization-context.tsx`) - Current user + organization data (dashboard)
- `PortalContext` (`src/contexts/portal-context.tsx`) - Client data for portal (token-based)
- `BrandingProvider` - Organization branding (colors, logo)

**Dashboard Provider Stack** (outermost → innermost in `(dashboard)/layout.tsx`):
`OrganizationProvider → BrandingProvider → ActivityTracker → WalkthroughProvider → MfaEnforcementGuard → OwnerOnboardingGate → {children}`

**Pricing Logic** (`src/lib/pricing/index.ts`):
- `calculateSessionPricing()` - Computes total, MCA cut, contractor pay, rent
- `calculateNoShowPricing()` - Flat no-show fee with normal contractor pay
- Handles duration scaling (configurable base), per-person rates for groups, contractor caps
- No-show fee and duration base are configurable via `organization.settings.pricing`

### Database Schema

Core tables with RLS policies:
- `organizations` - Multi-tenant container with settings JSON
- `users` - Extends Supabase auth, has role enum
- `clients` - Patients with payment method
- `service_types` - Pricing configuration per organization
- `contractor_rates` - Per-contractor-per-service custom pay rates
- `sessions` - Session logs with status workflow (draft → submitted → approved; also `cancelled`, `no_show`)
- `session_attendees` - Many-to-many for group sessions
- `invoices` - Generated from sessions, Square integration fields, `reminder_sent_days` JSONB tracks which reminders have been sent

Schema is in `supabase/schema.sql`. **Migrations in `supabase/migrations/` are applied BY HAND** (SQL editor or Management API query endpoint) — the project isn't `supabase link`ed and there's no `schema_migrations` tracking table, so when you add a migration, call it out for manual application.

**Three environments, data flowing one way only** (`docs/superpowers/specs/2026-07-31-env-topology-design.md`):

| Environment | What it is | Who writes to it |
|---|---|---|
| **prod** `ysmwowzxkgisshaormmf` | the business | the business; Vercel Production |
| **cert** `gzrukevymmguqxuoynqk` (formerly MCA-Dev) | a mirror of prod, **real PHI** | human testers; read-only automated runs; Vercel Preview/Development |
| **local** `supabase start` | prod's *schema* + fake data | you, freely — **the only environment anything may break** |

Prod → cert copies schema *and* data; prod → local copies schema *only*. Nothing flows back up.
**Apply migrations to cert first, verify, then prod.** Free-tier cert auto-pauses after ~1 week idle — unpause via dashboard or Management API.

**Local setup:** `scripts/local-env/README.md` — `node scripts/local-env/bootstrap.mjs` then `node scripts/dev-seed/apply.mjs`. Needs Docker. It recreates `dev-owner@maycreativearts.test` / `dev-contractor@maycreativearts.test` (password `TEST_USER_PASSWORD`) with `require_mfa` off, which is why the e2e suite defaults work there and nowhere else. Every script under `scripts/local-env/` calls `assertLocal()` — loopback-only, `mca_local.marker` required, `mca_cert.marker` must be absent.

**Cert holds a full copy of production data, including decryptable PHI** (2026-07-30). It uses **prod's `ENCRYPTION_KEY` verbatim** — a different key fails *silently* (`decryptField` swallows it) and then `updateClient` double-encrypts on save. Recipient email columns are rewritten to `@cert.mca.invalid`, and Preview has no `RESEND_API_KEY`, so cert cannot mail real clients. `require_mfa` stays on. Rebuild or refresh it with `scripts/cert-refresh/` — see that README before touching cert; the schema comes from `pg_dump` against live prod because **the repo cannot rebuild prod's schema** (`admin_work` exists in prod with no `CREATE TABLE` anywhere here). Cert's testers are listed in `CERT_TESTERS`; the `dev-*@…test` sandbox accounts do NOT exist on cert (they live only on the local stack now — see above).

Audit-added DB objects that app code now depends on: functions `mark_sessions_paid(uuid[], date)`, `claim_invoice_reminder_day(uuid, int)`, the `create_session_reminders()` trigger fn, and the audit-log PHI helpers `get_phi_fields()` / `hash_for_audit(text)` / `sanitize_phi_jsonb(jsonb)` (required by `audit_trigger_function()` — every audited-table write fails without them); table `square_webhook_events` (webhook replay dedupe); column `login_attempts.organization_id` (org-scoped reads).

`20260731_owner_only_rates_and_settings.sql` narrows two RLS policies to developer/owner: `contractor_rates` (was "Admins can manage contractor rates", FOR ALL) and `organizations` UPDATE (was "Admins can update organization" — one JSONB column, so an admin could flip `security.require_mfa` or owner-only feature flags client-side). **`supabase/schema.sql` is stale for the `organizations` policy** — it still shows the pre-2025 owner-only version; the live DB is authoritative. Applied to cert AND prod on 2026-07-31 (verified: no admin-inclusive policy left on either table). The app code that adapts to it — owner-only rate surfaces plus `updateOrganizationSettings()` — landed on `main` the same day. **The two halves must ship together**: RLS without the code gives an admin save errors on Business Rules and silently formula-priced contractor pay, so never revert one without the other.

July 2026 billing-controls objects (20260704_client_billing_controls.sql): columns `clients.billing_frequency` (`per_session`|`monthly` — monthly clients skip per-session invoices and batch on the Scholarship tab at normal pricing), `clients.square_fee_enabled` + `invoices.apply_square_fee` (per-client Square-fee opt-in snapshotted per invoice; null = follow org setting), `sessions.submitted_at`/`approved_at` (maintained by the `set_session_status_timestamps()` BEFORE trigger — do NOT set them in app code).

### Configurable Organization Settings

Business rules are stored in `organization.settings` (JSONB) rather than hardcoded. The `OrganizationSettings` type in `src/types/database.ts` defines all sections:

| Section | Fields | Defaults |
|---------|--------|----------|
| `invoice` | `footer_text`, `payment_instructions`, `due_days`, `send_reminders`, `reminder_days` | "Thank you for your business!", 30 days, reminders at [7, 1] days before due |
| `session` | `default_duration`, `duration_options`, `require_notes`, `auto_submit`, `reminder_hours`, `send_reminders` | 30 min, [30,45,60,90] |
| `notification` | `email_on_session_submit`, `email_on_invoice_paid`, `admin_email` | Both enabled |
| `security` | `session_timeout_minutes`, `require_mfa`, `max_login_attempts`, `lockout_duration_minutes` | 30 min, 5 attempts, 15 min lockout |
| `pricing` | `no_show_fee`, `duration_base_minutes`, `square_processing_fee_enabled`, `square_processing_fee_type` (`'fixed'\|'percentage'`), `square_processing_fee_amount`, `square_processing_fee_percentage`, `square_processing_fee_fixed_cents` | $60, 30 min, fee disabled |
| `portal` | `token_expiry_days` | 90 days |
| `features` | `client_portal`, `ai_help` | Enabled (fail-open: missing flags default to `true`) |
| `custom_lists` | `payment_methods`, `billing_methods`, `classrooms` (string[] for the session form's classroom dropdown), `classrooms_by_client` (Record<clientId, string[]> — per-agency lists that win over the global list and show for any payment type) | All methods visible with default labels; no classrooms |
| `automation` | `auto_approve_sessions`, `auto_send_invoice_on_approve`, `auto_send_invoice_method`, `auto_generate_scholarship_invoices`, `scholarship_invoice_day` | All off, method `'none'`, day 1 |

Defaults live in `DEFAULT_SETTINGS` and are applied via `mergeOrganizationSettings()` in `src/lib/organization/settings.ts` (called from `OrganizationContext`) — organizations without new fields automatically get default values. The merge is pure and memoized at the call site: settings forms mirror the value into local state, so an unstable identity would wipe unsaved edits on re-render.

### User Roles & Permissions

Permissions are centralized in `src/lib/auth/permissions.ts` using a `can(role, permission)` function.

| Role | Access |
|------|--------|
| `developer` | Full system access + all organizations |
| `owner` | Full org access, manage team, branding |
| `admin` | Session/invoice management, team view, invites |
| `contractor` | Own sessions/invoices only |

**Permission checks:**
- **Client components**: Use `can()` from `useOrganization()` context (bound to effective role)
- **Server components/API routes**: Import `can` directly from `@/lib/auth/permissions`

```typescript
// Client component
const { can } = useOrganization()
if (can('session:approve')) { /* ... */ }

// Server component / API route
import { can } from '@/lib/auth/permissions'
import type { UserRole } from '@/types/database'
const allowed = can(userProfile.role as UserRole, 'session:approve')
```

**Available permissions**: `session:approve`, `session:delete`, `session:cancel`, `session:mark-no-show`, `session:view-all`, `invoice:bulk-action`, `invoice:delete`, `invoice:send`, `team:view`, `team:manage`, `team:invite`, `team:view-rates`, `client:manage`, `settings:edit`, `analytics:view`, `payments:view`, `financial:view-details`

**Owner-only money surfaces.** Admins run sessions, clients and billing; contractor pay and margins are owner/developer business. The gates:

- `team:view-rates` — Team page **Rates** tab (`PayRateMatrix`), the per-contractor **Rates** tab on `/team/[id]/`, and the dashboard's Missing Contractor Rates card.
- `financial:view-details` — session pricing everywhere, plus the invoice detail **Financial Breakdown** card (MCA cut + contractor pay).
- `analytics:view` — `/analytics/` and the dashboard revenue/MCA summary strip (`AnalyticsSummary` self-gates).
- `payments:view` — `/payments/`, `/api/payroll/*`, and `markSessionsPaid()` (payroll, not billing — do NOT relax it to `invoice:bulk-action`).
- `settings:edit` — Settings > Business Rules **Services** tab (service types carry `contractor_pay_schedule`), plus Practice, Customize, Audit Log and the Features tab.

Backed by RLS: `contractor_rates` and `organizations` are owner/developer-only (`20260731_owner_only_rates_and_settings.sql`). Two consequences: (1) server code that must price a session for *someone else* reads `contractor_rates` with `createServiceClient()` after its own authz — no-show repricing, scholarship batches and session-request approval all do this, and using the user client there silently pays the formula rate instead of the negotiated one; (2) settings writes go through `updateOrganizationSettings()` (below), never the browser client.

### Service Types

Service types control pricing with these fields:
- `base_rate` - Price for 30 minutes
- `per_person_rate` - Additional per person after first (0 for individual)
- `mca_percentage` - Organization's cut (20-30%)
- `contractor_cap` - Max contractor pay (null if uncapped)
- `rent_percentage` - Location rent (10% for Matt's Music)

### Payment Methods

- `private_pay` - Direct payment
- `self_directed` - Reimbursement (often slow)
- `group_home` - Facility billing
- `scholarship` - Scholarship fund
- `venmo` - Venmo payment

### Billing Methods

- `square` - Square invoice
- `check` - Check payment
- `email` - Email invoice
- `other` - Other billing method

Both lists are customizable per-organization via `settings.custom_lists` (labels and visibility).

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/lockout` | POST | Account lockout check/record |
| `/api/clients/[id]/access-token` | POST | Generate client portal access token |
| `/api/clients/[id]/resources` | GET/POST | List/upload client resources |
| `/api/clients/[id]/resources/[resourceId]/download` | GET | Download a client resource |
| `/api/clients/[id]/resources/upload` | POST | Upload client resource file |
| `/api/clients/[id]/send-invite` | POST | Send portal invite to client |
| `/api/cron/cleanup` | GET | Periodic data cleanup |
| `/api/cron/scholarship-batches` | GET | Generate monthly scholarship invoices |
| `/api/cron/send-invoice-reminders` | GET | Invoice payment reminder cron (daily 2PM UTC) |
| `/api/cron/send-reminders` | GET | Session reminder cron |
| `/api/health` | GET | Full health check (all services) |
| `/api/health/live` | GET | Liveness probe (app running) |
| `/api/health/ready` | GET | Readiness probe (DB connected) |
| `/api/health/restore` | POST | Restore a paused Supabase project via Management API (requires `SUPABASE_ACCESS_TOKEN`) |
| `/api/help/chat` | GET/POST | AI help assistant (config probe / streaming answers via Claude) |
| `/api/invites/user` | POST | Create a team invite (token + email) |
| `/api/invites/validate` | GET | Validate an invite token |
| `/api/invoices/[id]/pdf` | GET | Generate PDF |
| `/api/invoices/[id]/send` | POST | Email invoice |
| `/api/invoices/[id]/square` | POST | Create Square invoice |
| `/api/payroll/annual-summary/pdf` | GET | Contractor annual earnings summary PDF (contractor: own; owner: any in org via `contractorId`) |
| `/api/payroll/tax-summary` | GET | Cash-basis annual contractor totals CSV (`?year=`, `&detail=1` for per-session rows) |
| `/api/portal/*` | Various | Client portal endpoints (validate, sessions, goals, resources, session-requests, request-link) |
| `/api/session-requests/[id]/approve` | POST | Approve a session request |
| `/api/session-requests/[id]/decline` | POST | Decline a session request |
| `/api/sessions/export` | GET | Export sessions data |
| `/api/square/status` | GET | Check Square connection status |
| `/api/webhooks/square` | POST | Square payment webhooks |

## Security Infrastructure

### Rate Limiting
- `src/lib/rate-limit.ts` — Upstash Redis sliding window rate limiter
- Auth routes: 5 requests/60s per IP
- API routes: 60 requests/60s per IP
- Gracefully disabled if Upstash env vars are not set

### Account Lockout
- `src/lib/auth/lockout.ts` — checks/records login attempts
- `src/app/api/auth/lockout/route.ts` — API endpoint (pre-auth, uses service role)
- `login_attempts` table tracks failed/successful logins
- Lockout settings are per-organization via `settings.security`

### Error Boundaries
- `src/app/global-error.tsx` — Root error boundary (inline styles, own `<html>`)
- `src/app/(dashboard)/error.tsx` — Dashboard errors
- `src/app/(auth)/error.tsx` — Auth flow errors
- `src/app/(portal)/error.tsx` — Client portal errors

### Security Headers (`next.config.ts`)
- CSP, HSTS (`max-age=31536000; includeSubDomains`), X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), Referrer-Policy, X-XSS-Protection, Permissions-Policy
- Applied to all routes — modify in `next.config.ts` `headers()` function

### Safe Logging
- `src/lib/logger.ts` — Use instead of raw `console.error` for anything that might contain PHI
- Strips error objects to `{ name, message }` only — never logs stack traces or request bodies

### Next.js 16 Proxy (Middleware)
- **File must be `src/proxy.ts`** exporting `proxy` function (NOT `middleware.ts`)
- Next.js 16 renamed middleware to "proxy" — using the old convention triggers a deprecation warning
- **HTTPS enforcement**: Redirects HTTP → HTTPS (301) in production via `x-forwarded-proto` header
- **ENCRYPTION_KEY check**: Returns 503 for all routes in production if `ENCRYPTION_KEY` is missing (HIPAA enforcement). In dev, logs a one-time warning instead.
- **Rate limiting**: Auth paths use `authRateLimit`, API paths use `apiRateLimit` (gracefully skipped if Upstash not configured)
- **Session refresh**: Calls `updateSession()` for Supabase auth session management

## Key Components

- `SessionForm` - Main session entry with pricing preview
- `QuickLogDrawer` (+ `QuickSessionFAB`) - Fast mobile session logging; shares `createNewSession()` with `SessionForm`
- `InvoiceActions` - Invoice status and payment actions
- `InvoicePDF` - React-PDF template
- `PayrollHubTable` - Contractor payment tracking
- `AdminGuard` - Role-based component wrapper

## Key Library Modules

- `src/lib/dates.ts` — `parseLocalDate()` timezone fix for date-only strings
- `src/lib/constants/display.ts` — Display constants, labels, formatters
- `src/lib/crypto/phi.ts` — Higher-level PHI encrypt/decrypt helpers (wraps `src/lib/crypto/`)
- `src/lib/validation/schemas.ts` — Zod schemas for API input validation
- `src/lib/features/index.ts` — Feature flag system (`isFeatureEnabled(settings, flag)`, fail-open design)
- `src/lib/supabase/mfa.ts` — MFA enrollment/verification utilities
- `src/lib/actions/helpers.ts` — Server action helpers (auth checks, error handling)
- `src/lib/env.ts` — Runtime env validation (`validateEnv()`); checks required vars in production, warns on missing recommended vars, skips during `next build`
- `src/lib/invoices/send.ts` — Email dispatch for invoices (shared between API routes and server actions)
- `src/lib/queries/scholarship.ts` — Scholarship batch queries used by the monthly cron + UI
- `src/lib/portal/token.ts` — Client portal access token generation/validation
- `src/lib/invoices/status.ts` — `invoiceStatusUpdate()`: builds an invoice status change, always (re)setting `paid_date` (null unless status is `paid`, so leaving paid clears it)
- `src/lib/invoices/batch-totals.ts` — `sumInvoiceItemTotals()`: recompute a batch invoice header from its surviving line items (avoids concurrent-decrement drift)
- `src/lib/invoices/split.ts` — `perClientInvoiceShare()`: split session pricing across per-client invoices (mirrors `createNewSession`'s division)
- `src/lib/invoices/client-search.ts` — `clientSearchFilterIds()`: turn a client-name search into a `client_id` `.in()` filter (an embedded-resource filter can't live in a top-level PostgREST `.or()`)
- `src/lib/settings/input.ts` — `parseSettingNumber()` (allows `0`, unlike `x || fallback`) and `resolveDurationOptions()` (never returns an empty list)
- `src/lib/health/detail-auth.ts` — `isHealthDetailAuthorized()`: gates `/api/health` per-check detail behind `CRON_SECRET` in production
- `src/app/actions/session-requests.ts` — `getPendingSessionRequests()`: staff read of pending session requests with the client-submitted notes decrypted
- Atomic payroll mark-paid: `markSessionsPaid()` in `src/app/actions/sessions.ts` → the `mark_sessions_paid(uuid[], date)` Postgres function (one statement, only touches not-yet-paid rows, snapshots each session's `contractor_pay`)
- `src/lib/organization/settings.ts` — `DEFAULT_SETTINGS` + `mergeOrganizationSettings()` (see Configurable Organization Settings above), plus `ADMIN_WRITABLE_SETTING_SECTIONS` / `applySettingsUpdate()`: the section allow-list an admin may write (`invoice`, `session`, `notification`, `custom_lists`, `pricing`) — `security`, `portal`, `features` and `automation` are owner-only
- `src/app/actions/organization.ts` — `updateOrganizationSettings()`: the ONLY settings write path (`organizations` RLS is owner-only). Checks `session:view-all`, pins non-owners to their own org, applies the allow-list above, then writes with the service client. `OrganizationContext.updateSettings()` calls it and mirrors back what was actually persisted
- `src/lib/payroll/constants.ts` — `UNPAID_PAYROLL_STATUSES` (`submitted`, `approved`, `no_show`): the single source for "unpaid contractor work" — Payroll Hub (`/payments`) and contractor Earnings (`/earnings`) MUST both use it or approved sessions silently vanish from payroll
- `src/lib/payroll/annual-summary.ts` — cash-basis annual contractor earnings (tax summaries): `isPaidInYear()` (date-string compare on `contractor_paid_date`), `paidAmountForSession()` (`contractor_paid_amount ?? contractor_pay ?? 0`), `summarizeContractorYear()`/`summarizeByContractor()` (rounded at the aggregation boundary), CSV builders. Zero PHI by design — consumed by the Tax Summaries tab, the Earnings annual card, and both `/api/payroll/*` routes; any fetch feeding it must paginate (PostgREST max-rows silently truncates)
- `src/lib/earnings/buckets.ts` — `monthBoundaries()`: local-calendar month/year date ranges (UTC conversion made evening sessions count in two months)
- `src/lib/invoices/overdue.ts` — `isInvoiceOverdue()`/`invoiceDaysOverdue()`: local-date string comparison (avoids the UTC-parse off-by-one)
- `src/lib/invoices/auto-send-policy.ts` — `resolveAutoSendMethod()`: the gate for auto-sending invoices on approve — BOTH single- and bulk-approve paths must go through it
- `src/lib/invoices/pdf-notes.ts` — `clientInvoiceNotes()`: only `client_notes` may appear on client-facing invoice PDFs; internal `session.notes` are staff-only PHI
- `src/lib/invoices/scholarship-batch-feedback.ts` — `scholarshipBatchToasts()`: always returns at least one toast for "Generate All" scholarship batches (including error/nothing-to-do)
- `src/lib/portal/decrypt-notes.ts` — `decryptClientNotesForPortal()`: decrypts `client_notes` for portal display, tolerating legacy plaintext rows
- `src/lib/auth/invite-scope.ts` — `canTargetOrgForInvite()`: admins may only invite into their OWN org (developer/owner are intentionally cross-org); guards against cross-tenant invite minting
- `src/lib/actions/session-invoice-cleanup.ts` — `deletePendingSessionInvoices()`/`hasBilledSessionInvoice()`: reject/cancel/delete flows may only remove PENDING invoices; sent/paid invoices are financial records and must never be deleted
- `src/lib/session-form/create-session.ts` — `createNewSession()`: session + attendees + per-client invoice creation, shared by `SessionForm` and `QuickLogDrawer`
- `src/lib/square/invoices.ts` — Square invoice creation with deterministic idempotency keys (based on local invoice id) and optional processing-fee service charge; sandbox sends to `SQUARE_DEV_EMAIL`
- `src/lib/square/auto-send.ts` — `autoSendInvoicesViaSquare()`: post-approval Square auto-send (never throws; returns a summary)
- `src/lib/square/webhook-status.ts` — `resolveSquareWebhookStatus()`: FORWARD-ONLY status mapping — out-of-order/retried Square webhooks must never un-pay a paid invoice
- `src/lib/help/ai.ts` — AI help assistant: `buildHelpCorpus()` (role-filtered articles+FAQs for the system prompt) and `buildOrgContext()` (WHITELISTED non-PHI org config — never add client/session/invoice/team data; that is the compliance boundary), `streamHelpAnswer()` (Claude streaming with prompt caching)
- `src/lib/help/citations.ts` — `extractSources()`: splits an AI answer into display text + cited article slugs (`[[slug]]` markers)
- `src/lib/walkthroughs/completion.ts` — completed guided-tour tracking (localStorage, per-browser) + `RECOMMENDED_WALKTHROUGH_ORDER` + `nextRecommendedWalkthrough()`; consumed by the walkthrough provider (completion toast chaining) and the Help Center Guided Tours card. Tours (and individual steps) carry an `audience` (`'admin' | 'owner' | 'contractor'`, absent = everyone; `src/lib/walkthroughs/audience.ts`) — the provider filters steps per role, and `integrity.test.ts` enforces admin/owner tours launch from `adminOnly` articles while contractor/everyone tours launch from contractor-visible ones, plus every tour appearing in `RECOMMENDED_WALKTHROUGH_ORDER`. First-run discovery: `WalkthroughNudge` (dashboard, non-owners, one-shot) and the owner onboarding wizard's completion toast both offer the `app-overview` tour. `scripts/audit-walkthroughs.mts` (`npx tsx`, dev server running) steps every tour desktop+mobile (`VIEWPORT=mobile`) and asserts each step's highlight — run it after changing tours or the pages they visit; since the cert switch pass `AUDIT_EMAIL` + `AUDIT_PASSWORD` (cert tester + `CERT_TESTER_PASSWORD`) for login, and contractor-audience tours are skipped (verify those as a contractor by hand)

## Testing

### Unit Tests (Vitest)
```bash
npm run test                              # Run all unit tests
npm run test -- --watch                   # Watch mode
npm run test -- src/lib/pricing/index.test.ts  # Single file
npm run test -- --run                     # CI mode (no watch)
```

Unit tests are colocated `*.test.ts(x)` files next to the module they cover — nearly every module under `src/lib/` has one (pricing, permissions, lockout, crypto/PHI, validation schemas, invoice helpers, Square helpers, etc.), plus a few component tests under `src/components/`. When you add or change a `src/lib/` module, add/update its colocated test.

### E2E Tests (Playwright)
```bash
npm run test:e2e          # Run e2e tests (starts dev server automatically)
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:headed   # Run with visible browser
```

E2E tests are in `tests/e2e/` and cover auth, sessions, invoices, settings, and navigation flows.

**Which environment can run which specs** — this is not a preference, it is what each environment permits:

| Target | Command | Coverage |
|---|---|---|
| **local** | `npm run test:e2e` | **the full suite, including `session-creation` and `session-resubmit-invoice`** — the only place data-creating specs may run |
| cert | `TEST_USER_EMAIL=<a CERT_TESTERS address> TEST_USER_PASSWORD=$CERT_TESTER_PASSWORD npx playwright test --workers=1` | read-only specs only (44). Never the two data-creating specs — cert holds real PHI and live testers use it |
| prod | `playwright.prod.config.ts` + `E2E_REUSE_AUTH=1` and a pre-saved `storageState` | 28 specs. Auth-page specs (`app.spec.ts`, navigation's `Responsive Design`) **cannot pass** — prod rate-limits auth routes to ~2 requests/60s, then 429s |

Authenticated specs need `TEST_USER_PASSWORD`. Without it `login()` calls `test.skip()`, so the suite reports green while covering almost nothing — check the skip count, not just the colour. Prod additionally enforces TOTP, so a per-test login is impossible there; authenticate once and reuse `storageState`.

## Environment Variables

`validateEnv()` (`src/lib/env.ts`) hard-requires the first four in production and warns on missing recommended vars:

```
# Required (validateEnv fails production boot without these)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
# PHI Encryption (HIPAA compliance). Generate with: openssl rand -hex 32
# IMPORTANT: Never use NEXT_PUBLIC_ prefix — this key must stay server-side only
ENCRYPTION_KEY=64-hex-character-key-here

# Recommended (warned if missing)
NEXT_PUBLIC_APP_URL=
RESEND_API_KEY=
# The Resend-VERIFIED sending domain. `getFromAddress()` THROWS when it is unset rather
# than falling back to a default — the old `|| 'rattatata.xyz'` fallback pointed at a
# domain later deleted from Resend, so every send 403'd for seven months while
# /api/health stayed green (it only checks that RESEND_API_KEY exists). Setting
# RESEND_API_KEY without this pair-mate now fails the production boot in validateEnv().
EMAIL_FROM_DOMAIN=
# Reply-To for outbound mail. Without it mail sends from noreply@ with no reply path,
# which is a deliverability negative and a dead end for clients who hit reply.
EMAIL_REPLY_TO=

# Square integration
SQUARE_ACCESS_TOKEN=
SQUARE_ENVIRONMENT=sandbox|production
SQUARE_DEV_EMAIL=          # sandbox invoice recipient override (prevents emailing real clients)

# Rate Limiting (optional — gracefully disabled if not set)
# The Vercel Marketplace "Upstash for Redis" integration injects KV_REST_API_URL /
# KV_REST_API_TOKEN instead; src/lib/rate-limit.ts accepts either pair (UPSTASH_* wins).
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# AI help assistant (recommended — the chat hides itself when the key is absent)
ANTHROPIC_API_KEY=
HELP_AI_MODEL=            # optional model override; defaults to claude-sonnet-5

# Cron job authentication
CRON_SECRET=secret-for-vercel-cron-jobs

# Local-only auto-login (never set in Vercel): middleware signs unauthenticated requests
# in as dev-owner@maycreativearts.test using TEST_USER_PASSWORD. Requires dev build AND
# the MCA-Dev Supabase project (gate in src/lib/auth/dev-auto-login.ts); auth pages exempt.
DEV_AUTO_LOGIN=1

# Supabase Management API (optional — enables auto-restore of paused projects from the login page)
SUPABASE_ACCESS_TOKEN=
```

## Dark Mode / Theming

The root layout uses `next-themes` (`ThemeProvider` with `attribute="class"`) supporting light, dark, and system themes. Components use Tailwind's `dark:` variant for dark mode styles.

## CI Workflows (`.github/workflows/`)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `test.yml` | Push/PR to `main` | Lint → type check (`tsc --noEmit`) → unit tests → build |
| `deploy.yml` | Push/PR to `main`/`master` | Type check → lint → tests → Vercel deploy (prod on push, preview on PR) |
| `codeql.yml` | Push/PR + weekly | CodeQL static analysis (security-extended + security-and-quality) |
| `semgrep.yml` | Push/PR + weekly | Semgrep SAST (JS/TS/React/Next.js/OWASP rules) |
| `claude.yml` | `@claude` mention | Claude Code GitHub Action for issue/PR assistance |

CI uses Node 24.

**Preview deploys target cert.** `deploy.yml` runs `vercel pull --environment=preview` on PRs and matches build/deploy to the same target, so a PR's Preview URL uses the **Preview**-scoped env vars — which point at the cert Supabase project. That makes every PR testable against prod-shaped data. (The old "prebuilt environment mismatch" known-issue is fixed; pull, build and deploy now all match the event.)

Vercel crons only run against the Production deployment, so the four jobs in `vercel.json` never fire on a Preview/cert deploy. To exercise one against cert, call the route directly with cert's `CRON_SECRET`.

## Development Principles

### HIPAA Security

When handling Protected Health Information (PHI):

- **Encrypt PHI fields** using `src/lib/crypto/` utilities before storing in database
- **PHI fields include**: session notes (`sessions.notes`/`client_notes`), client notes (`clients.notes`), goal descriptions (`client_goals.description`), session-request notes (`session_requests.notes`), medical info. Canonical list: `PHI_FIELDS` in `src/lib/crypto/phi.ts`. Browser-written PHI (e.g. the client add/edit dialog) must route through a server action to encrypt, since `ENCRYPTION_KEY` is server-only.
- **Never log PHI** - use `hashForAudit()` from `src/lib/crypto/` for audit trails
- **Use safe logger** - `import { logger } from '@/lib/logger'` instead of raw `console.error` in server code
- **Validate and sanitize** all user inputs before processing
- **Use parameterized queries** - Supabase client handles this automatically
- **Apply RLS policies** on all tables containing PHI

```typescript
// Example: Encrypting before save
import { encryptField } from '@/lib/crypto'
const encryptedNotes = await encryptField(notes)

// Example: Decrypting after read
import { decryptField, isEncrypted } from '@/lib/crypto'
const notes = isEncrypted(session.notes)
  ? await decryptField(session.notes)
  : session.notes
```

### Modularity

Code should be organized for reusability and maintainability:

- **Business logic** in `/lib/` - reusable across pages and components
- **UI components** in `/components/` - stateless where possible
- **Database queries** via Supabase client, not raw SQL in components
- **Feature flags** in `organization.settings` JSON for gradual rollout
- **Types** in `/types/database.ts` - single source of truth for data shapes

### End-User Configurability

The business owner should be able to customize the app without code changes:

- **Service types, rates, pricing formulas** - managed via Settings > Services
- **Per-contractor pay rates** - via `contractor_rates` table (links contractor + service type → custom rate)
- **Organization settings** - branding, payment methods, MFA requirements, pricing, portal, security
- **Avoid hardcoded business rules** - use `organization.settings` JSONB (see Configurable Organization Settings above)
- **New features** should be toggleable per-organization when possible

### Contractor Pricing Model

The app supports per-contractor-per-service pricing:

- `contractor_rates` table - Custom 30-min pay rates per contractor per service type (raises baked in)
- `service_types.contractor_pay_schedule` - JSONB mapping duration → base contractor pay (e.g., `{"30": 38.50, "45": 54.00}`)
- For non-30-min durations: `contractorPay = customRate + (schedule[duration] - schedule[30])`

```typescript
// Pricing lookup priority:
// 1. contractor_rates + schedule offset for duration
// 2. contractor_pay_schedule for the duration
// 3. Calculated from service_type formula (total - MCA%)
```

### Adding shadcn/ui Components

```bash
npx shadcn@latest add <component>
```

Existing: Button, Card, Dialog, Select, Table, Tabs, Badge, etc.

### Help Articles

When making user-facing changes (new features, changed behavior, new settings, UI changes), **always update the relevant help articles**. This includes:

- Adding documentation for new features to existing articles or creating new articles
- Updating articles when existing behavior changes (e.g., form fields added/removed, defaults changed)
- Updating settings documentation when new configuration options are added

Help content lives in `src/app/(dashboard)/help/_data/` (the old import path `help-articles.ts` is a barrel over it):

- **Articles** in `articles/<category>.ts` — TypeScript objects with `slug`, `title`, `category`, `description`, `content` (markdown in a template literal — escape backticks), `keywords` (**required in practice: ≥3 lowercase entries**, matched with high weight by search), and optional `relatedArticles`, `walkthrough`, `adminOnly`. Categories: `getting-started`, `clients`, `sessions`, `invoices`, `team`, `analytics`, `settings`.
- **FAQs** in `faqs.ts` — `HelpFaq` entries (stable `id`, question in user phrasing, 1–2 paragraph markdown `answer`, optional `articleSlug` deep link). Rendered as the Common Questions accordion and inline in search results.
- **Search** in `search.ts` — synonym map (`SYNONYMS`), question-stopword stripping, keyword/title/description/content scoring. Add synonyms when users' words differ from the app's vocabulary.
- **Coverage guard**: `integrity.test.ts` enforces a route→article coverage matrix, slug/FAQ referential integrity, and the keywords rule — **when you add a dashboard route or settings tab, add its row to `COVERAGE_MATRIX`** there.
- **Gap detection**: the `help_events` table records zero-result searches and 👎 article votes (owner-visible "Help gaps" card on `/help/`) — review it when deciding what to document next. Contextual `<PageHelp article="slug" />` "?" buttons link pages to their articles.
