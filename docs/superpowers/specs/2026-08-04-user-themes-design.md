# User-Selectable Themes — Design

**Date:** 2026-08-04
**Status:** Approved design, pre-implementation

## Summary

Add a per-user theme system to the dashboard: eight complete, designed looks
(palette + font pairing + corner radius + density) selectable from an
Appearance popover in the header. Theme choice is a personal preference stored
in the browser, orthogonal to the existing light/dark mode toggle
(theme × mode). Organization branding colors stop restyling the dashboard and
apply only to client-facing surfaces (portal, invoice PDFs, emails).

## Decisions (settled during brainstorming)

| Question | Decision |
|---|---|
| Scope | Preset themes AND full look (fonts, radius, density) |
| Who picks | Each user, for themselves (like light/dark today) |
| Branding interaction | Org branding applies to invoices/client-facing surfaces only; the user's theme wins on the dashboard |
| Storage | Browser only (localStorage) — no DB column, no cross-device sync |
| Theme shape | Font/radius/density baked into each theme — one picker, no independent knobs |
| Approach | Static CSS variable blocks + pre-paint inline script (not composite next-themes values, not runtime JS injection) |

## Theme roster

Classic is the current neutral look and remains the default. Palette values
below are starting points from the approved mockups; final values are tuned in
OKLCH during implementation and must pass the contrast tests (see Testing).

| Theme | Vibe | Primary (light) | Accent (dark) | Font | Radius | Density |
|---|---|---|---|---|---|---|
| **Classic** | Current neutral | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | Geist | 10px | default |
| **Ocean** | Calm teal-blue | `#0e7490` | `#22d3ee` | Nunito | 10px | default |
| **Forest** | Sage/moss green | `#3a5a40` | `#8fbc8f` | Source Sans 3 | 8px | default |
| **Lavender** | Gentle violet, airy | `#6d5bb8` | `#a78bfa` | Quicksand | 14px | airy |
| **Sunset** | Warm terracotta, serif headings | `#bf5b2d` | `#f0955f` | Lora headings + Geist body | 10px | default |
| **Slate** | Dark sidebar, indigo, sharp | `#4f46e5` (sidebar `#1e293b`) | `#818cf8` | Geist | 6px | compact |
| **Blossom** | Soft rose | `#b0567e` | `#e896b8` | Nunito | 12px | default |
| **Sonata** | Sheet-music: paper, ink, Garamond | `#1a1a1a` on `#fbf9f4` | inverted (paper on ink) | EB Garamond headings + Geist body | 2px | airy |

Sonata is the music-inspired theme (chosen over "Studio" and "Vinyl"
alternatives). Music motifs stay subtle — color, type, texture; no decorative
waveforms on components.

## Architecture

### 1. Theme registry — `src/lib/themes/index.ts`

Typed metadata for each theme: `id`, `label`, `description`, swatch colors for
the picker, and the density class if any. Exports `THEMES`, `DEFAULT_THEME_ID`
(`classic`), `isThemeId()` for validating stored values, and the localStorage
key constant (`mca-theme`). This is the single source of truth for what themes
exist; the picker and the pre-paint script both consume it.

### 2. Palettes — `src/app/themes.css`

One block per theme per mode, following the exact variable shape
`globals.css` already uses:

```css
[data-theme="ocean"] { --primary: …; --radius: …; /* full set */ }
.dark[data-theme="ocean"] { /* full dark set — .dark and data-theme share <html> */ }
```

Rules:

- Every theme defines the **entire** variable set — background/foreground,
  card, popover, primary, secondary, muted, accent, destructive, border,
  input, ring, chart-1..5, all sidebar vars, skeleton, radius — in both
  modes. No partial palettes inheriting half of Classic.
- Classic keeps its variables on `:root`/`.dark` exactly as today; it needs no
  `data-theme` attribute (absence of the attribute = Classic).
- Imported by `globals.css`.

### 3. Pre-paint application — inline script in root layout

A small inline `<script>` in `src/app/layout.tsx` (rendered with the same
CSP nonce the layout already passes to next-themes) that runs before paint:

1. Skip when `location.pathname` starts with `/portal` (client-facing; keeps
   org branding, never user themes).
2. Read `localStorage['mca-theme']`; if the value is a known non-Classic theme
   id, set `document.documentElement.dataset.theme`.
3. Unknown/stale values are ignored → falls back to Classic.

Light/dark remains entirely next-themes' job (`class` attribute, `system`
support, its own pre-paint script). The two mechanisms compose without
touching each other: theme × mode.

A tiny client hook (`useAppTheme()` colocated with the picker) wraps
read/write of the attribute + localStorage for the popover UI.

### 4. Fonts — `next/font` in root layout

Declare alongside Geist: Nunito, Source Sans 3, Quicksand, Lora, EB Garamond,
each with `variable:` CSS custom properties. Browsers download font files only
when rendered text uses them, so unused themes cost ~0 bytes of font transfer.

- Body font: each theme sets `--font-sans` to its font variable (Tailwind's
  `font-sans` picks it up via the existing `@theme inline` mapping).
- Headings: a `--font-heading` variable (defaults to `--font-sans`), applied
  in `@layer base` to `h1–h6` and shadcn card titles
  (`[data-slot="card-title"]`). Only Sunset and Sonata override it (serif).

### 5. Radius and density

- **Radius:** per-theme `--radius` — already consumed by every component via
  the derived `--radius-sm/md/lg/xl` tokens.
- **Density:** Tailwind 4 derives all spacing utilities from `--spacing`
  (default `0.25rem`). Compact themes set `≈ 0.23rem` (−8%), airy themes
  `≈ 0.27rem` (+8%). One variable, whole-app effect, no component edits.
  Deltas stay small deliberately — spacing utilities also size icons
  (`size-4` etc.), so large factors would distort, not densify.

### 6. Picker UI — Appearance popover in the header

The existing `ThemeToggle` in `src/components/layout/header.tsx` grows into
an **Appearance** popover:

- Keeps the current light/dark/system mode control.
- Adds a grid of eight theme swatch cards (name + 3–4 color chips from the
  registry), current selection highlighted, keyboard accessible.
- Available to every role (contractors can't see most Settings tabs, so the
  picker cannot live there). No new route → no help `COVERAGE_MATRIX` change.

Check walkthrough integrity after the swap: any tour step highlighting the
old toggle must still resolve (`scripts/audit-walkthroughs.mts`).

### 7. Branding scope-down

`BrandingProvider` is removed from the dashboard provider stack and deleted —
its runtime override of `--primary`/`--sidebar-primary`/`--ring` is retired.
Org `primary_color`/`secondary_color` remain exactly where they are
client-facing today:

- Portal already reads `organization.primary_color` directly
  (`src/app/(portal)/portal/[token]/layout.tsx`) — unchanged.
- Invoice PDFs and outbound emails — unchanged.
- Settings > Practice keeps its color pickers; copy updates to "applies to
  client-facing surfaces (portal, invoices, emails)".

## Error handling

- Stored theme id no longer in the registry → attribute not set, Classic
  renders. No error surfaced; the picker shows Classic as selected.
- localStorage unavailable (private mode edge cases) → script no-ops; picker
  still works for the session via the attribute, choice just doesn't persist.
- CSP: the inline script must carry the nonce or it is blocked — same
  constraint (and same fix) as the existing next-themes script.

## Testing

- **Registry/CSS completeness** (`src/lib/themes/index.test.ts`): parse
  `themes.css`; every non-Classic theme defines every required token in both
  light and dark blocks. Token list exported from the registry so the test
  and the CSS can't drift silently.
- **Contrast** (same test file): programmatic WCAG check on key pairs per
  theme per mode — `primary`/`primary-foreground`, `background`/`foreground`,
  `card`/`card-foreground`, `sidebar`/`sidebar-foreground` ≥ 4.5:1.
- **Picker component test**: renders all registry themes; selecting one sets
  `data-theme` and writes localStorage; selecting Classic removes both.
- **E2E smoke** (`tests/e2e/`): open Appearance, pick a theme, assert the
  attribute, reload, assert it persisted. Runs on local per the e2e
  environment matrix.
- **Help**: update the existing appearance/dark-mode help article to cover
  themes (keywords: theme, color, appearance).

## Out of scope (deliberate)

- PWA `themeColor` viewport value stays static (`#1e40af`) — future polish.
- No org-default theme or owner-set theming; personal preference only.
- No DB persistence / cross-device sync (revisit if users ask).
- No user-facing font/radius/density knobs — themes are complete looks.
- Client portal theming — the portal stays org-branded.
