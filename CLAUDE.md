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
- **Mobile**: Capacitor (Android & iOS)
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

### Mobile Development
```bash
npm run cap:sync     # Sync web build to native projects
npm run cap:ios      # Open in Xcode
npm run cap:android  # Open in Android Studio
npm run mobile:prepare  # Build + sync for mobile
```

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
- `users` - Extends Supabase auth, has role enum (developer/owner/admin/contractor)
- `clients` - Patients with payment method
- `service_types` - Pricing configuration per organization
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

Tests use Vitest with jsdom. Run a single test file:
```bash
npm run test -- src/lib/pricing/index.test.ts
```

Existing tests cover:
- Pricing calculations (`src/lib/pricing/index.test.ts`)
- Session form defaults (`src/lib/session-form/defaults.test.ts`)
- Client multi-select component (`src/components/forms/client-multi-select.test.tsx`)

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
