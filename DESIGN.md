---
name: MCA App Dashboard
description: Calm, token-driven practice-management dashboard — shadcn/ui on eight swappable therapy-toned palettes
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  canvas: "oklch(0.985 0.002 247.8)"
  card: "oklch(1 0 0)"
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.97 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.97 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
  sidebar: "oklch(0.985 0 0)"
  skeleton: "oklch(0.928 0.006 264.5)"
typography:
  body:
    fontFamily: "var(--font-app) (Geist Sans in Classic)"
    fontSize: "0.875rem"
    fontWeight: 400
  heading:
    fontFamily: "var(--font-heading) (falls back to the body font)"
    fontWeight: 600
  label:
    fontFamily: "var(--font-app)"
    fontSize: "0.75rem"
    fontWeight: 500
rounded:
  sm: "calc(var(--radius) - 4px)"
  md: "calc(var(--radius) - 2px)"
  lg: "var(--radius)"
  xl: "calc(var(--radius) + 4px)"
spacing:
  unit: "0.25rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "4px 12px"
  badge:
    rounded: "9999px"
    padding: "2px 8px"
---

# Design System: MCA App Dashboard

## Overview

**Creative North Star: "The Quiet Practice Room"** *(provisional — chosen non-interactively during the 2026-08 polish campaign; the user may rename it)*

A calm, well-tuned instrument for running a therapy practice. The system is shadcn/ui discipline applied through one semantic token layer, so the entire look — palette, font pairing, corner radius, even density — swaps per user via eight registered themes while every component stays byte-identical. Classic is monochrome ink-on-white; the seven alternates are low-chroma, tinted worlds (teal, sage, violet, terracotta, indigo-on-slate, rose, sheet-music parchment) that stay gentle on the eyes through a workday. Nothing shouts: chroma is spent on one primary accent and the status colors, and the loudest thing on any screen is the user's own data.

The identity is carried by tokens, not by any single palette. That makes the token indirection itself the brand: a hardcoded gray or a one-off hex is not a shortcut here, it is a break in the system that all eight themes will expose.

**Key Characteristics:**
- Semantic token vocabulary (shadcn names + `--canvas`, `--skeleton`) as the only color channel
- Eight complete light+dark palettes; theme also selects font pairing, radius (2px–14px), and density
- Flat, bordered surfaces; shadows are whispers (`shadow-xs`/`shadow-sm`), dark mode swaps them for translucent borders
- Dominant 14px UI type; headings differentiated per theme (`--font-heading`)
- Motion is brief and token-timed (150/200/250ms), fully collapsed under `prefers-reduced-motion`

## Colors

The palette is a role system, not a color list: components speak `bg-primary`, `text-muted-foreground`, `border-border`; the active theme decides what those mean in both modes.

### Primary
- **Ink** (`--primary`, Classic: oklch(0.205 0 0)): buttons, active nav, focus of attention. Every alternate theme replaces it with its own muted accent (Ocean teal, Forest moss, Lavender violet, Sunset terracotta, Slate indigo, Blossom rose, Sonata near-black ink). Chroma stays ≤ ~0.13 in light mode except Slate's indigo.

### Neutral
- **Background** (`--background`): page/portal surface — white in Classic; each theme tints it faintly toward its hue.
- **Canvas** (`--canvas`): the dashboard shell behind cards. Classic pins it to gray-50 while keeping `--background` white for client-facing surfaces; themed palettes point it at their tinted `--background`.
- **Card / Popover** (`--card`, `--popover`): elevated white (or near-white) surfaces sitting on the canvas.
- **Muted / Secondary / Accent** (`--muted`, `--secondary`, `--accent`): whisper-tint fills for quiet chrome, hover states, and de-emphasized rows; `--muted-foreground` is the only approved secondary text color.
- **Border / Input / Ring** (`--border`, `--input`, `--ring`): hairlines; dark mode renders them as white-alpha (10–18%) instead of darkening shadows.
- **Sidebar family** (`--sidebar*`): a parallel role set so a theme can restyle navigation independently (Slate ships a dark sidebar over a light app).
- **Skeleton** (`--skeleton`): the one approved loading-placeholder fill.
- **Charts** (`--chart-1..5`): per-theme categorical ramp for analytics.

### Named Rules
**The Token Law Rule.** No raw hex, no Tailwind palette classes (`gray-*`, `zinc-*`) in dashboard UI. If a needed role is missing, extend the token set in `globals.css` + all eight `themes.css` blocks (the completeness test will force you to).
**The Portal Firewall Rule.** Org `primary_color`/`secondary_color` are client-portal branding only. Dashboard themes never read them; the portal never reads `data-theme`.
**The Eight-Theme Proof Rule.** A visual change is done when it holds in Classic *and* at least two alternate themes, light and dark. One-theme fixes are regressions.

## Typography

**Body Font:** `var(--font-app)` — Geist Sans in Classic; themes substitute Nunito (Ocean, Blossom), Source Sans 3 (Forest), Quicksand (Lavender).
**Heading Font:** `var(--font-heading)` — same as body in most themes; Sunset pairs Lora, Sonata pairs EB Garamond over Geist body. Applied globally to `h1–h6` and `[data-slot="card-title"]`.
**Mono Font:** `var(--font-geist-mono)`, rare (IDs, tokens).

**Character:** Workmanlike and warm. The type system's personality lives in the theme's font swap, not in size gymnastics.

### Hierarchy
- **Page title** (semibold, ~text-2xl): one per page, in the heading font.
- **Card title** (semibold, text-base/leading-none, `data-slot="card-title"`): section headers inside cards.
- **Body** (400, 0.875rem/text-sm): the dominant UI size — tables, forms, nav. Inputs render text-base on mobile (16px stops iOS zoom) and text-sm from `md:` up.
- **Label** (500, 0.75rem–0.875rem): form labels, badges, table headers; badges are text-xs medium.

### Named Rules
**The One-Scale Rule.** Stay on the Tailwind type scale; no arbitrary font sizes. Hierarchy comes from weight and the muted-foreground color, not from new sizes.

## Layout

Sidebar-shell dashboard: fixed left sidebar (its own token family) + top header + `--canvas` content area with cards on top. Content sits in consistent page padding with `gap-6` card rhythm; the card grid collapses to single column on mobile. Density is a theme decision: Lavender/Sonata breathe (`--spacing: 0.27rem`), Slate compresses (`0.23rem`) — meaning all Tailwind spacing utilities scale, so spacing must always be utility-driven, never pixel-hardcoded. Mobile keeps thumb reach in mind: the contractor quick-log FAB and vaul drawer are the signature mobile pattern. Touch targets ≥ 44px on coarse pointers is a global guarantee.

## Elevation & Depth

Flat by default. Surfaces separate by hairline `border` + faint background steps (`background` → `canvas` → `card`), not by shadow stacks. The entire shadow vocabulary is `shadow-xs` (outline buttons, inputs) and `shadow-sm` (cards); dark mode drops shadow legibility and relies on white-alpha borders instead.

### Named Rules
**The Whisper Shadow Rule.** Nothing deeper than `shadow-sm` at rest. Depth beyond that is reserved for genuinely floating layers (popovers, dialogs, drawers).

## Shapes

All radii derive from the single `--radius` token (`rounded-sm/md/lg/xl` = −4px/−2px/base/+4px). The theme sets the geometry mood: Sonata is near-square (2px), Slate sharp (6px), Classic/Ocean/Sunset 10px, Blossom 12px, Lavender pillowy (14px). Badges alone are fully round (`rounded-full`). Consequence: never hardcode a radius — a component that looks right only at 10px is wrong in Sonata and Lavender.

## Components

### Buttons
- **Shape:** `rounded-md`, h-9 (36px) default / h-8 sm / h-10 lg; icon sizes square.
- **Primary:** `bg-primary text-primary-foreground`, hover fades to 90% opacity.
- **Outline:** `border bg-background shadow-xs`, hover fills `accent`; dark mode swaps to `bg-input/30`.
- **Ghost / Secondary / Destructive / Link:** standard shadcn set; destructive keeps white text over `--destructive` in both modes.
- **Focus:** 3px `ring-ring/50` + border shift — the universal focus treatment.
- **States:** `transition-all` at default speed; disabled = 50% opacity, no pointer events.

### Cards
- **Corner Style:** `rounded-xl`; **Background:** `bg-card` with `border` hairline and `shadow-sm`; **Padding:** py-6 with px-6 headers/content, `gap-6` internal stack. Card titles are semibold, heading-font, leading-none.

### Inputs / Fields
- **Style:** transparent background (dark: `input/30`), `border-input` hairline, `rounded-md`, h-9, `shadow-xs`.
- **Focus:** same 3px ring treatment as buttons; **Invalid:** `aria-invalid` ring + border in destructive.
- **Mobile:** text-base under `md:` to prevent iOS zoom.

### Badges
- Pill (`rounded-full`), text-xs medium, filled `primary`/`secondary`/`destructive` or outline; used heavily as status chips (session status, invoice status).

### Navigation (sidebar)
- Speaks only `--sidebar*` tokens: quiet default rows, `sidebar-accent` hover/active fill, `sidebar-primary` for the active indicator. Collapses behind a drawer on mobile.

### Skeletons
- `bg-[--skeleton]` (or the `skeleton` color utility) fills only; sized to mimic the loaded layout.

## Do's and Don'ts

### Do:
- **Do** route every color through the semantic tokens; extend the token set (all 8 themes × 2 modes + the completeness test) when a role is genuinely missing.
- **Do** verify changes in Classic + ≥2 alternate themes, both modes, before calling them done (The Eight-Theme Proof Rule).
- **Do** time transitions with `--motion-fast/base/slow` (150/200/250ms), entrances ease-out, exits ease-in.
- **Do** keep spacing utility-based so theme density (`--spacing`) scales it.
- **Do** use `--canvas` for shell backgrounds and `--skeleton` for loading fills — they exist precisely so grays never get hardcoded.

### Don't:
- **Don't** hardcode hex/oklch values, Tailwind gray classes, radii, or font families in dashboard components — every one of those is theme-owned.
- **Don't** exceed `shadow-sm` on resting surfaces or add glows.
- **Don't** let dashboard theming touch client-facing surfaces (portal, emailed invoices/PDFs) — those follow org branding and neutral defaults instead.
- **Don't** add motion outside the `prefers-reduced-motion` collapse, or one-off easings/durations per component.
- **Don't** move or remove elements that walkthrough tours highlight without re-running the walkthrough audit for every audience.
