# P0: Sessions submitted from `draft` are never invoiced

**Status:** Open — confirmed in production
**Found:** 2026-07-29 (hardening audit)
**Severity:** P0 — unbilled work with no in-app recovery path
**Area:** session form (edit path) · invoice creation

## Summary

An invoice is created **only** when a session is first created with status `submitted`/`approved`.
Any path that arrives at `submitted` by *updating* an existing session — saving a draft and
submitting it later, or fixing a session after "Request Revision" — leaves the session billable but
with **no invoice, ever**. There is no manual invoice-creation UI, so the work cannot be billed
without direct SQL.

## Verified production impact

Measured 2026-07-29 against the live database (read-only).

| | |
|---|---|
| Sessions currently affected | **1** (`2f95f41a-a76f-4638-b8f5-646f76f6c970`, 2026-02-09) |
| Value never billed | **$90**, unbilled since 2026-03-18 (4+ months) |
| Times the revision flow has been used | 11 |
| Of those, sessions later deleted outright | 10 (no billing impact) |
| Of those, sessions resubmitted | **1 — hit the bug (100%)** |
| Sessions in `draft` right now (future exposure) | 0 |

The realized loss is small **only because the resubmit path has been used once**. Every future use
of it loses money, and "Save as draft" is a prominent radio option on the session form
(`session-form.tsx:1154`).

### Correction to an earlier reading

A first pass counted "7 sessions / $450 unbilled" by querying sessions with no invoice row. That was
wrong: **6 of those 7 are scholarship clients, which `createNewSession` skips deliberately**
(`create-session.ts:107-108`) because they bill through the monthly batch. Only the one
`group_home`, `per_session` client above is this bug. See "Separate finding" below for what the
other 6 actually mean.

## Mechanism

Invoice creation lives in exactly one place for per-session billing —
`src/lib/session-form/create-session.ts:135` — behind a status gate at line 97:

```ts
if (!isScholarshipService && (status === 'submitted' || status === 'approved')) {
```

`createNewSession()` runs **only** on the create branch of the form (`session-form.tsx:588`). The
edit branch (`session-form.tsx:476-586`) updates `sessions.status` and can *update* linked
invoices, but the regeneration block is guarded on invoices already existing
(`session-form.tsx:525`):

```ts
if (regenerateInvoice && linkedInvoices.length > 0 && pricing) {
```

With zero linked invoices there is nothing to update and nothing creates one. Confirmed by search:
only three `invoices` INSERT sites exist in `src/`, and the other two are scholarship-batch paths
(`scholarship-invoices.ts:217`, `cron/scholarship-batches/route.ts:206`).

The revision loop makes it worse. `rejectSession()` (`src/app/actions/sessions.ts:288`) deletes the
pending invoice and reverts the session to `draft`:

```ts
const { error: invoicesError } = await deletePendingSessionInvoices(supabase, sessionId)
// ... then: .update({ status: 'draft', rejection_reason: reason })
```

So a correctly-invoiced session **loses** its invoice on revision request and never regains one.

## Proof (audit trail, not code reading)

`audit_logs` for session `2f95f41a…` — the mechanism end-to-end in durable data:

| Time (UTC) | Table | Action | Status change |
|---|---|---|---|
| 2026-03-08 15:21:30 | sessions | INSERT | → `submitted` |
| 2026-03-08 15:21:31 | invoices | INSERT | → `pending` ✅ invoice created |
| 2026-03-08 15:23:04 | invoices | **DELETE** | `pending` → — |
| 2026-03-08 15:23:04 | sessions | UPDATE | `submitted` → `draft` ← *Request Revision* |
| 2026-03-18 01:13:40 | sessions | UPDATE | `draft` → `submitted` ← *resubmitted* |
| — | — | — | **no invoice INSERT, ever** |

The two 15:23:04 rows 0.3s apart are the `rejectSession` sequence. Ten days later the session was
resubmitted and no invoice followed.

## Reproduce

1. Log a session for a per-session-billed client; choose **Save as draft**.
2. Reopen it, switch to **Submit for approval**, save.
3. Session is `submitted`; the invoices list shows nothing for it.

Or via the revision loop: submit normally (invoice appears) → **Request Revision** (invoice is
deleted) → contractor edits and resubmits → no invoice.

## The promise the UI already makes

The delete-invoice dialog (`src/components/forms/invoice-actions.tsx:236`) tells users:

> "The session(s) behind it are kept and marked un-billed, so you can re-invoice them later."

Re-invoicing is not possible anywhere in the app. Whatever fix is chosen should make this true or
change the copy.

## Detection query

Finds genuinely-affected sessions, excluding scholarship/monthly clients that are batch-billed by
design:

```sql
SELECT s.id, s.date, s.status, s.total_amount
FROM sessions s
LEFT JOIN invoices i      ON i.session_id = s.id
LEFT JOIN invoice_items ii ON ii.session_id = s.id
LEFT JOIN service_types st ON st.id = s.service_type_id
WHERE s.status IN ('submitted','approved')
  AND i.id IS NULL AND ii.id IS NULL
  AND coalesce(st.is_scholarship,false) = false
  AND EXISTS (
    SELECT 1 FROM session_attendees sa JOIN clients c ON c.id = sa.client_id
    WHERE sa.session_id = s.id
      AND c.payment_method <> 'scholarship'
      AND c.billing_frequency <> 'monthly'
  );
```

## Fix options

**A — Create the invoice on the status transition (recommended).** Extract the invoice-creation
block from `createNewSession()` into a shared `ensureSessionInvoices(supabase, sessionId, …)` and
call it from the edit branch when the session becomes `submitted`/`approved` and has no existing
invoice. Must be idempotent (check for existing invoices first) so it can't double-bill, and must
preserve the scholarship/monthly skip rules. This makes the delete-dialog's promise true.

**B — Do it server-side.** Move creation into a server action / DB trigger keyed on the
`draft → submitted` transition. More robust (covers any future caller, including the quick-log
drawer and bulk actions), but a trigger duplicates pricing/split logic that currently lives in TS —
significant surface for drift.

**C — Manual "Create invoice" action as a safety net.** Doesn't fix the leak, but gives an in-app
recovery path for sessions already stranded and for any future gap. Cheap; good complement to A.

Recommendation: **A + C**. A closes the leak, C makes the existing stranded session recoverable
without SQL and honors the copy already shown to users.

### Backfill

One session needs an invoice created to be billable. Do this *after* the fix ships, ideally via the
new UI from option C rather than hand-written SQL.

## Separate finding surfaced by the same query

Six **scholarship** sessions ($360 total: 2026-02-03 → 2026-02-25, plus one 2026-06-09) are
correctly invoice-less — they wait for the monthly batch — but they have been waiting since
**February**. Nothing has generated their batch invoices in five months. This is consistent with
the scholarship-cron gaps recorded in `MCA-Hardening-Audit-2026-07-29.md` (finding #8: the cron
misses `billing_frequency='monthly'` clients and omits `due_date`). Worth a look at the invoices
page → Scholarship tab, where they should be listed as unbilled and awaiting "Generate".
