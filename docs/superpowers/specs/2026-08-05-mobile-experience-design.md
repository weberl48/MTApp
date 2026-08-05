# Mobile Experience Redesign — design spec

**Date:** 2026-08-05 · **Status:** approved (brainstormed with the user; scope and build strategy chosen explicitly)
**Trigger:** on a Galaxy S20+ (412×915 CSS px) the dashboard shows clipped badges, sideways-scrolling
tables with the important columns off-screen, wrapping dates, truncated names, and width-eating
checkbox gutters. Evidence: S20+ screenshot sweep, 2026-08-05 session scratchpad (`s20-sweep/`).
**User decisions:** full mobile app shell (not targeted fixes); phone usage covers ALL four core
jobs (approve/review, log sessions, billing, check-in) — so mobile is a complete second front-end,
not a companion view; build strategy = breakpoint-branched components (Option 1).

## Goals

Below the `lg` (1024px) breakpoint the app presents a phone-native experience: bottom tab
navigation, slim header, card lists instead of tables, thumb-zone actions. Desktop rendering stays
byte-identical. Same routes, same URLs, same data flow, same permission gates.

## Non-goals

- No user-agent sniffing, no separate `/m/` routes, no PWA manifest changes.
- No behavior changes: queries, handlers, dialogs, permission logic untouched.
- No new visual language: everything speaks the existing token system (DESIGN.md is law).
- The client portal is out of scope (separate surface, already simple).

## Architecture

Two switching seams, chosen per Option 1:

1. **Shell — CSS-switched** (hydration-safe, tiny components): the dashboard layout renders both
   the desktop chrome (`hidden lg:flex` sidebar + full header) and the mobile chrome
   (`lg:hidden` tab bar + slim header). Fixed cost: one tab bar + one header row of hidden DOM.
2. **Content — matchMedia-branched**: list pages render EITHER their existing `<Table>` OR a new
   card list, via a shared `useIsMobile()` hook (`matchMedia('(max-width: 1023px)')`,
   `useSyncExternalStore`, same threshold and pattern as `install-prompt.tsx`). List pages are
   skeleton-first client components, so the post-hydration branch never flashes. Exactly one
   variant is in the DOM (a11y, tours, and performance stay honest).

## Components

### 1. `src/components/mobile/tab-bar.tsx` (new)

- Fixed bottom, `lg:hidden`, height 4rem + `env(safe-area-inset-bottom)`, `bg-card` top hairline
  `border-border`, z-40.
- Five slots: **Home** (`/dashboard/`), **Sessions** (`/sessions/`), **center action**,
  **Billing** (`/invoices/`, owner/admin) OR **Earnings** (`/earnings/`, contractor), **More**.
- Active tab: `text-primary`; inactive: `text-muted-foreground`; icon + 11px→`text-xs` label.
  Active state derives from `usePathname()` prefix match.
- **Center action** (raised circular `bg-primary` button, overlapping the bar by ~12px): exactly
  the quick-log FAB's behavior — contractors open `QuickLogDrawer`, staff navigate to
  `/sessions/new/` — reusing its role logic. `QuickSessionFAB` retires (it is mobile-only today;
  the tab bar replaces it, ending bottom-right congestion permanently).
- Hidden while the virtual keyboard is open: a `visualViewport` resize listener toggles the bar
  when viewport height shrinks >150px (guarded, no listener on desktop).
- Each slot carries `data-tour`: `tab-home`, `tab-sessions`, `tab-new`, `tab-billing`,
  `tab-earnings`, `tab-more`.
- Role filtering mirrors the sidebar exactly (context `can()` / `isContractor`).

### 2. `src/components/mobile/more-sheet.tsx` (new)

- vaul drawer (same physics as QuickLogDrawer) opened by the More tab.
- Items (role-filtered like the sidebar): Clients, Team, Analytics, Payroll, Settings, Help,
  **Ask the AI helper** (opens the same AI Sheet the bubble opens today), Client Portal preview
  (dev-only, as in the header today).
- On mobile the AI bubble does not render (`lg:` only); desktop keeps the bubble.

### 3. Slim mobile header

- Below `lg` the header shows: page title (derived from the route via a small map; logo on Home)
  + avatar menu. Hamburger, drawer, and backdrop retire below `lg` (the sidebar component becomes
  desktop-only; its mobile-drawer code path is removed once the tab bar lands).
- Org switcher, View As, Appearance, and the dev role badge move INTO the avatar menu on mobile
  (rendered as menu sections; desktop header unchanged). View As active state still shows: the
  avatar ring takes `ring-warning` when simulating, so the state stays visible without its button.

### 4. `src/components/mobile/list-item.tsx` (new shared primitive)

`MobileListItem`: optional leading checkbox slot (integrated top-left, no reserved gutter),
title + trailing amount row (`tabular-nums`), meta row (badges/subtext), optional footer action
row. Cards are `bg-card border-border rounded-lg` (theme radius), `p-3`, `space-y-1.5`, full-bleed
list with `space-y-2`. Tap target = whole card (Link) unless a footer action intercepts.

### 5. Per-page mobile lists (matchMedia-branched; tables unchanged on desktop)

| Page | Mobile card composition |
|---|---|
| Invoices | title=client · trailing=amount · meta=service, date (one line, `MMM d`), method badge · footer=status badge + Mark Paid/Send + kebab (existing handlers). Status tabs → scrollable chips (existing fade cue); method filter + sort → one "Filters" button opening a sheet. |
| Team | title=name + role badge · meta=email · owner-only inline stats (Earned / Pending, money-rule colors) · tap → detail. |
| Payroll hub | contractor cards: name, pending amount (`text-warning`), session count, expand → session rows; Mark Paid via existing dialog. |
| Payment history / reconciliation | event cards with status-token badges; reconciliation keeps its summary tiles as 2×2 grid. |
| Audit log | action badge + summary + relative time; existing diff sheet unchanged. |
| Clients | name + method badges + portal chip; tap → detail. |
| Sessions list | already card-shaped: integrated corner checkbox replaces the reserved gutter (dashboard pending-approvals too). |

### 6. Layout adjustments

- Main content bottom padding: from the 12rem FAB clearance to `4rem + env(safe-area-inset-bottom)
  + 1rem` below `lg` (desktop `lg:pb-6` unchanged).
- Bulk-action bars: `sticky bottom-[tab-bar-height]` on mobile (thumb zone), sticky-top on desktop.
- Stat grids: `grid-cols-2` on mobile for team and payments (dashboard/earnings already done),
  with short non-wrapping mobile labels where titles wrap today.

## Data flow / error handling

None of the fetch/mutation paths change. Card lists consume the exact state the tables consume.
ErrorState / EmptyState / skeletons are reused; one card-shaped skeleton variant is added to
`ui/skeleton.tsx`. The `useIsMobile` hook is presentation-only and never gates data loading.

## Walkthroughs, tests, help

- Tours: mobile step selectors re-point to `tab-*` / More-sheet items (the provider's `mobileNav`
  flag already exists). `scripts/audit-walkthroughs.mts` runs with `VIEWPORT=mobile` for all three
  audiences in every batch gate, alongside the desktop runs.
- E2E: navigation spec's mobile expectations move from hamburger to tab bar; new mobile-viewport
  smoke spec (Playwright viewport 412×915): dashboard → approve visible; invoices → amount, status,
  and Mark Paid all visible without horizontal scroll; tab navigation works.
- Unit: `useIsMobile` hook test; tab-bar role-filtering test (mirrors sidebar's).
- Help: navigation/getting-started articles gain the tab-bar description; `COVERAGE_MATRIX`
  unchanged (no new routes).

## Rollout (four batches, each gated: tsc · unit · lint 88/0 · walkthrough audits ×3 audiences
desktop AND mobile · e2e · S20+ screenshot sweep diffed against `s20-sweep/`)

1. **Shell**: tab bar, More sheet, slim header, FAB retirement, padding, tour selector updates.
2. **Billing lists**: invoices cards + filters sheet, scholarship tab cards check, bulk bar bottom.
3. **People/money lists**: team, payroll, payment history, reconciliation, audit, clients.
4. **Residue**: dashboard gutter/labels, session-list checkbox integration, 2FA banner one-liner
   on mobile, sweep + fixes from the final S20+ diff.

Each batch is an independently shippable commit on `main`; deploy after the final batch (or
earlier per batch if desired).
