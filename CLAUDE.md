# May Creative Arts (MCA) - Practice Management App

## Project Overview

Mobile-first practice management system for May Creative Arts that automates session tracking, invoicing, and contractor payments. Replaces current spreadsheet + Intuit workflow.

**Contact:** maycreativearts@gmail.com
**Users:** 4-5 (Admin: Amara, Contractors: Therapists/Artists)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 + React 19 (App Router) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Mobile | PWA (Progressive Web App) |
| Payments | Square Invoices API |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Hosting | Vercel |

---

## Pricing Rules (CRITICAL BUSINESS LOGIC)

### In-Home Individual Sessions
- **Rate:** $50/30 minutes
- **MCA Cut:** 23%

### In-Home Group Sessions
- **Base:** $50 flat + $20 per additional person
- **Billing:** Price divided evenly among clients
- **MCA Cut:** 30%
- **Contractor Cap:** $105 max per session (MCA takes remainder)
- **Example:** 4 people = $110 total → $27.50/person

### Matt's Music Individual
- **Rate:** $55
- **MCA Cut:** 30%
- **Rent:** 10% of session goes to rent

### Matt's Music Group
- **Base:** $50 flat + $20 per additional person
- **Billing:** Price divided evenly among clients

### Individual Art Lessons
- **Rate:** $40 flat
- **MCA Cut:** 20%

### Group Art Lessons
- **Base:** $40 flat + $15 per additional person
- **Billing:** Price divided evenly among clients
- **MCA Cut:** 30%

---

## Data Model

```sql
-- Users (contractors and admin)
users: id, email, role (admin|contractor), name, phone, payment_info

-- Clients (patients/participants)
clients: id, name, contact_email, contact_phone, payment_method, notes

-- Service Types (pricing configuration)
service_types: id, name, base_rate, per_person_rate, mca_percentage, contractor_cap, rent_percentage, location

-- Sessions (logged by contractors)
sessions: id, date, duration, service_type_id, location, contractor_id, status (draft|submitted|approved), notes

-- Session Attendees (many-to-many)
session_attendees: session_id, client_id, individual_cost

-- Invoices
invoices: id, session_id, client_id, amount, mca_cut, contractor_pay, status (pending|sent|paid), payment_method, due_date, paid_date, square_invoice_id, square_payment_url

-- Client Goals (Phase 3)
client_goals: id, client_id, description, status (active|met|not_met), created_at, completed_at
```

---

## User Flows

### Contractor: Log Session
1. Dashboard → "New Session"
2. Select service type (pricing auto-fills)
3. Select clients who attended
4. Enter date, time, duration
5. Add session notes
6. Submit → Invoice auto-generated as draft

### Admin: Review Invoice
1. Invoice queue → Select pending invoice
2. Review calculations
3. Edit if needed
4. Approve & Send → Email to client
5. Mark paid when payment received

### Admin: Pay Contractors
1. Contractor Payments → Select date range
2. View totals per contractor
3. Export or mark as paid

---

## Development Phases

### Phase 1: MVP Foundation
- [x] Project setup (Next.js 15, Tailwind, shadcn/ui)
- [ ] Supabase setup (auth, database, RLS)
- [ ] User authentication (email/password)
- [ ] Role-based access (admin vs contractor)
- [ ] Service types CRUD
- [ ] Client management
- [ ] Session logging form
- [ ] Pricing engine calculations
- [ ] Admin dashboard

### Phase 2: Invoicing
- [ ] Auto-generate invoices from sessions
- [ ] Invoice management UI
- [ ] PDF generation
- [ ] Email delivery
- [ ] Payment tracking
- [ ] Contractor payout summaries

### Phase 3: Documentation
- [ ] Enhanced session notes
- [ ] Client goals system
- [ ] Progress reporting

### Phase 4: Enhancements
- [ ] QuickBooks integration
- [ ] Calendar sync
- [ ] HIPAA compliance (Supabase Enterprise)

---

## Payment Methods to Support
- Private Pay (cash/check)
- Self-Directed reimbursement (slow payer)
- Group Home billing (checks)
- Scholarship Fund

---

## Security Notes

### MVP (Day 1)
- HTTPS via Vercel
- Supabase Row Level Security
- Email verification
- Session timeouts

### Before PHI Storage
- Supabase Enterprise + BAA
- Database encryption at rest
- Audit logging
- 2FA

---

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint
```

---

## File Structure

```
src/
├── app/
│   ├── (auth)/           # Login, signup pages
│   ├── (dashboard)/      # Protected routes
│   │   ├── dashboard/
│   │   ├── sessions/
│   │   ├── clients/
│   │   ├── invoices/
│   │   └── settings/
│   ├── api/              # API routes
│   └── layout.tsx
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Session, invoice forms
│   └── layout/           # Nav, sidebar
├── lib/
│   ├── supabase/         # Supabase client, types
│   ├── pricing/          # Pricing engine
│   └── utils.ts
└── types/
    └── database.ts       # Supabase generated types
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email (Resend)
RESEND_API_KEY=

# Square Payments (https://developer.squareup.com)
SQUARE_ACCESS_TOKEN=
SQUARE_WEBHOOK_SIGNATURE_KEY=

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=
```

---

## Square Integration

### Setup
1. Create account at https://developer.squareup.com
2. Create an application
3. Get Access Token (use Sandbox for testing, Production for live)
4. Add webhook URL: `{YOUR_APP_URL}/api/webhooks/square`
5. Subscribe to events: `invoice.payment_made`, `invoice.updated`, `payment.completed`
6. Get Webhook Signature Key for verification

### Database Migration
Run `supabase/add-square-columns.sql` to add Square columns to invoices table.

### Flow
1. Admin creates invoice from session
2. Admin clicks "Send via Square"
3. Square invoice created and sent to client email
4. Client pays via Square payment link
5. Square webhook updates invoice status to "paid"
