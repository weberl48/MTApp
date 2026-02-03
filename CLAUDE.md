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

## Development Commands

```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
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
npm run health https://your-app.vercel.app  # Check production
```

## Architecture

### Route Groups
- `(auth)` - Login, signup, password reset (public)
- `(dashboard)` - Main app with sidebar (requires auth)
- `(portal)` - Client portal (token-based access, no auth)
- `api/` - API routes for PDF generation, webhooks, etc.

### Key Patterns

**Supabase Client Usage**:
- Server Components/API routes: `import { createClient } from '@/lib/supabase/server'`
- Client Components: `import { createClient } from '@/lib/supabase/client'`
- Service role (webhooks): `import { createServiceClient } from '@/lib/supabase/service'`

**Context Providers**:
- `OrganizationContext` - Current user + organization data (dashboard)
- `PortalContext` - Client data for portal (token-based)
- `BrandingProvider` - Organization branding (colors, logo)

**Pricing Logic** (`src/lib/pricing/index.ts`):
- `calculateSessionPricing()` - Computes total, MCA cut, contractor pay, rent
- Handles duration scaling (30-min base), per-person rates for groups, contractor caps

### Database Schema

Core tables with RLS policies:
- `organizations` - Multi-tenant container with settings JSON
- `users` - Extends Supabase auth, has role enum + `pay_increase` field
- `clients` - Patients with payment method
- `service_types` - Pricing configuration per organization
- `contractor_rates` - Per-contractor-per-service custom pay rates
- `sessions` - Session logs with status workflow (draft → submitted → approved)
- `session_attendees` - Many-to-many for group sessions
- `invoices` - Generated from sessions, Square integration fields

Schema is in `supabase/schema.sql`. Run migrations via Supabase Dashboard or CLI.

### User Roles & Permissions

| Role | Access |
|------|--------|
| `developer` | Full system access + all organizations |
| `owner` | Full org access, manage team, branding |
| `admin` | Same as owner except org deletion |
| `contractor` | Own sessions/invoices only |

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

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/invoices/[id]/pdf` | GET | Generate PDF |
| `/api/invoices/[id]/send` | POST | Email invoice |
| `/api/invoices/[id]/square` | POST | Create Square invoice |
| `/api/webhooks/square` | POST | Square payment webhooks |
| `/api/cron/send-reminders` | GET | Invoice reminder cron |
| `/api/portal/*` | Various | Client portal endpoints |
| `/api/health` | GET | Full health check (all services) |
| `/api/health/live` | GET | Liveness probe (app running) |
| `/api/health/ready` | GET | Readiness probe (DB connected) |

## Key Components

- `SessionForm` - Main session entry with pricing preview
- `InvoiceActions` - Invoice status and payment actions
- `InvoicePDF` - React-PDF template
- `PayrollHubTable` - Contractor payment tracking
- `AdminGuard` - Role-based component wrapper

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
ENCRYPTION_KEY=64-hex-character-key-here
```

## Development Principles

### HIPAA Security

When handling Protected Health Information (PHI):

- **Encrypt PHI fields** using `src/lib/crypto/` utilities before storing in database
- **PHI fields include**: session notes, client notes, goal descriptions, medical info
- **Never log PHI** - use `hashForAudit()` from `src/lib/crypto/` for audit trails
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
- **Organization settings** - branding, payment methods, MFA requirements
- **Avoid hardcoded business rules** - use database-driven configuration
- **New features** should be toggleable per-organization when possible

### Contractor Pricing Model

The app supports per-contractor-per-service pricing:

- `users.pay_increase` - Contractor's per-session bonus (e.g., +$2)
- `contractor_rates` table - Custom pay rates per contractor per service type
- When calculating contractor pay, check `contractor_rates` first, then fall back to service type default

```typescript
// Pricing lookup priority:
// 1. contractor_rates table (specific rate for this contractor + service)
// 2. service_type defaults + user.pay_increase
// 3. Calculated from service_type formula
```

### Leverage Existing Packages

Before implementing new functionality, always check for existing solutions:

1. **Search npm** for well-maintained packages that solve the problem
   - Prefer packages with: high weekly downloads, recent updates, TypeScript support, minimal dependencies
   - Examples already in use: `date-fns` (dates), `sonner` (toasts), `react-pdf` (PDFs), `zod` (validation)

2. **Check shadcn/ui** for components before building custom ones
   - Run `npx shadcn@latest add <component>` to add new components
   - Existing: Button, Card, Dialog, Select, Table, Tabs, Badge, etc.

3. **Use Supabase features** before building custom backends
   - Auth, RLS policies, real-time subscriptions, storage, edge functions

4. **Evaluate before adopting**:
   - Is the package actively maintained (commits in last 6 months)?
   - Does it have known security vulnerabilities (`npm audit`)?
   - Is the bundle size reasonable for the functionality?
   - Does it have good TypeScript types?

5. **Document dependencies** - When adding a new package, note why it was chosen over alternatives

```bash
# Check package health before installing
npm view <package> time modified  # Last publish date
npm view <package> homepage       # Check GitHub stars/issues
```

### Development Workflow

**Before starting development each day:**
- Run `npm outdated` to check for package updates
- Review changelogs for major framework updates (Next.js, React, Tailwind)
- Run `npm audit` to check for security vulnerabilities

**When doing development work:**
- Always reference the official Next.js documentation at https://nextjs.org/docs for current best practices
- Check that code patterns match the latest stable Next.js version
- When implementing new features, verify the approach against current docs before coding
