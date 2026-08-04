# Dashboard UI Polish Campaign — ranked backlog (Phase 1 output)

**Date:** 2026-08-04 · **Baseline commit:** 565e7fe (+ c3cf2e1 design context)
**Inputs:** four parallel audit lenses over all dashboard routes — impeccable technical audit (14/20; Theming 2/4 is the drag), impeccable UX critique in Operate mode (29/40; Consistency 2, Error Recovery 2), improve-animations survey (6 implementation plans), find-animation-opportunities (6 proposals, 7 rejections) — plus a taste-pack cross-check (high-end-visual-design / redesign-existing-projects checklists; its 2 misses and 3 pushback verdicts are folded in below). Screenshot baseline: 172 shots (route × light/dark × desktop/mobile × owner/admin/contractor), session scratchpad only — regenerate with the baseline script if needed; never commit screenshots (CI rejects them).
**Companion doc:** `2026-08-04-ui-polish-motion-plans.md` (verbatim motion implementation packets 001–006).
**Rules of engagement:** refinement preserves identity (DESIGN.md is law); behavior changes never ride along; every batch verifies lint + tsc + unit tests + walkthrough audit (all audiences) + Classic and ≥2 alternate themes in both modes.

## Headline diagnosis

The shell is healthy; the drift is systemic and fixable at the token/primitive level:

1. **Token Law is violated at scale in feature code, honored in chrome** — 1,088 hardcoded palette occurrences (547 gray + 541 status hues) across 40+ files. Root causes, in order: no success/warning/info tokens exist; the two canonical status maps (`src/lib/constants/display.ts:5-28`) emit raw palette classes to 7 importing pages; several `ui/` primitives themselves leak gray.
2. **Two documented vocabularies are dead code** — `--chart-1..5` and `--motion-fast/base/slow` have zero consumers. Charts hardcode hex and run recharts' 1500ms default sweep; motion rides library defaults (weak `ease`, 150ms) with drift up to `duration-500`.
3. **Error/empty-state maturity is uneven** — invoices has no fetch-error state at all (infinite skeleton / fake empty list); team detail's "Not provided" pattern is the house standard nobody else follows.
4. **Mobile bottom-right congestion** — up to 4 fixed floating elements stack over content and tap targets on the highest-traffic screens.
5. **Consistency drift** — badge casing, action labels ("Paid" vs "Mark Paid"), money-color semantics, and action-exposure patterns diverge between sibling pages.

---

## P0 — Usability & trust (fix first)

| id | Finding | Where | Fix | Cmd |
|---|---|---|---|---|
| p0-invoices-error-state | Fetch failure → infinite skeleton (`loadInvoices` has no try/catch, so a throw never clears `loading`); separately line ~444 discards the query error → renders as fake empty list. Page also reachable by contractors via URL with no gate | `src/app/(dashboard)/invoices/page.tsx` ~381, ~444 | try/catch/finally + inline error state with Retry (use the shared error pattern from p1-state-pattern); distinguish error from zero rows; add role gate | harden |
| p0-fab-occlusion | AI bubble (`bottom-32`) + quick-log FAB (`bottom-6`) + onboarding FAB + install prompt stack over content: notes textarea (sessions/new), row prices, last-row actions, card stats. Main pad (~6rem) < stack (~11rem). Quick-log FAB renders for owners/admins on non-session pages | `src/components/help/ai-chat-bubble.tsx:25`, `src/components/layout/quick-session-fab.tsx:33,46`, `(dashboard)/layout.tsx:89` | Mobile bottom padding clears the actual stack; scope quick-log FAB to session-relevant routes; single-anchor the AI bubble above it | adapt |
| p0-viewas-contrast | Active View-As button: white on amber-500 ≈ 1.8:1 (needs 4.5:1), no dark variant — constant-use owner control | `src/components/layout/header.tsx:217` | Move to the new `--warning` tokens (p1-status-tokens); verify via contrast test | harden |
| p0-role-contradiction | Profile Account card shows Role text "Contractor" beside "developer" badge | `/settings/profile/` | Render role once from the single source of truth | harden |
| p0-mobile-toolbar-clip | Sessions Filters button clipped off-screen at 390px | `/sessions/` toolbar | Wrap/compress the toolbar row | adapt |
| p0-team-header-collision | "Invite Team Member" overlays the page title at 390px; analytics already does it right (`flex-col gap-3 sm:flex-row`, analytics/page.tsx:226) | `src/app/(dashboard)/team/page.tsx:132` | Adopt the analytics header pattern; sweep other long-action headers | adapt |
| p0-tab-strips-clip | Settings/business + payments tab rows clip on mobile with no scroll affordance | both pages' tab strips | Fade/scroll cue or wrap triggers | adapt |
| p0-a11y-names | ≥6 search inputs placeholder-only (sessions:404, help:198, clients-table:100, client-multi-select:73, audit-log-table:177, contractor-payments-table:233); header Client Portal trigger (:322) + avatar menu (:356) unnamed on mobile; mobile nav drawer has Escape but no dialog role/focus trap (sidebar.tsx:63-71, 226-239) | see refs | `aria-label`s; dialog semantics + focus trap (or Radix Sheet) | harden |
| p0-walkthrough-reduced-motion | Explicit `behavior:'smooth'` beats the global reduced-motion collapse — tours still glide for users who opted out | `walkthrough-provider.tsx:131,152` | Motion plan 006 (matchMedia branch) | — |

## P1 — Consistency & system integrity

### Phase 2 foundation queue (fix once, app-wide — do these before any page batch)

| id | Work | Detail | Cmd |
|---|---|---|---|
| p1-status-tokens | **The unlock.** Add `--success/--warning/--info` (+ `-foreground` and soft/surface variants) to `globals.css` + all 8 `themes.css` blocks + `REQUIRED_THEME_TOKENS` + contrast test; then rewrite `sessionStatusColors`/`invoiceStatusColors` (`src/lib/constants/display.ts:5-28`) to emit token classes — 7 pages inherit instantly. Also fixes p0-viewas-contrast and the walkthrough-note hexes (globals.css:220-225) | 541 status-hue hardcodes trace here | colorize |
| p1-money-semantics | One money-color rule, applied via the new tokens: **green = money received/paid out · amber = pending · ink = neutral figure**. Today green/orange mean different things on ≥6 surfaces | dashboard, session detail/edit, invoice detail, team, payments, earnings | clarify |
| p1-tabular-nums | `tabular-nums` on money/stat cells — zero `font-variant-numeric` usage today, so figures wobble in data columns (invoice amounts, stat cards, price columns, analytics KPIs). One utility on the shared table-cell/stat components; verify it holds across the four theme body fonts (Eight-Theme Proof). Rider on p1-money-semantics | cross-check m1 | typeset |
| p1-motion-001 | Easing tokens (strong `--ease-out`/`--ease-in-out`/`--ease-drawer`) + token-time every overlay primitive; fix Sheet's 500ms ease-in-out entrance | Motion plan 001 | animate |
| p1-charts | Feed recharts `var(--chart-N)` (kill the hex; `--chart-*` currently dead) AND `isAnimationActive={false}` on all 9 series/tooltips (kills 1500ms sweeps re-triggered by range clicks) | Motion plan 002 + audit `charts-bypass-chart-tokens` | colorize |
| p1-motion-003 | Sidebar mobile drawer: directional curves + tokens, always-mounted fading scrim, grid-rows submenu reveal (chevron already animates) | Motion plan 003; run walkthrough audit after (nav is toured) | animate |
| p1-ui-gray-sweep | Gray/blue hardcodes out of shared primitives + shell: `ui/breadcrumb.tsx:15-27`, `ui/empty-state.tsx:19-21`, `ui/password-input.tsx:24`, `ui/color-picker.tsx:78,99`, `ui/skeleton.tsx:32`, dashboard `layout.tsx:48-64` loading/error screens + skip link `:80` (`focus:bg-blue-600`) | tokens: muted/canvas/card/border/primary | polish |
| p1-button-press | `active:scale-[0.98]` + explicit `duration-[var(--motion-fast)] ease-out` on the Button cva base — press feedback for a hover-less PWA; highest-leverage single motion change | `ui/button.tsx:8` | animate |
| p1-state-pattern | Shared empty/error-state pattern: promote team-detail's "Not provided" and a standard inline error+Retry block. Loading policy **(decided via cross-check)**: skeletons (`--skeleton` token, layout-shaped) for page/section content loads; spinners only for in-button/inline pending (today: 11 pages spinner-only, 5 skeleton, no `loading.tsx` anywhere). This also dissolves the reduced-motion frozen-spinner issue on most pages; any surviving spinner needs adjacent text or a `role="status"` label | consumed by p0-invoices-error-state and batches | harden |
| p1-motion-004 | Retire the infinite `animate-bounce` (owner onboarding FAB) → one-shot entrance; install-prompt slide-up entrance; AI bubble missing `transition-shadow` | Motion plan 004 | quieter |

### Page-level consistency (Phase 3 batches)

| id | Finding | Where | Cmd |
|---|---|---|---|
| p1-sessions-tokens | Workhorse list rows: `bg-gray-50 dark:bg-gray-800 … bg-blue-50 dark:bg-blue-950/30`, `text-gray-500` | `sessions/page.tsx:626,607` | polish |
| p1-calendar-seam | Calendar builds its own white/gray surface system + `bg-blue-600` today marker — worst single component across themes | `sessions-calendar.tsx:88-155` | polish |
| p1-session-form-sweep | Largest single-file offender: 105 palette hits | `forms/session-form.tsx` | polish |
| p1-badge-casing | Title Case vs lowercase status/role badges across ≥4 surfaces | one formatter | polish |
| p1-mark-paid-label | "Paid" button (invoices table) vs "Mark Paid" (dashboard, payroll) — reads as status | invoices table | clarify |
| p1-action-exposure | Session detail: 6-button wall incl. loud Delete → keep Approve + Request Revision, rest in "More" (Delete separated). Invoice detail: all actions buried in kebab even when Overdue → expose 1–2 primary | `/sessions/[id]/`, `/invoices/[id]/` | distill / clarify |
| p1-invoices-tabs | 8 tabs mixing status + payment-method + scholarship taxonomies with 3 ad-hoc label colors | `/invoices/` filter bar | clarify |
| p1-contact-card | Client contact card silently empty (no "Not provided"); payment badges mislabeled as contact info | `/clients/[id]/` | clarify |
| p1-copy-fixes | "Changes will be saved immediately" (false, edit/page.tsx:112); "1 sessions" (earnings:256,295); "internal key" jargon (customize). **Toast tone sweep (cross-check m2):** drop `!` and "successfully" filler from 14+ `toast.success` sites (session-form.tsx:610,666; add-client-dialog.tsx:116,141,149; profile-form.tsx:39; mfa-setup.tsx:73; invoice-actions.tsx:107; quick-log-drawer.tsx:168; client-portal-access.tsx:146; client-resources-manager.tsx:154) and the dashboard greeting — the walkthrough-completion toast may keep its celebration beat | see refs | clarify |
| p1-off-scale-type | `text-[10px]/[11px]`, incl. 10px gray-400 ≈2.5:1 in pay-rate-matrix:424,447,608; calendar:140,210,244; client-multi-select:110; appearance-menu:104 | → `text-xs` + `muted-foreground` | typeset |
| p1-save-jitter | 9 save buttons prepend `<Loader2/>` beside the icon → button grows mid-save | settings/profile:165 et al., quick-log-drawer:280 | polish |
| p1-banner-jump | 2FA banner present on core routes, absent on settings — content jumps | banner mount policy | polish |
| p1-save-placement | Settings cards save left; entity forms submit right | pick one | polish |

## P2 — Delight & rhythm (Phase 3, after a batch's P0/P1 items)

| id | Work | Where | Source |
|---|---|---|---|
| p2-reveal-entrances | Bulk bars, filter grid, settings switch-reveals, payments date row: `animate-in fade-in-0 slide-in-from-top-2/1 duration-[var(--motion-fast)] ease-out` (9 sites; **decision: 150ms**, not lens D's 200ms — rapid re-mount tolerance) | Motion plan 005 | C+D |
| p2-pricing-preview | Session form pricing card/earnings strip entrance on first mount; currency values NEVER animate on recalc | session-form.tsx:1073,1105 | D |
| p2-approve-row-exit | Two-phase row removal on approve/reject (grid-rows collapse + opacity, filter on `transitionend`) so the next button doesn't jump under the pointer | pending-approvals.tsx:76,99,258 | D |
| p2-toast-promise | `toast.promise` for mark-paid / send-invoice / generate-batch (207 toast calls, zero use loading→success morph) | invoices, payments | C |
| p2-status-ack | One-shot `zoom-in-95` on the status badge after approve (page recomposes 6 buttons in one frame) | sessions/[id]/page.tsx:322-378 | C |
| p2-wizard-polish | Onboarding wizard progress segments get `transition-colors`; step swaps stop hard-cutting | owner-onboarding-wizard.tsx:105-115 | C |
| p2-generate-card-exit | Scholarship "Generate" card exits with motion so the eye follows to the batch table | invoices/page.tsx:773-860 | C |
| p2-earnings-mobile | Contractor earnings: 2-col stat grid (dashboard pattern) instead of 4 full-width cards | /earnings/ | B |
| p2-dedup | Session count (dashboard strip), email (team rows), category chips+cards (help) each shown twice | see B | B |
| p2-help-ai-affordance | AI helper card looks non-interactive; also the 384px panel hard-cut expand + search swap masking (follow-ups C#10/11) | /help/ | B+C |
| p2-chart-legend | Revenue Overview 2-series chart: add the legend its neighbor has | /analytics/ | B |
| p2-form-grid | sessions/new field grid rhythm + page-title alignment with page grid | /sessions/new/ | B |
| p2-small-polish | Checkbox gutter reservation (sessions rows), red alarm dot on a neutral count (client detail), odd stat card spans full width (mobile dashboard), converge save-as-draft control (radios vs link), mute the 8 red trash icons (settings/business) | see B | B |

## Explicit motion rejections (do NOT add these later)

Tab content fades · skeleton→content fades on page load · chart draw-ins/stat count-ups · badge crossfades in bulk table updates · theme-switch crossfade · session-form mobile "Edit setup" restructure-for-animation · FAB entrance on route change. (Lens D, gate-checked; restraint is the house taste.)

## Cross-check decisions (taste-pack lens, 2026-08-04)

- **Grid-rows height animations** (p1-motion-003 submenu, p2-approve-row-exit) are a **conscious exception** to the transform/opacity-only rule: standard auto-height technique, one small element, token-timed, not scroll-linked. Do not degrade to max-height hacks; do not generalize the exception.
- **150ms micro-reveals stand.** The "800ms+ cinematic entrance" school is rejected for this app — theatrical motion on a workday dashboard is identity damage, not polish.
- Verified non-issues: custom 404 exists; help prose already measures `max-w-3xl`; no "Oops" copy anywhere.

## Identity guard — do NOT import during Phase 3 (from the replacement-language skills)

No font or palette swaps (the 8-theme token system IS the identity) · no nested-bezel cards, `rounded-[2rem]` squircles, glassmorphism/backdrop-blur, mesh gradients, OLED black, or grain overlays · no tinted/ambient shadows or spotlight borders (Whisper Shadow Rule) · no scroll-entry animations, blur fade-ups, stagger reveals, or smooth-scroll inertia (motion-rejections list governs) · no nav restructuring (sidebar carries `data-tour` assertions) · no icon-set swap (Lucide is incumbent) · keep card borders and pill badges · no marketing-page spatial vocabulary (`py-24+`, island CTAs) — density is a theme token · never import fake-data/content tricks (live PHI system).

## Deferred / investigate separately

- **First-visit WalkthroughNudge toast covers the FAB corner** (found during p0-fab-occlusion, 2026-08-04): the one-shot "New here?" sonner toast renders bottom-right above the quick-log FAB (z-40) until dismissed or its 15s timeout. Any toast shares that corner — a fix is a toast-positioning decision, not a FAB fix. Consider alongside p2-toast-promise.
- **Contractor `/invoices/` local fetch bug** (CORS/ERR_FAILED against local Supabase, this role+route only) — investigate as a bug, not polish; the error-state work above is correct regardless.
- `sessions-full-table-fetch` — add `.range()` when the dataset grows (P3, performance).
- AI chat streaming polish (message entrances, scroll behavior) — feel-dependent, needs live testing.
- driver.js 400ms + popover growth — third-party, accepted.
- PDF components (`components/pdf/*`) — **out of scope by design**: client-facing, react-pdf can't consume CSS vars (detector false positives).

## Do-not-break register (positives all four lenses agreed on)

- Sidebar: pure `--sidebar*` tokens, aria-current/expanded/controls, `data-tour` attrs (tours assert them — never move/rename without re-auditing all audiences).
- Shell a11y: skip link → `#main-content`, `role="status"` live loading, labeled menu button; 44px coarse-pointer floor; 16px mobile inputs.
- Token infra: `--canvas`/`--skeleton`, completeness + WCAG contrast tests, pre-paint `data-theme` stamping; shadcn 3px `ring-ring/50` focus discipline; Whisper Shadow Rule holds everywhere.
- Role-gated layout parity (admin/contractor = owner minus money — 5/5 comparisons passed); central status maps' *architecture* (fix emissions, keep the pattern).
- Help system (contextual "?", walkthrough launches, coverage-tested articles); notes-visibility PHI copy on session forms; amber alert-card pattern; invoice Client Preview; Overdue Invoices panel stays the dashboard's single red surface.
- Already-right motion: dialog/popover origins, accordion, vaul drawer physics, sonner, skeleton pulse, table row hovers.

## Phase 3 batch index (traffic order)

| Batch | P0 | P1 | P2 |
|---|---|---|---|
| global/foundation (Phase 2) | fab-occlusion, viewas-contrast, a11y-names, walkthrough-reduced-motion | status-tokens, money-semantics, motion-001/003/004, ui-gray-sweep, button-press, state-pattern, charts | — |
| home | — | (inherits tokens) | approve-row-exit, wizard-polish, dedup(KPI) |
| sessions | mobile-toolbar-clip | sessions-tokens, calendar-seam, session-form-sweep, action-exposure(session), copy(edit), off-scale-type(calendar) | reveal-entrances, pricing-preview, status-ack, form-grid, small-polish |
| invoices | invoices-error-state | invoices-tabs, mark-paid-label, action-exposure(invoice) | reveal-entrances, toast-promise, generate-card-exit |
| clients | — | contact-card, badge-casing | small-polish(alarm dot) |
| team | team-header-collision | off-scale-type(pay-rate-matrix), badge-casing | dedup(email) |
| payments/earnings | tab-strips-clip | copy(pluralization), save-jitter | reveal-entrances, toast-promise, earnings-mobile |
| analytics | — | charts (foundation) | chart-legend |
| settings | role-contradiction, tab-strips-clip | copy(jargon), banner-jump, save-placement | reveal-entrances, small-polish(trash icons) |
| help | — | — | help-ai-affordance, dedup(categories) |
