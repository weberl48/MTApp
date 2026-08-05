# Mobile Experience Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Below `lg` (1024px) the dashboard becomes phone-native — bottom tab bar + More sheet + slim header, and card lists instead of sideways-scrolling tables — with desktop rendering byte-identical.

**Architecture:** Two switching seams (spec `2026-08-05-mobile-experience-design.md`): the shell switches by CSS (`lg:hidden` / `hidden lg:*`, tiny fixed components), list content switches by a `useIsMobile()` matchMedia hook so exactly one variant is in the DOM. No route, query, handler, or permission changes anywhere.

**Tech Stack:** Next 16 / React 19, Tailwind 4 tokens (DESIGN.md is law), shadcn/vaul/Radix, Vitest, Playwright.

## Global Constraints

- Theme tokens only — zero Tailwind palette classes (`gray-*`, `blue-*`, …); grep gate per file.
- Money rule: green=received/paid · amber=pending · ink=neutral · info=config-state.
- Motion: `duration-[var(--motion-*)]`, entrances ease-out/exits ease-in; reduced-motion collapse governs.
- `data-tour` attributes: never rename/remove existing ones; new ones listed per task must match exactly.
- Desktop (`lg+`) rendering must remain byte-identical on every touched page.
- Gates per batch (not per task): `npx tsc --noEmit` · `npm run test -- --run` (all green) · `npm run lint` (88 warnings / 0 errors baseline) · walkthrough audits ×3 audiences desktop AND `VIEWPORT=mobile` · e2e `--retries=1` exit 0 (known contention-flaky session-creation specs pass in isolation) · S20+ sweep (412×915) diffed against `s20-sweep/` captures.
- Agents: never `git stash`/`checkout`/`reset`; no commits (orchestrator commits per batch); local env only.

---

## Batch 1 — Shell

### Task 1.1: `useIsMobile` hook

**Files:** Create `src/lib/hooks/use-is-mobile.ts` + `src/lib/hooks/use-is-mobile.test.ts`
**Interfaces:** Produces `useIsMobile(): boolean` — true below 1024px; SSR/first-render returns false (callers are skeleton-first, no flash). Pattern: `useSyncExternalStore` over `matchMedia('(max-width: 1023px)')` exactly like `src/components/pwa/install-prompt.tsx`.

- [ ] Test first (jsdom `matchMedia` mock asserting subscribe/getSnapshot wiring and 1023px query string), run to fail, implement, run to pass:

```ts
// use-is-mobile.ts
'use client'
import { useSyncExternalStore } from 'react'
const QUERY = '(max-width: 1023px)'
function subscribe(cb: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}
const getSnapshot = () => window.matchMedia(QUERY).matches
const getServerSnapshot = () => false
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
```

### Task 1.2: Tab bar

**Files:** Create `src/components/mobile/tab-bar.tsx` + `tab-bar.test.tsx`; Modify `src/app/(dashboard)/layout.tsx` (render `<MobileTabBar/>` after `<main>`; padding change in Task 1.5)
**Interfaces:** Consumes `useOrganization()` (`can`, `isContractor`, `feature`), `usePathname`, `QuickLogDrawer`. Produces: a `<nav aria-label="Primary" data-tour="mobile-tab-bar">` fixed bottom (`lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]`), five slots:

- Home `/dashboard/` (LayoutDashboard), Sessions `/sessions/` (Calendar) — everyone.
- Center action: raised `-mt-3 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg` button, `data-tour="quick-session-fab"` (REUSES the retired FAB's tour id so the log-session tour keeps working), `aria-label="Log new session"`; contractors open `<QuickLogDrawer>`, others `router.push('/sessions/new/')` — port the exact role logic from `quick-session-fab.tsx` (no route-scoping needed; the bar is global).
- Billing `/invoices/` (FileText) when `can('session:view-all')`; else Earnings `/earnings/` (DollarSign) when `isContractor`.
- More: button (`data-tour="tab-more"`, Menu icon) → dispatches `window.dispatchEvent(new CustomEvent('mca:open-more-sheet'))`.
- Tabs are real `<Link>` anchors (so existing tour selectors `nav a[href="/sessions/"]` still match on mobile). Active = pathname.startsWith(href): `text-primary`; inactive `text-muted-foreground`. Label `text-xs`.
- Keyboard-hide: `visualViewport` resize listener sets hidden when `window.visualViewport.height < window.innerHeight - 150`; listener attached only when the bar is mounted (it's `lg:hidden`, CSS handles desktop).
- [ ] Test: role filtering (contractor sees Earnings not Billing; contractor center action opens drawer state; staff center action = link push) — mock `useOrganization` like `sidebar`'s tests if any exist, else RTL with a context wrapper. Fail → implement → pass.

### Task 1.3: More sheet

**Files:** Create `src/components/mobile/more-sheet.tsx`; Modify `src/components/help/ai-chat-bubble.tsx` (trigger becomes `hidden lg:flex` — bubble desktop-only)
**Interfaces:** Listens for `mca:open-more-sheet`; vaul `Drawer` (import pattern from `quick-log-drawer.tsx`). Items as `<nav aria-label="More navigation">` of `<Link>` rows (icon + label, `p-3 rounded-md hover:bg-muted text-foreground`), role-filtered with the SAME predicates as `sidebar.tsx:173-185`: Clients (`session:view-all`), Team (`team:view`), Analytics (`analytics:view`), Payroll `/payments/` (`payments:view`), Settings `/settings/` (everyone — page self-gates tabs), Help (everyone). Below a `border-t`: "Ask the AI helper" button (Sparkles) that closes the sheet and opens the same AI chat Sheet the bubble uses — extract the bubble's Sheet into a shared `AiChatSheet({open,onOpenChange})` inside `ai-chat-bubble.tsx` and export it; More sheet renders it. Dev-only Client Portal preview link when the header shows it (`showDevOnlyTools` condition — copy from `header.tsx`). Each row closes the sheet on navigate.

### Task 1.4: Slim mobile header + avatar-menu consolidation

**Files:** Modify `src/components/layout/header.tsx`, `src/components/layout/sidebar.tsx`
- Header below `lg`: show route title (map: `/dashboard/`→"Dashboard", `/sessions`→"Sessions", `/invoices`→"Invoices", `/clients`→"Clients", `/team`→"Team", `/payments`→"Payroll", `/analytics`→"Analytics", `/settings`→"Settings", `/earnings`→"Earnings", `/help`→"Help"; longest-prefix match; fallback "MCA") as `text-base font-semibold`; right side avatar menu only. Wrap the org-switcher, View As, Client Portal, dev badge, and Appearance triggers in `hidden lg:flex` (desktop unchanged).
- Avatar `DropdownMenu` gains mobile-only sections (`lg:hidden`): Appearance (opens existing appearance popover content as a submenu or dialog — reuse `appearance-menu.tsx`'s content component), View As (submenu mirroring the header switcher's items), Organization name (switcher when multi-org), Client Portal (dev-only). When View As is active, avatar gets `ring-2 ring-warning` so simulation stays visible.
- Sidebar: delete the mobile drawer/backdrop/hamburger code paths (component becomes `hidden lg:flex` desktop-only; remove `mobileMenuOpen` state, focus trap, dialog semantics — they move to history). KEEP all `data-tour` attrs on desktop nav links.

### Task 1.5: Layout padding, bulk-bar position, FAB retirement

**Files:** Modify `src/app/(dashboard)/layout.tsx` (main padding → `pb-[calc(env(safe-area-inset-bottom)+6rem)] lg:pb-6`, comment updated: tab bar 4rem + breathing); delete `src/components/layout/quick-session-fab.tsx` and its render site in layout; Modify `src/app/(dashboard)/sessions/page.tsx` + `src/app/(dashboard)/invoices/page.tsx` bulk bars: `sticky top-0 lg:top-0` → mobile bottom: wrap class as `sticky bottom-24 lg:bottom-auto lg:top-0` (verify visually; keep entrance classes).

### Task 1.6: Walkthrough provider mobileNav + tour selector updates

**Files:** Modify `src/components/walkthroughs/walkthrough-provider.tsx`, `src/components/walkthroughs/walkthroughs/index.ts`
- Provider: find the `mobileNav` handling (it currently opens the sidebar drawer). Replace: if the step's element isn't visible on mobile, dispatch `mca:open-more-sheet` and retry the poll (the tab-bar links need no opening). Remove drawer-specific code.
- index.ts: steps targeting `nav a[href="/clients/"]`, `/team/`, `/analytics/`, `/payments/` still match inside the More sheet's `<nav>` once it opens (provider handles opening). Verify each `mobileNav: true` step's selector exists in EITHER the tab bar or More sheet; adjust any that referenced the hamburger/drawer explicitly.

### Task 1.7: E2E + help copy for the shell

**Files:** Modify `tests/e2e/navigation.spec.ts` ("mobile viewport shows hamburger menu" → asserts tab bar visible at 375px on /login is N/A — that spec tests login; find the dashboard mobile-nav assertions and re-point to `nav[aria-label="Primary"]`); Create `tests/e2e/mobile-shell.spec.ts` (viewport 412×915, login, assert tab bar visible, tap Sessions tab → URL /sessions/, More opens sheet with Settings link, center + opens drawer for contractor creds if available else link for owner); Modify `src/app/(dashboard)/help/_data/articles/getting-started.ts` navigation description (mention bottom tabs on phones; keywords already cover navigation).

**Batch 1 gate + commit** (orchestrator): full gates per Global Constraints; commit `feat(mobile): app shell — bottom tabs, More sheet, slim header`.

---

## Batch 2 — Billing lists

### Task 2.1: `MobileListItem` primitive + card skeleton

**Files:** Create `src/components/mobile/list-item.tsx` + `list-item.test.tsx`; Modify `src/components/ui/skeleton.tsx` (add `SkeletonCardList` — 4 cards of 3 lines using existing `bg-skeleton` idiom)
**Interfaces (canonical — later tasks consume exactly this):**

```tsx
interface MobileListItemProps {
  title: ReactNode; trailing?: ReactNode; meta?: ReactNode; footer?: ReactNode;
  href?: string; checkbox?: { checked: boolean; onChange: (c: boolean) => void; label: string };
  className?: string
}
export function MobileListItem(props: MobileListItemProps)
```

Render: `div.bg-card.border.border-border.rounded-lg.p-3.space-y-1.5` (radius/token rules); row 1 = optional `Checkbox` (inline, `mr-2`, aria-label from `checkbox.label`) + `font-medium text-foreground truncate` title + `ml-auto font-semibold tabular-nums` trailing; row 2 meta (`text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 items-center`); row 3 footer (`flex items-center gap-2 pt-1`). If `href` and no footer interception, whole card wraps in `<Link>`; with footer, title row wraps in Link instead. RTL test: renders slots, checkbox change fires, link present.

### Task 2.2: Invoices mobile cards + filters sheet

**Files:** Modify `src/app/(dashboard)/invoices/page.tsx`
- `useIsMobile()`; when true, `InvoiceTable` renders cards instead of `<Table>` (branch INSIDE the existing component where rows map — same data, same handlers):

```tsx
<MobileListItem
  key={invoice.id}
  checkbox={isAdmin ? { checked: selectedIds.has(invoice.id), onChange: () => toggleSelect(invoice.id), label: `Select invoice for ${invoice.client?.name}` } : undefined}
  href={`/invoices/${invoice.id}/`}
  title={invoice.client?.name ?? 'Unknown client'}
  trailing={formatCurrency(invoice.amount)}
  meta={<>
    <span>{invoice.session?.service_type?.name ?? invoiceTypeLabel}</span>
    <span>{format(parseLocalDate(...), 'MMM d, yyyy')}</span>
    <Badge variant="outline">{paymentMethodLabels[invoice.payment_method] ?? invoice.payment_method}</Badge>
  </>}
  footer={<>
    <Badge className={invoiceStatusColors[displayStatus]}>{invoiceStatusLabels[displayStatus]}</Badge>
    {/* existing inline Mark Paid button + <InvoiceActions/> exactly as the table row renders them */}
  </>}
/>
```

(Use the file's existing variables — `displayStatus` naming per current row logic; date one line.)
- Filters: on mobile, the method `Select` + sort `Select` collapse behind one outline "Filters" button (SlidersHorizontal icon) opening a vaul sheet containing those SAME two selects (move the elements, don't duplicate state). Desktop keeps them inline in CardHeader.
- Status tabs stay (chips scroll with existing fade cue).
- Scholarship tab: generate-group cards already card-shaped — verify at 412px, fix any fixed-width offenders only.

### Task 2.3: Batch-2 e2e + sweep prep

**Files:** Modify `tests/e2e/mobile-shell.spec.ts` — add: owner at 412×915 opens /invoices/, asserts for the first card: amount text visible, status badge visible, a "Mark Paid" button visible, and `document.documentElement.scrollWidth === clientWidth` (no sideways scroll).

**Batch 2 gate + commit:** `feat(mobile): invoices as cards with thumb-zone actions`.

---

## Batch 3 — People/money lists (all follow Task 2.2's branch-inside-component pattern with `useIsMobile` + `MobileListItem`; same-handler rule everywhere)

### Task 3.1: Team list
**Files:** Modify `src/app/(dashboard)/team/page.tsx` — card: title=name + `<Badge>{roleLabels[member.role]}</Badge>`, meta=email, owner-only (`can('team:view-rates')`) second meta line `Earned {…} · <span class="text-warning">Pending {…}</span>` (existing computed values), href=team detail. Stat cards grid → `grid-cols-2 gap-4 lg:grid-cols-4`.

### Task 3.2: Payroll hub + payment history + reconciliation
**Files:** Modify `src/components/tables/payroll-hub-table.tsx` (contractor cards: name, `text-warning` pending total, `{n} sessions` meta; expand button toggles existing session detail rows as stacked `bg-muted/50` cards; Mark Paid button → existing dialog), `src/components/tables/contractor-payments-table.tsx` (cards: contractor, `text-success` paid amount, date meta), `src/components/tables/payment-reconciliation-table.tsx` (cards: client + amount, status badge via its `STATUS_CONFIG`, Square-linked `text-info` check when present; summary tiles → `grid-cols-2`). `src/app/(dashboard)/payments/page.tsx` stat grid → `grid-cols-2 lg:grid-cols-4`.

### Task 3.3: Audit log + clients
**Files:** Modify `src/components/tables/audit-log-table.tsx` (cards: `<Badge className={ACTION_COLORS[log.action]}>` + table/record summary line + `user_email` + relative time meta; existing diff dialog opens from card tap), `src/components/clients/clients-table.tsx` (cards: name title, method/billing badges meta, portal chip when active, href=client detail; search input stays above list).

**Batch 3 gate + commit:** `feat(mobile): team, payroll, reconciliation, audit, clients as cards`.

---

## Batch 4 — Residue

### Task 4.1: Dashboard + sessions gutter integration
**Files:** Modify `src/components/dashboard/pending-approvals.tsx` + `src/app/(dashboard)/sessions/page.tsx` — replace the reserved `w-4` gutter with checkbox-inline-in-title-row on mobile only (`useIsMobile` OR CSS: gutter div `hidden lg:block` + inline checkbox `lg:hidden` beside title). Keep row exit/entrances.

### Task 4.2: Stat labels + 2FA banner
**Files:** Modify `src/app/(dashboard)/dashboard/page.tsx` (stat titles get `whitespace-nowrap text-xs sm:text-sm` short labels: "Sessions", "Clients", "Approved (30d)", "Pending Invoices" via mobile-conditional label strings), `src/components/guards/mfa-enforcement-guard.tsx` (banner text `line-clamp-1 sm:line-clamp-none` + shorter mobile copy "Add two-factor authentication." with same button).

### Task 4.3: Final S20+ sweep + fixes
Re-run the 412×915 sweep across owner+contractor routes; fix any remaining clipped/wrapped/overlapping element found (token rules apply); attach before/after shots to the report.

**Batch 4 gate + commit:** `polish(mobile): dashboard density, banner, final S20+ sweep fixes`.

---

## Post-plan

Push `main`, watch `Build and Deploy to Vercel` + `Tests` (unpiped exit codes), probe prod for a tab-bar-only selector (`nav[aria-label="Primary"]` markup in the served dashboard HTML is auth-gated — instead grep the built JS chunk list for `mca:open-more-sheet`), update `ui-polish-campaign` memory + spec status line.
