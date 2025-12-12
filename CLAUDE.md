# MCA App - Detailed Reference

See the root `CLAUDE.md` for primary documentation. This file contains additional implementation details.

## Service Type Configuration

Service types are stored in the `service_types` table with these fields:
- `base_rate` - Base price (for 30 minutes)
- `per_person_rate` - Additional cost per person after the first (0 for individual sessions)
- `mca_percentage` - Percentage taken by MCA (20-30%)
- `contractor_cap` - Maximum contractor pay per session (null if no cap)
- `rent_percentage` - Percentage for rent (10% for Matt's Music, 0 otherwise)
- `category` - `music_individual`, `music_group`, `art_individual`, `art_group`
- `location` - `in_home`, `matts_music`, `other`

## Payment Methods

Clients can pay via:
- `private_pay` - Cash/check direct payment
- `self_directed` - Self-directed reimbursement (often slow payer)
- `group_home` - Group home billing via checks
- `scholarship` - Scholarship fund

## Organization Settings Structure

Settings stored in `organizations.settings` JSON field:
```typescript
{
  invoice: { footer_text, payment_instructions, due_days, send_reminders, reminder_days[] },
  session: { default_duration, duration_options[], require_notes, auto_submit, reminder_hours, send_reminders },
  notification: { email_on_session_submit, email_on_invoice_paid, admin_email },
  security: { session_timeout_minutes, require_mfa, max_login_attempts, lockout_duration_minutes }
}
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/invoices/[id]/pdf` | GET | Generate PDF for invoice |
| `/api/invoices/[id]/send` | POST | Send invoice via email |
| `/api/invoices/[id]/square` | POST | Create/send Square invoice |
| `/api/webhooks/square` | POST | Handle Square payment webhooks |
| `/api/cron/send-reminders` | GET | Cron job for invoice reminders |

## Key Components

- `SessionForm` (`components/forms/session-form.tsx`) - Main session entry form
- `InvoiceActions` (`components/forms/invoice-actions.tsx`) - Invoice status/payment actions
- `InvoicePDF` (`components/pdf/invoice-pdf.tsx`) - React-PDF invoice template
- `PayrollHubTable` (`components/tables/payroll-hub-table.tsx`) - Contractor payment tracking
