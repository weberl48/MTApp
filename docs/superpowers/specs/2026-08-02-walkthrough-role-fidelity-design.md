# Guided-tour role fidelity — bug report and fix design

**Date:** 2026-08-02
**Scope:** every help-center walkthrough, exercised under every role, including via the header's
"View As" switcher.

## How this was tested

Local stack only (`supabase start` + `npm run dev`, 309 seeded sessions) — the environment that
may break. A Playwright driver logged in, drove the real **View As** menu in the header, started
each tour from the Guided Tours card on `/help/`, and asserted for every step that driver.js
highlighted an element matching the step's own selector (a centred popover where the step declares
an `element` counts as a failure).

| Identity | Tours run | Failing steps |
|---|---|---|
| `dev-owner` (developer), View As **Owner** | 14 | 0 |
| `dev-owner`, View As **Admin** | 7 | 0 |
| `dev-owner`, View As **Contractor** | 3 | **3** |
| `dev-admin` (real admin login) | 7 | 0 |
| `dev-contractor` (real contractor login) | 3 | **1** |

Running the same tours under a *real* contractor and a *simulated* one is what separates the two
bugs: the Earnings steps pass for a real contractor and fail under View As, so that failure belongs
to the simulation, not the tour. The Action Center step fails for both, so it belongs to the tour.

## BUG-1 — the App Overview tour shows contractors an admin-only step

**Severity: high.** App Overview is the first tour in `RECOMMENDED_WALKTHROUGH_ORDER` and the one
the first-run nudge and the owner-onboarding completion toast both offer, so it is the tour a new
contractor is most likely to take.

Step 2 of App Overview ("Action Center") declares
`element: '[data-tour="dashboard-action-center"]'` but carries **no `audience`**, while its
siblings "Clients" and "Invoices" both carry `audience: 'admin'`. The dashboard renders that
container only when `stats.isAdmin` (`src/app/(dashboard)/dashboard/page.tsx:275`), which is
`can(actualRole, 'session:view-all')` — false for every contractor.

A contractor therefore gets a floating popover plus the provider's apology text ("…or your role may
not have access to it"), attached to a description about pending approvals, unsent invoices and
scholarship billing — work a contractor cannot do.

Secondary harm: for a **real** contractor `viewAsActive` is false, so
`logWalkthroughFallback()` fires and writes a `help_events` gap row on every run. The owner's
"Help gaps" card accrues a permanent false positive that no content change can clear.

**Fix:** add `audience: 'admin'` to the step. The contractor's App Overview becomes 5 steps, all
of which already pass.

## BUG-2 — "View As → Contractor" hides the Earnings nav link

**Severity: medium-high.** It breaks the owner's ability to preview what a contractor sees, which
is the workflow the product itself recommends.

`src/components/layout/sidebar.tsx:63` reads

```ts
const isContractor = user?.role === 'contractor'
```

`user.role` is the **actual** role. Every other gate in that component goes through `can()`, which
is bound to the *effective* role. So under View As → Contractor the admin links correctly vanish
while the contractor-only Earnings link never appears. The sidebar shows only Dashboard, Sessions
and Settings — a contractor's sidebar minus Earnings.

Two steps break as a result, both targeting `nav a[href="/earnings/"]`:

- `my-earnings` step 1 "Your Earnings Page"
- `app-overview` step 5 "Earnings" (`audience: 'contractor'`)

This is a bug rather than an accepted limit of the simulation, on three pieces of in-repo evidence:

1. `useWalkthroughAudienceFlags` deliberately makes `isContractor` follow View As, commented "so
   View As shows the same tours the impersonated role would get" — the tours are offered on the
   assumption the nav will match.
2. `dashboard/page.tsx` already simulates faithfully in the other direction
   (`effectiveIsAdmin = isViewingAsContractor ? false : isAdmin`).
3. The Edit-a-Service-Type tour instructs owners: "Use View As mode to confirm contractors see the
   right options." The product tells owners to trust View As as a fidelity tool.

The sidebar is the outlier, and the walkthrough provider already carries a workaround for the
*symptom* — it suppresses gap telemetry whenever View As is active, precisely because
"contractor-only nav the real sidebar hides" produces false gaps. Fixing the cause makes that
suppression unnecessary, though it stays as a correct guard for genuinely absent data.

`src/components/layout/quick-session-fab.tsx:20` repeats the same expression, so an owner viewing
as a contractor gets the admin FAB (a link to the full form) instead of the contractor's quick-log
drawer. Same class, same fix. The tour still highlights there because both branches carry
`data-tour="quick-session-fab"`.

**Fix:** give the effective-contractor test a single home. `OrganizationContext` already computes
`effectiveRole` and already exposes effective `isDeveloper`/`isOwner`/`isAdmin`; it is missing
`isContractor`. Add it, and have the sidebar, the FAB and `useWalkthroughAudienceFlags` all read
it, so the three copies cannot drift again.

## BUG-3 — dead role branches in the sidebar (latent, no behaviour change)

`shouldShowItem` compares `item.href === '/payments'`, `'/analytics'` and `'/team'`, but
`next.config.ts` sets `trailingSlash: true` and every nav item is declared with the slash
(`'/payments/'`). Those three branches never execute. Every `ownerOnly` item falls through to
`can('settings:edit')` and every `adminOnly` item to `can('session:view-all')`.

There is **no behavioural difference today**, because the permission sets coincide exactly:
`payments:view` and `analytics:view` are both `['developer','owner']`, identical to
`settings:edit`; `team:view` is `['developer','owner','admin']`, identical to `session:view-all`.
It is a landmine — the day someone splits one of those permissions, the sidebar silently keeps the
old rule. Worth correcting while editing the same function; flagged as no-op so a reviewer does not
go looking for a behaviour change.

## Explicitly not bugs

- Owner and admin, real and simulated, desktop and mobile: every tour, every step passes.
- An admin whose Action Center is empty also gets the centred popover, because the container is an
  empty zero-height `div` and the provider treats zero-height elements as not visible. The step's
  own description already covers that case ("an empty Action Center means you're caught up"), so
  this is left alone.

## Fix plan

1. `src/contexts/organization-context.tsx` — add effective `isContractor` to the context value and
   its type.
2. `src/components/layout/sidebar.tsx` — consume it; fix the three trailing-slash comparisons.
3. `src/components/layout/quick-session-fab.tsx` — consume it.
4. `src/components/walkthroughs/walkthrough-provider.tsx` — `useWalkthroughAudienceFlags` consumes
   it instead of recomputing.
5. `src/components/walkthroughs/walkthroughs/index.ts` — `audience: 'admin'` on the Action Center
   step.
6. `src/lib/walkthroughs/audience.test.ts` — cover the App Overview contractor step list, so a step
   describing admin-only UI can't be added without an audience again.
7. `scripts/audit-walkthroughs.mts` — add `VIEW_AS=owner|admin|contractor`, driving the header
   switcher, so the contractor tours stop being the harness's "verify by hand" blind spot.

## Verification

Re-run the per-role sweep on the local stack, desktop and mobile, and require zero failing steps
for all five identities in the table above; plus `npm run test`, `npx tsc --noEmit`, `npm run lint`.

### Results after the fix (2026-08-02, local stack)

| Identity | Tours | Failing steps |
|---|---|---|
| View As **Owner** (desktop) | 14 | 0 |
| View As **Admin** (desktop) | 7 | 0 |
| View As **Contractor** (desktop) | 3 | 0 |
| real `dev-contractor` (desktop) | 3 | 0 |
| View As all three (mobile, 390×844) | 24 | 0 |

App Overview is now 5 steps for a contractor (Action Center dropped) and 7 for admin/owner, and
`nav a[href="/earnings/"]` highlights under View As exactly as it does for a real contractor.

`npm run test` — 533 passed / 58 files. `npx tsc --noEmit` — clean. `npm run lint` — no new errors.

**Testing note worth keeping:** the audit driver imports the tour definitions at process start while
the browser picks up edits over HMR, so editing tour or provider source *during* a run silently
shifts every expectation by the changed step and reports a wall of false failures. Finish the edits,
then run.
