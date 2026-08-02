# MCA App — UI/UX Audit & Improvement Plan (July 2026)

Audit method: live walkthrough of the running app (localhost, prod data) at 1440×900 and 390×844,
light + dark mode, all main routes (Dashboard, Sessions, Invoices, Payroll, Clients, Analytics,
Team, Settings, Session form), plus accessibility-tree inspection of interactive rows and the
mobile header. Findings are ranked by user impact. Items marked **[SHIPPED]** were implemented
as part of this audit; the rest are recommended follow-ups.

---

## P1 — High-impact friction

### 1. Dashboard stats: orphaned 5th card and duplicated fact **[SHIPPED]**
**Problem.** Admins get 5 stat cards in a 4-column grid — "Pending Amount" sits alone on a
second row. Worse, "Pending Invoices" (114) and "Pending Amount" ($12,105.00) are the same
fact split across two cards; on mobile they stack into ~3 screens of stats before any
actionable content.
**Fix.** Merged into one "Pending Invoices" card: count as the big number, dollar total as the
sublabel. Grid is now a clean 4-up on desktop / 2×2 on mobile. All stat cards got `h-full` so
row heights align regardless of sublabels.
Files: `src/app/(dashboard)/dashboard/page.tsx`

### 2. Most urgent work renders last on the dashboard **[SHIPPED]**
**Problem.** Action-center order was MissingRates → PendingApprovals → UnbilledScholarship →
UnsentInvoices → OverdueInvoices. Overdue money (red, most urgent) was the *last* card, below
two scroll wells; a rate-configuration warning was first.
**Fix.** Reordered by urgency: **Overdue → Pending Approvals → Unsent Invoices → Unbilled
Scholarship → Missing Rates**.
Files: `src/app/(dashboard)/dashboard/page.tsx`

### 3. A wall of identical primary buttons **[SHIPPED — de-emphasis]**
**Problem.** Every submitted session row renders a filled-blue "Approve" (20 on the dashboard
card, 43 on the sessions list). When everything is primary, nothing is: the bulk
"Approve (N)" action and the page CTA drown in repetition, and misclick risk on approve is
non-trivial.
**Fix (conservative).** Row-level Approve is now a quiet outline button with a check icon;
the filled primary style is reserved for the bulk "Approve (N)" and page-level CTAs. Revise
buttons bumped from `text-amber-600` to `text-amber-700` (contrast on white was borderline).
**Recommended next.** Hide row actions behind hover on desktop, or drop per-row buttons and
lean fully on selection + bulk bar (matches the existing "Select all submitted" affordance).
Files: `src/components/dashboard/pending-approvals.tsx`, `src/app/(dashboard)/sessions/page.tsx`

### 4. Nested 420px scroll wells bury the queue
**Problem.** Pending Approvals packs ~2,500px of content into a 420px inner scroll area; with
the page scrollbar and a second card's well, three scrollbars coexist in one view. Scroll-
within-scroll is especially hostile on touch (PWA is a primary surface).
**Recommendation (not implemented — recent deliberate change, needs product buy-in).** Render
the first 5 rows statically + a "View all N →" footer link to the pre-filtered list page
(`/sessions/?status=submitted`, `/invoices/`). Kills the inner scrollbars, keeps the dashboard
scannable, and pushes heavy triage to pages built for it.

### 5. Sort dropdown clips its own label **[SHIPPED]**
**Problem.** Sessions sort trigger is `w-[160px]`; with the icon, "Date (Newest)" renders as
"Date (Newes" — looks broken on every visit.
**Fix.** Widened to `w-[190px]`.
Files: `src/app/(dashboard)/sessions/page.tsx`

### 6. Invoice status vocabulary is inconsistent **[SHIPPED — casing]**
**Problem.** The same state is "Pending Review" (summary card), "pending" (lowercase badge),
"Unsent" (dashboard card title) across pages; session badges are capitalized, invoice badges
lowercase.
**Fix.** Added `invoiceStatusLabels` to the display constants and applied it everywhere raw
status strings were rendered (invoices list, invoice detail, team detail, client detail).
**Recommended next.** Standardize on one noun set in copy: *Draft/Unsent → Sent → Paid* (+
*Overdue* as a derived state), and align the summary-card titles with the tab names.
Files: `src/lib/constants/display.ts`, `src/app/(dashboard)/invoices/page.tsx`,
`src/app/(dashboard)/invoices/[id]/page.tsx`, `src/app/(dashboard)/team/[id]/page.tsx`,
`src/app/(dashboard)/clients/[id]/page.tsx`

---

## P2 — Consistency & clarity

### 7. Two different stat-card design languages **[SHIPPED]**
Clients page used tinted icon-in-circle tiles (number left-bottom) while Dashboard / Team /
Payroll / Invoices use the standard shadcn pattern (muted title top, icon right, bold number).
Aligned the Clients tiles to the standard pattern (kept the amber accent for the
"Missing Contact Info" card as a status signal).
Files: `src/app/(dashboard)/clients/page.tsx`

### 8. Page identity: Payroll vs Contractor Payments **[SHIPPED]**
Sidebar says **Payroll**, the page h1 said **Contractor Payments**, the first tab says
**Payroll Hub**. Renamed the h1 to "Payroll" (subtitle unchanged) so navigation label and page
title match.
Files: `src/app/(dashboard)/payments/page.tsx`

### 9. Copy fixes **[SHIPPED]**
- "12 sessions across 6 clients/months" → "12 sessions ready to invoice · 6 invoices to
  generate" (`unbilled-sessions.tsx`).
- Button labeled "Team > Rates" (a breadcrumb inside a button) → "Set Rates"
  (`missing-rates.tsx`).
- Orphaned "$60" under the service-type select (bare `getPricingDescription()` output) →
  prefixed "Rate: " at the call site (`session-form.tsx`).
- "(Select invoices for bulk actions)" parenthetical → "Select rows to send or update in
  bulk" (`invoices/page.tsx`).

### 10. Destructive action prominence **[SHIPPED — softened]**
Every client row showed an always-red trash button at equal visual rank with Edit. Softened to
muted-gray that turns red on hover/focus, and added an `aria-label` (it was icon-only with no
accessible name). A confirmation dialog already existed (good).
**Recommended next.** Move Delete into a per-row "…" menu (pattern already used on Team page).
Files: `src/components/clients/client-actions.tsx`

### 11. Icon-only header controls lack accessible names **[SHIPPED]**
On mobile the org-switcher and View-As triggers collapse to bare icons with no `aria-label`
(their text is `hidden sm:inline`). Added labels. (Hamburger and Quick-Log FAB were already
labeled.) Also made the dashboard/sessions row checkboxes announce *which* session they select
instead of a generic "Select session".
Files: `src/components/layout/header.tsx`, `src/components/dashboard/pending-approvals.tsx`,
`src/app/(dashboard)/sessions/page.tsx`

---

## P3 — Recommended next (not implemented)

### 12. Session rows are links wrapping buttons and checkboxes
`<Link>` wraps each row including its Checkbox and Approve/Revise buttons (interactive inside
interactive: invalid HTML, confusing for AT/keyboard users; currently patched with
`preventDefault` wrappers). Restructure so the row container is a `div` and only the
title/meta area is the link — or make the row clickable via a stretched pseudo-link with
actions outside the anchor.

### 13. Analytics "Revenue Overview" chart misleads
A single month of revenue (Feb) renders as a smooth bell curve spanning Jan–Apr — bezier
smoothing fabricates values for empty months, and the two overlapping areas (revenue vs MCA
earnings) have **no legend**. Use step/linear interpolation (or bars for sparse monthly data),
add a legend, and use round y-axis ticks (the current $3,500 increments read oddly).

### 14. Mobile navigation depth
Everything on mobile is behind the hamburger; consider a 4-item bottom tab bar
(Dashboard / Sessions / Billing / More) for the PWA — session logging and approvals are the
two most frequent tasks and currently cost 2–3 taps.

### 15. Dashboard "Recently Approved" uses `updated_at` as approval proxy
Any edit to an approved session re-counts it as "recently approved". Fine as a heuristic;
worth an `approved_at` column if the number drives decisions.

### 16. Zero-value analytics strip
On the 1st–3rd of a month the strip reads $0.00 / $0.00 / 0 with full visual weight —
consider "No activity yet this month" microcopy, or show month-to-date + last-month side by
side so early-month never looks broken.

### 17. Status color system
Blue = submitted/info, green = approved/paid, amber = pending/warning, red =
overdue/cancelled, purple = scholarship — mostly coherent. Documenting it (and reusing the
card-border accent convention deliberately) would keep future cards consistent.

---

## Verification
- `npm run lint`, `npx tsc --noEmit`, `npm run test -- --run` all pass after changes.
- Re-screenshotted Dashboard (desktop light/dark, mobile), Sessions, Clients, Invoices,
  Payroll after implementation — see session artifacts.
