# Product

<!-- impeccable:product-schema 1 -->

<!-- Captured 2026-08-04 during the dashboard UI polish campaign. Init ran
     non-interactively: facts below come from CLAUDE.md, docs/superpowers/specs/,
     and the campaign brief, which pinned the identity-preservation stance.
     Items marked (inferred) were not individually confirmed by the user. -->

## Platform

web

## Users

- **Practice owner** (May Creative Arts' owner runs the business in it): reviews and approves sessions, generates and sends invoices, tracks contractor pay, configures every business rule. Works at a desk but frequently checks in from a phone.
- **Admins**: run day-to-day sessions, clients, and billing. Deliberately excluded from contractor pay, margins, analytics, and payroll unless the owner grants visibility per-flag (`settings.permissions`).
- **Contractor therapists** (music/art therapists): log their own sessions — often on a phone between appointments (PWA, quick-log drawer) — and track their own earnings. They see nothing org-financial.
- **Clients/guardians** reach a separate token-based portal; the portal is client-facing and outside the dashboard theme system.

## Product Purpose

Multi-tenant practice management for creative-arts therapy practices: session tracking with an approval workflow (draft → submitted → approved), invoicing (Square, email, PDF), contractor payroll, scholarship batch billing, and a client portal. Success is the owner running the whole business — billing, payroll, taxes — without spreadsheets, and contractors logging a session in under a minute from a phone.

## Positioning

Every business rule a competitor would hardcode is per-organization configuration: pricing formulas, per-contractor-per-service pay rates, no-show fees, invoice automation, permission grants, custom payment-method lists. The owner customizes the app without code changes. (inferred: this is the repo's own stated design principle, not a user-authored marketing claim)

## Operating Context

- Sessions are logged by contractors (form or mobile quick-log), submitted, then approved by owner/admin; approval can auto-generate and auto-send invoices.
- Monthly scholarship clients batch-invoice at month end; payroll is marked paid in bulk from the Payroll Hub.
- Real deployment is a single small practice today (multi-tenant by architecture); the owner is a hands-on non-developer.
- Guided walkthrough tours (driver.js-style) run over the live UI and **assert the presence of specific highlighted elements per role** — UI changes must keep `scripts/audit-walkthroughs.mts` green for all audiences.
- Help articles are coverage-tested against routes (`integrity.test.ts`); moving or renaming a user-facing control obligates a help-article update.

## Capabilities and Constraints

- Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui (Radix), Supabase with RLS, PWA (no native builds).
- Roles: developer, owner, admin, contractor, centralized in `can()` (`src/lib/auth/permissions.ts`) plus owner-configurable admin grants. **Owner-only money surfaces** (contractor pay, margins, analytics, payroll) are a hard product rule, not a styling choice.
- HIPAA: PHI fields are encrypted at rest; PHI must never appear in logs, client-facing invoice PDFs (only `client_notes` may), or the AI-help org context. This constrains what any UI surface may render or export.
- `trailingSlash: true` — all internal links carry trailing slashes.
- Strict CSP + security headers set in `next.config.ts`.
- Light/dark/system via next-themes; per-user dashboard themes via the theme registry (see DESIGN.md). Org `primary_color`/`secondary_color` are **client-facing branding only** (portal logo badge) and must not leak into the dashboard look.
- Testing: Vitest unit tests colocated under `src/lib/`; Playwright e2e in `tests/e2e/` — the full suite (including data-creating specs) may only run against the local stack.

## Brand Commitments

- The dashboard's identity is the incumbent one: shadcn/ui idioms on a semantic token system with eight user-selectable themes (Classic default). The 2026-08 polish campaign explicitly **refines within this identity — no replacement visual language**.
- Theme tokens are law: color work goes through `themes.css`/`globals.css` tokens only; a fix that only looks right in Classic is a regression in the other seven themes.
- Voice: calm, plain-spoken, professional — it addresses therapists and a small-business owner, not developers. (inferred from existing UI copy and help-article voice)

## Evidence on Hand

- Seeded local environment (~300 sessions, ~260 invoices of realistic fake data) via `scripts/dev-seed/`.
- Screenshot baseline (2026-08-04): every dashboard route × light/dark × desktop/mobile × owner/admin/contractor, in the session scratchpad (`baseline/` + `manifest.json`). Deliberately uncommitted — CI rejects tracked images.
- Walkthrough audit script (`scripts/audit-walkthroughs.mts`) as a per-batch UI regression check.
- No marketing testimonials, benchmarks, or case studies exist; nothing of that kind may be invented.

## Product Principles

1. **The owner configures; code doesn't hardcode.** New behavior should be an organization setting when possible.
2. **Money is owner business.** Pay, margins, and payroll stay behind owner-only gates in every surface, existing or new.
3. **A contractor's phone is a first-class client.** Session logging must stay fast, thumb-reachable, and offline-tolerant.
4. **PHI safety outranks convenience.** No surface renders or transmits PHI beyond its established boundary.
5. **Calm over clever.** This is a therapy practice's daily tool; clarity and restraint beat spectacle. (inferred from the campaign brief's restraint stance)

## Accessibility & Inclusion

- WCAG contrast is mechanically enforced for every theme palette (light and dark) by `src/lib/themes/contrast.test.ts`.
- `prefers-reduced-motion` collapses all animation globally (`globals.css`); any new motion must stay inside that guard.
- 44px minimum touch targets on coarse pointers (already in `globals.css`); keep it true.
