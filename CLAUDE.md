# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCA App is a multi-tenant practice management system for May Creative Arts, handling session tracking, invoicing, and contractor payments for music/art therapy practices.

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
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check (used in CI)
npm run test         # Run Vitest tests
npm run test -- --watch  # Run tests in watch mode
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
npm run health:prod    # Check production
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

**Context Providers**:
- `OrganizationContext` - Current user + organization data (dashboard)
- `PortalContext` - Client data for portal (token-based)
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
- `sessions` - Session logs with status workflow (draft → submitted → approved)
- `session_attendees` - Many-to-many for group sessions
- `invoices` - Generated from sessions, Square integration fields

Schema is in `supabase/schema.sql`. Run migrations via Supabase Dashboard or CLI.

### Configurable Organization Settings

Business rules are stored in `organization.settings` (JSONB) rather than hardcoded. The `OrganizationSettings` type in `src/types/database.ts` defines all sections:

| Section | Fields | Defaults |
|---------|--------|----------|
| `invoice` | `footer_text`, `payment_instructions`, `due_days`, `send_reminders`, `reminder_days`, `auto_send_square_on_approve` | 30 days, reminders at 7 and 1 day, auto-send off |
| `session` | `default_duration`, `duration_options`, `require_notes`, `auto_submit`, `reminder_hours`, `send_reminders` | 30 min, [30,45,60,90] |
| `notification` | `email_on_session_submit`, `email_on_invoice_paid`, `admin_email` | Both enabled |
| `security` | `session_timeout_minutes`, `require_mfa`, `max_login_attempts`, `lockout_duration_minutes` | 30 min, 5 attempts, 15 min lockout |
| `pricing` | `no_show_fee`, `duration_base_minutes` | $60, 30 min |
| `portal` | `token_expiry_days` | 90 days |
| `features` | `client_portal` | Enabled (fail-open: missing flags default to `true`) |
| `custom_lists` | `payment_methods`, `billing_methods` | All methods visible with default labels |
| `automation` | `auto_approve_sessions`, `auto_send_invoice_on_approve`, `auto_send_invoice_method`, `auto_generate_scholarship_invoices`, `scholarship_invoice_day` | All off, method `'none'`, day 1 |

Defaults are applied via deep merge in `OrganizationContext` — organizations without new fields automatically get default values.

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

**Available permissions**: `session:approve`, `session:delete`, `session:cancel`, `session:mark-no-show`, `session:view-all`, `invoice:bulk-action`, `invoice:delete`, `invoice:send`, `team:view`, `team:manage`, `team:invite`, `settings:edit`, `analytics:view`, `payments:view`, `financial:view-details`

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
| `/api/cron/send-reminders` | GET | Invoice reminder cron |
| `/api/health` | GET | Full health check (all services) |
| `/api/health/live` | GET | Liveness probe (app running) |
| `/api/health/ready` | GET | Readiness probe (DB connected) |
| `/api/invites/user` | GET | Get pending invites for user |
| `/api/invites/validate` | GET | Validate an invite token |
| `/api/invoices/[id]/pdf` | GET | Generate PDF |
| `/api/invoices/[id]/send` | POST | Email invoice |
| `/api/invoices/[id]/square` | POST | Create Square invoice |
| `/api/portal/*` | Various | Client portal endpoints (sessions, goals, resources, session-requests) |
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

## Testing

### Unit Tests (Vitest)
```bash
npm run test                              # Run all unit tests
npm run test -- --watch                   # Watch mode
npm run test -- src/lib/pricing/index.test.ts  # Single file
npm run test -- --run                     # CI mode (no watch)
```

Unit tests cover:
- Pricing calculations (`src/lib/pricing/index.test.ts`)
- Session form defaults (`src/lib/session-form/defaults.test.ts`)
- Client multi-select component (`src/components/forms/client-multi-select.test.tsx`)
- Owner onboarding steps (`src/components/onboarding/owner-onboarding-steps.test.ts`)
- Account lockout logic (`src/lib/auth/lockout.test.ts`)
- Password validation (`src/lib/auth/password.test.ts`)
- Permissions system (`src/lib/auth/permissions.test.ts`)
- Encryption utilities (`src/lib/crypto/index.test.ts`)
- PHI field helpers (`src/lib/crypto/phi.test.ts`)
- Validation schemas (`src/lib/validation/schemas.test.ts`)

### E2E Tests (Playwright)
```bash
npm run test:e2e          # Run e2e tests (starts dev server automatically)
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:headed   # Run with visible browser
```

E2E tests are in `tests/e2e/` and cover auth, sessions, invoices, settings, and navigation flows.

**Note**: Full e2e coverage requires `TEST_USER_PASSWORD` environment variable for authenticated tests.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
SQUARE_ACCESS_TOKEN=
SQUARE_ENVIRONMENT=sandbox|production

# PHI Encryption (HIPAA compliance)
# Generate with: openssl rand -hex 32
# IMPORTANT: Never use NEXT_PUBLIC_ prefix — this key must stay server-side only
ENCRYPTION_KEY=64-hex-character-key-here

# Rate Limiting (optional — gracefully disabled if not set)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cron job authentication
CRON_SECRET=secret-for-vercel-cron-jobs
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

CI uses Node 20.

## Development Principles

### HIPAA Security

When handling Protected Health Information (PHI):

- **Encrypt PHI fields** using `src/lib/crypto/` utilities before storing in database
- **PHI fields include**: session notes, client notes, goal descriptions, medical info
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
