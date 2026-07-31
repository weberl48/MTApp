# Dev-DB scenario dataset

A full production-shaped dataset for the **local** experiment stack, sized to exercise every scenario the app and test suites cover.

`gzrukevymmguqxuoynqk` was this dataset's original home as MCA-Dev. It is now **cert** — a mirror of production holding real PHI — so seeding synthetic rows into it would corrupt the dataset cert exists to provide. `apply.mjs` refuses it outright (`mca_cert.marker`) and refuses production too.

## Quick start

```bash
node scripts/local-env/bootstrap.mjs   # first: schema + base rows this dataset assumes
node scripts/dev-seed/apply.mjs        # regenerates dev-seed.sql, then applies to LOCAL
node scripts/dev-seed/apply.mjs --cloud  # legacy cloud path (still refuses cert + prod)
```

**This dataset does not stand alone.** `generate.mjs` hard-codes the organization, both dev users, seven service types and four clients by UUID and assumes they already exist; `scripts/local-env/base-seed.mjs` creates them. Change an id in one file and you must change it in the other.

(`generate.mjs` can also be run alone to inspect `dev-seed.sql` — the file is generated output and not committed.)

Idempotent: every seeded row uses the `dd5eed00-` UUID prefix and is deleted before re-insert. The original minimal seed (org, the two dev users, service types, the four `Test *` clients and their sessions) is never touched — this dataset layers on top of it.

To remove the dataset entirely, run just the `-- CHUNK delete previous seed` section of `dev-seed.sql`.

## What it covers

Reference date **2026-07-29** (fixed in `generate.mjs` — bump it to move the dataset forward in time, then re-apply). Sessions span Jan 2025 → Aug 2026.

| Area | Scenarios |
|---|---|
| Clients (12 new) | Every payment method (private_pay, self_directed, group_home, scholarship, venmo), every billing method (square, check, email, other), monthly vs per-session billing, Square-fee opt-in (`Sam Rivera`), no email on file (`Willow House`), zero-history client (`Jamie Ortiz`) |
| Sessions (~300) | All statuses: approved (bulk), submitted, draft, cancelled (some with rejection reasons), no_show ($60 fee + normal contractor pay); durations 30/45/60/90; staff `notes` + client-visible `client_notes`; a few owner-run sessions; future sessions for reminder flows |
| Groups | Facility groups (headcount, member names, classroom) invoiced to the group home; a 4-attendee `Music Expressions Group` with per-attendee invoice splits |
| Payroll | Paid history across two tax years, paid on the 5th of the following month — **December 2025 work paid January 2026** exercises the cash-basis year boundary; two paid-amount overrides; ~30 unpaid rows (~$1.5k) live in the Payroll Hub |
| Invoices (~260) | pending / sent / paid; overdue (past `due_date`, `reminder_sent_days` `[7,1]` and `[7]`); Square sandbox IDs + payment URLs on square-billed clients; `apply_square_fee` snapshot; negative-margin rows (MCA absorbs) |
| Batches | Scholarship + monthly clients batched per month (`invoice_type='batch'`, `billing_period='YYYY-MM'`, line items): ≤ Apr 2026 paid, May sent (overdue), Jun pending, **Jul left unbatched** as material for "Generate All" |
| Goals | active / met / not_met |
| Session requests | pending ×2, approved (linked `created_session_id`), declined |

## Regenerating

`generate.mjs` is fully deterministic (no randomness, fixed reference date): the same inputs always produce the same `dev-seed.sql`, and reruns of `apply.mjs` converge to the same DB state. Edit the scenario tables in `generate.mjs` (clients, monthly patterns, status/paid rules) and rerun both commands.

Verified 2026-07-29: applied cleanly, coherence checks pass (no orphan sessions, batch headers = sum of items), and the full Playwright suite is green against it (45/45, `--workers=1`).
