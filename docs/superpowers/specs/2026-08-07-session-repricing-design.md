# Bulk session re-pricing — design

**Date:** 2026-08-07
**Status:** implemented (v1)

## Problem

Session pricing is a **snapshot, not a computation**. `sessions.total_amount`, `mca_cut` and
`contractor_pay` are written once at save time; `invoices.amount`, `mca_cut` and `contractor_pay`
are written when the invoice row is created. Nothing recalculates on read.

So when the owner corrects a service rate, a contractor rate, or a wrong formula, everything
already saved keeps the old numbers. The sharp edge is the approvals queue: a submitted session
already carries pricing computed when the contractor saved it, and **approving it does not
re-price**. A session sitting in the queue when a rate changes gets approved at the old rate,
silently. With 20+ sessions routinely pending, this is live, not theoretical.

## What this does not change

`ensureInvoicesForSessionId` deliberately builds pricing from the session's *stored* amounts —
"the billing truth — re-pricing from the service type could drift from what was approved." That
stays. Re-pricing is an **explicit, auditable, opt-in act**, never a side effect of approval.

## Architecture

### The gap that shaped the design

There was no server-side way to price a stored session. Pricing is assembled in the *browser*
(`session-form.tsx:230`, `quick-log-drawer.tsx:105`) and `createNewSession` stores whatever the
form computed. Four other server call sites each rebuild their own variant of the inputs.

The assembly is non-trivial — `selectedPaymentMethod` alone is three branches. So v1's core
deliverable is a canonical server-side assembler, not the bulk UI.

### Modules

| Module | Responsibility |
|---|---|
| `src/lib/pricing/price-session.ts` | `sessionPricingInputs()` (pure — rebuilds the form's five inputs), `priceFromInputs()`, `pricingDiff()` |
| `src/lib/pricing/reprice-eligibility.ts` | `repriceEligibility()` (pure) + named skip reasons and their UI labels |
| `src/app/actions/reprice-sessions.ts` | `repriceSessions(ids, apply)` — loads, evaluates, optionally writes |
| `src/components/sessions/reprice-dialog.tsx` | Preview-then-confirm dialog |
| `src/app/(dashboard)/sessions/page.tsx` | Owner-only "Recalculate pricing" button in the existing bulk bar |

### The contract that matters

`sessionPricingInputs` **must reproduce `session-form.tsx` exactly**. If it does not, re-pricing a
session nobody has touched silently rewrites correct money. Mirrored branches (line refs as of
2026-08-07):

- `isGroupService` :170 — `per_person_rate > 0`
- `requiresClient` :189 — `requires_client !== false`
- `attendeeCount` :195 — group → headcount; no-client service → 1; else attendee count
- `paymentMethod` :214 — scholarship service → `'scholarship'`; group → billing agency's method;
  exactly one client → that client's; otherwise undefined

`price-session.test.ts` pins each branch and asserts the **no-op invariant**: assembled inputs fed
through `calculateSessionPricing` equal the form's own call with the same arguments.

### Eligibility

Only `submitted` and `approved` sessions re-price. Every refusal carries a named reason that
reaches the UI — a skipped session is explained, never silently absent.

| Reason | Why |
|---|---|
| `invoice-sent` / `invoice-paid` | Financial records. Any sibling invoice beyond `pending` blocks the whole session, or split invoices would disagree about one session. |
| `square-linked` | Square holds the authoritative copy; a local edit desyncs with no reconciliation path. |
| `on-batch-invoice` | Lives in `invoice_items`; needs a `sumInvoiceItemTotals` header recompute that v1 does not do. |
| `status-not-repriceable` | `draft` (re-prices on save anyway), `cancelled` (bills nothing), and **`no_show`** — priced by `calculateNoShowPricing`, so the standard formula would erase its flat fee. |
| `no-service-type` | Nothing to price from. |

### Writes

Applying updates the session snapshot, then re-prices its **pending** invoices with
`distributeAmount()` — split across them, never written in full to each. This is the rule
`markSessionNoShow` already follows, for the same reason: a two-client session given the full
amount on both invoices double-bills.

`contractor_rates` is read with `createServiceClient()` after the action's own authz. It is
owner-only under RLS; reading it with the user client would return nothing and re-price every
contractor to the service-type formula — the exact bug this feature exists to fix.

### Safety

- **Two-phase.** `apply: false` computes the full diff and writes nothing. Only `apply: true`
  touches a row. Money never changes without somebody having seen before and after. The preview is
  the whole safety mechanism: a mistyped rate is obvious there and invisible afterwards.
- **Owner/developer only**, via `settings:edit` — deliberately absent from
  `ADMIN_GRANTABLE_PERMISSIONS`, so no grant can widen it to an admin.
- **Audited for free.** `sessions` and `invoices` both carry `audit_trigger_function()` triggers,
  so every re-priced row lands in Settings → Audit Log.
- **Bounded.** 200 sessions per call.

## Known limitations (v1)

1. **Only `submitted` sessions are selectable in the UI.** The row checkbox renders for
   `status === 'submitted'` only, so approved sessions cannot be reached from the bulk bar even
   though the action accepts them. This covers the motivating case (the approvals queue). Widening
   it means relaxing the checkbox condition.
2. **Batch/scholarship invoices are refused, not handled.** No `invoice_items` rows exist in prod
   today, so nothing currently hits this path.
3. **`no_show` sessions are refused.** Re-pricing them correctly means routing through
   `calculateNoShowPricing`; deferred rather than risk erasing the flat fee.
4. **Sent and paid invoices are out of scope** — a separate feature by explicit decision. It needs
   its own answers on Square divergence, re-sending a corrected invoice, and whether a client who
   already paid gets a credit.
5. **The other four server-side pricing assemblies were not migrated** to
   `sessionPricingInputs` (`scholarship-invoices.ts`, `cron/scholarship-batches`,
   `session-requests/[id]/approve`, `earnings/page.tsx`). Deliberate scope discipline; they remain
   a source of potential drift and are the natural follow-up.

## Testing

33 unit tests across the two pure modules: every skip reason, every payment-method branch, the
attendee-count branches, diff detection (including a split that moves while the total holds
steady), sub-cent float noise, and the no-op invariant.
