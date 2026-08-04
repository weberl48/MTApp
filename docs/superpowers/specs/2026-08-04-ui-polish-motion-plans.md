# Dashboard UI Polish Campaign — motion survey & implementation plans

Companion to `2026-08-04-ui-polish-campaign-backlog.md`. Produced by the improve-animations
lens on 2026-08-04 against commit 565e7fe; plans 001–006 are self-contained handoff packets
for implementation subagents. If cited code has drifted from 565e7fe, the executor STOPs
and reports rather than adapting silently.

## Recon
Defining fact: committed motion tokens have ZERO consumers. Every animation runs on someone else's clock: tw-animate default 150ms weak `ease` (verified: `enter var(--tw-duration,.15s) var(--tw-ease,ease)`), Radix/shadcn hardcoded duration-200/500, vaul internal 500ms spring, driver.js 400ms, recharts 1500ms default (6× slow token). Feature code has almost no motion: 33 Loader2 spin sites, few transition-colors hovers, one ease-in-out sidebar drawer, one infinite animate-bounce.

Already right (not reported): dialog transform-origin center; accordion 200ms ease-out; switch/tabs; TableRow transition-colors; skeleton pulse; popovers/dropdowns/selects/tooltips scale from radix transform-origin with zoom-in-95.

## Vetted findings (severity | location | issue)
1. HIGH | ui/dropdown-menu.tsx:45,233 · ui/select.tsx:65 · ui/popover.tsx:24 · ui/tooltip.tsx:45 · ui/dialog.tsx:41,63 · ui/alert-dialog.tsx:21,39 · ui/drawer.tsx:40 | overlays at tw-animate defaults (weak ease, untokened) → Plan 001
2. HIGH | ui/sheet.tsx:63 | opens 500ms ease-in-out (slower than close, over budget); hosts AI chat panel → Plan 001
3. HIGH | charts/* + analytics/page.tsx:236-247 | recharts 1500ms sweep on mount AND every range click; pie labels animate → Plan 002
4. HIGH | layout/sidebar.tsx:226-239 | drawer ease-in-out both ways duration-200 hardcoded; backdrop hard-cuts; submenu :162 pops while chevron :157 rotates → Plan 003
5. MED | owner-onboarding-gate.tsx:174 | infinite animate-bounce; cluster :170-191 no entrance → Plan 004
6. MED | pwa/install-prompt.tsx:82,116-121 | appears 3s after load, no entrance; blinks out → Plan 004
7. MED | sessions/page.tsx:547-579 · invoices/page.tsx:572-627 | bulk bars pop/vanish atomically → Plan 005
8. MED | sessions/page.tsx:445-540 · payments/page.tsx:398-421 · settings/business/page.tsx:327-349,368+,553+ · settings/customize/page.tsx:222+,286+ | instant-reveal family `{x && …}` hard cuts → Plan 005
9. MED a11y | walkthrough-provider.tsx:131,152 | explicit behavior:'smooth' BEATS global reduced-motion collapse → Plan 006
10. MED | help/page.tsx:172-191 | AI button → 384px panel in one frame (most violent jump in app) | follow-up
11. MED | help/page.tsx:200-258 | one keystroke swaps ~5 sections | follow-up
12. LOW | settings/profile/page.tsx:165 +8 save buttons; quick-log-drawer.tsx:280 | `{saving && <Loader2/>}` prepended → button grows/label shifts | swap icon in place
13. LOW | transition-all ×5 (button.tsx:8 documented; accordion:38; help:351 hover:scale-110; color-picker:96; password-strength:23 width @300ms) | scope when touched
14. LOW | driver.js 400ms hardcoded; fallback note grows popover mid-step | accept (third-party)
15. LOW | 11 pages spinner-only vs 5 skeleton; no loading.tsx anywhere; clients/team lists block with nothing | skeleton unification = design-lens item
16. LOW | help/ai-chat.tsx:150-164,79-81 | no message entrances; spinner→token hard cut; per-chunk scroll fights user | follow-up

## Missed opportunities (additive)
1. toast.promise unused across all 207 toast calls — async workflows (mark paid, send invoice, batch) get loading→success morph for free (invoices/payments-earnings)
2. Status-change acknowledgment: sessions/[id]/page.tsx:322-378 approve recolors badge + recomposes 6 buttons in one frame; one-shot `animate-in fade-in-0 zoom-in-95 duration-[var(--motion-base)]` keyed on new badge (sessions)
3. Onboarding wizard progress segments (owner-onboarding-wizard.tsx:105-115) lack transition-colors; step swaps hard-cut (home, first-run delight budget)
4. Invoice "Generate" card exit (invoices/page.tsx:773-860): card deletes with no exit, eye has nothing to follow to Batch Invoices table (invoices)

---

# IMPLEMENTATION PLANS (verbatim handoff packets; all stamped commit 565e7fe)

Shared verification: `npx tsc --noEmit` clean, `npm run lint` clean, feel check in Classic + one alternate theme, light + dark. Shared boundaries: motion classes/props only; no markup restructure unless a step says so; never touch `data-tour` attributes; no new dependencies; if code at a cited line doesn't match, STOP and report.

## 001 — Token-time the overlay primitives, fix the Sheet — global-primitives — HIGH
1. globals.css, inside existing `@theme inline` (after line 45), add:
   --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
   --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
   --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
   (Tailwind 4: upgrades built-in ease-out/ease-in-out utilities app-wide; ease-in stays default per doctrine. tw-animate reads via --tw-ease.)
2. Append to animate class strings (do not remove existing):
   - ui/tooltip.tsx:45: `duration-[var(--motion-fast)] data-[state=open]:ease-out data-[state=closed]:ease-in`
   - ui/dropdown-menu.tsx:45 and :233, ui/select.tsx:65, ui/popover.tsx:24: `data-[state=open]:duration-[var(--motion-base)] data-[state=closed]:duration-[var(--motion-fast)] data-[state=open]:ease-out data-[state=closed]:ease-in`
   - ui/dialog.tsx:63 and ui/alert-dialog.tsx:39: replace bare `duration-200` with `duration-[var(--motion-base)]` + add open/closed easings. Overlays ui/dialog.tsx:41, ui/alert-dialog.tsx:21: add `duration-[var(--motion-base)]` (currently none).
   - ui/drawer.tsx:40 (vaul overlay): add `duration-500 ease-[var(--ease-drawer)]` (rides vaul's own 500ms cubic-bezier(0.32,0.72,0,1)).
   - ui/sheet.tsx:63: delete `transition ease-in-out`; use `data-[state=open]:duration-[var(--motion-slow)] data-[state=closed]:duration-[var(--motion-base)] data-[state=open]:ease-out data-[state=closed]:ease-in`. Overlay :39 add `duration-[var(--motion-base)]`.
Exemplar: dialog.tsx:63's duration-200 proves the mechanism (bare utility feeds --tw-duration/--tw-ease).
Done when: no animate-in surface in ui/ lacks explicit duration+easing; `grep -r "duration-500" src/components/ui` returns only drawer.tsx.
Feel: dropdown/popover snaps open (fast start, soft landing), exits quicker; AI chat Sheet arrives 250ms no slow-start; DevTools 10% shows decelerating enter curves; reduced-motion collapses.

## 002 — Silence the 1500ms chart sweeps — analytics + payments-earnings — HIGH
Add `isAnimationActive={false}` to every <Bar> (earnings-chart.tsx:70-75, sessions-chart.tsx:57-58), every <Area> (revenue-chart.tsx:58-75, two), the <Pie> (payment-status-chart.tsx:35-51), and every <Tooltip> (earnings-chart.tsx:59, sessions-chart.tsx:49, revenue-chart.tsx:50, payment-status-chart.tsx:52 — kills laggy position tween).
Boundaries: don't touch contentStyle or data/axis props; do NOT use animationDuration as compromise (range buttons re-trigger).
Done when: `grep -rn "isAnimationActive" src/components/charts` shows 9 hits, all ={false}.
Feel: /analytics/ renders complete, no grow-up; 3M→YTD rapid clicks change instantly; tooltip pinned to cursor.

## 003 — Sidebar mobile drawer: curves, scrim, submenu — global-primitives — HIGH
1. Aside (:237-239): `transition-transform duration-[var(--motion-base)]`; easing in the conditional: `mobileMenuOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'`. Keep lg: classes intact. (Best after 001's strong ease-out; degrades gracefully.)
2. Backdrop: always-mount:
   <div className={cn('lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-[var(--motion-base)]', mobileMenuOpen ? 'opacity-100 ease-out' : 'opacity-0 pointer-events-none ease-in')} onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
3. Submenu (:162-185): grid-rows reveal, always mounted:
   <div className={cn('grid transition-[grid-template-rows] duration-[var(--motion-base)]', isExpanded ? 'grid-rows-[1fr] ease-out' : 'grid-rows-[0fr] ease-in')}>
     <div id={submenuId} className="overflow-hidden">
       <div className="ml-4 mt-1 space-y-1" inert={!isExpanded}>
         {/* existing children map, unchanged */}
       </div>
     </div>
   </div>
   (inert = React 19 boolean; transitions not keyframes so rapid toggling retargets mid-flight.)
Boundaries: data-tour, aria-expanded/aria-controls stay; desktop lg: behavior unchanged.
Done when: no hard cut visible at 10% playback. Then run scripts/audit-walkthroughs.mts for ALL audiences (tours highlight nav links).

## 004 — Floating layers: retire the bounce, add entrances — home + global-primitives — MED
1. owner-onboarding-gate.tsx:174: delete `animate-bounce`. Wrapper (:171): append `animate-in fade-in-0 slide-in-from-bottom-4 duration-[var(--motion-slow)] ease-out`.
2. install-prompt.tsx:121 outer fixed div: append `animate-in fade-in-0 slide-in-from-bottom-4 duration-[var(--motion-slow)] ease-out fill-mode-backwards`. Exit stays instant unmount (deliberate).
3. ai-chat-bubble.tsx:25: add `transition-shadow` beside hover:shadow-xl (only snapping shadow hover in app; FABs at quick-session-fab.tsx:33,50 have it).
Done when: `grep -rn "animate-bounce" src` returns nothing; Get Started pill slides up once then holds still.

## 005 — One entrance class for the workflow reveals — sessions/invoices/payments-earnings/settings — MED
Append to each revealed element's existing className:
- Bulk bars + sessions filter grid: `animate-in fade-in-0 slide-in-from-top-2 duration-[var(--motion-fast)] ease-out`
  (sessions/page.tsx:547-579 `<Card data-tour="sessions-bulk-actions" className="sticky top-0 z-10 border-blue-200 …">`; invoices/page.tsx:572-627; sessions/page.tsx:445-446 filter grid)
- Nested ml-6 settings blocks + payments date row: `animate-in fade-in-0 slide-in-from-top-1 duration-[var(--motion-fast)] ease-out`
  (payments/page.tsx:398-421; settings/business/page.tsx:327-349, :368+, :553+; settings/customize/page.tsx:222+, :286+)
Mount-triggered keyframes correct (discrete open events). Exits stay instant by design.
Boundaries: className appends only, nine sites, zero structural changes; no exit animations; don't touch hardcoded blue/amber colors (token lens owns).
Done when: all nine sites carry entrance classes; 10%-speed shows fade+slide. If rapid checkbox toggling reads as flicker, report rather than tune.
[MERGE NOTE: lens D proposed --motion-base (200ms) for the bulk bar; campaign decision = --motion-fast (150ms) per this plan, for rapid re-mount tolerance.]

## 006 — Reduced-motion: stop the walkthrough smooth-scrolls — global-primitives — MED (a11y)
walkthrough-provider.tsx: add near :54's matchMedia helper:
  function scrollBehavior(): ScrollBehavior { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }
:131 → scrollParent.scrollBy({ top: scrollOffset, behavior: scrollBehavior() })
:152 → hScrollParent.scrollBy({ left: scrollOffset, behavior: scrollBehavior() })
(Explicit 'smooth' argument beats CSS scroll-behavior:auto !important per CSSOM View — the only real reduced-motion gap found.)
Boundaries: touch nothing else (poller, cap, synthetic clicks, driver config settled). Verify with audit-walkthroughs.mts all audiences under both motion preferences.

Order: 001 → 002 → 003 → 004 → 005 → 006 (002/004/005/006 independent, parallelizable).
Not planned this pass (follow-ups): help AI expand + search swap (#10-11), save-button spinner jitter (#12), skeleton unification (#15), AI chat streaming (#16), toast.promise continuity.
