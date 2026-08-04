# User-Selectable Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eight per-user dashboard themes (palette + font + radius + density) selectable from an Appearance popover, applied pre-paint via `data-theme`, with org branding retired from the dashboard.

**Architecture:** Static CSS variable blocks per theme in `src/app/themes.css` keyed by `[data-theme="…"]` / `.dark[data-theme="…"]` on `<html>`; a nonce-carrying inline script stamps the attribute from localStorage before paint; next-themes keeps owning light/dark. Registry in `src/lib/themes/` is the single source of truth consumed by the script, the picker, and the tests.

**Tech Stack:** Next.js 16, Tailwind 4 (`--spacing`/`--radius` tokens), next/font, next-themes, shadcn Popover, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-04-user-themes-design.md`

## Global Constraints

- localStorage key is exactly `mca-theme`; Classic = attribute absent, key removed.
- Inline scripts MUST carry the CSP nonce from `x-nonce` (see existing next-themes usage in `src/app/layout.tsx`).
- Every non-Classic theme defines EVERY token in `REQUIRED_THEME_TOKENS` in both light and dark blocks.
- Contrast ≥ 4.5:1 for primary/primary-foreground, background/foreground, card/card-foreground, sidebar/sidebar-foreground in both modes, every theme (enforced by test).
- The pre-paint script never applies a theme when `location.pathname` starts with `/portal`.
- No `Co-Authored-By` trailers on commits.

---

### Task 1: Theme registry + contrast utilities

**Files:**
- Create: `src/lib/themes/index.ts`
- Create: `src/lib/themes/contrast.ts`
- Test: `src/lib/themes/index.test.ts`, `src/lib/themes/contrast.test.ts`

**Interfaces:**
- Produces: `ThemeId`, `THEMES: ThemeDefinition[]`, `DEFAULT_THEME_ID`, `THEME_STORAGE_KEY = 'mca-theme'`, `isThemeId(v): v is ThemeId`, `NON_DEFAULT_THEME_IDS: ThemeId[]`, `REQUIRED_THEME_TOKENS: readonly string[]`; `parseOklch(str)`, `contrastRatio(a, b)` (both take oklch strings).

- [ ] **Step 1: Write failing tests** — `src/lib/themes/contrast.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { contrastRatio, parseOklch } from './contrast'

describe('parseOklch', () => {
  it('parses lightness, chroma, hue', () => {
    expect(parseOklch('oklch(0.52 0.105 210)')).toEqual({ l: 0.52, c: 0.105, h: 210 })
  })
  it('parses alpha and zero-hue grays', () => {
    expect(parseOklch('oklch(1 0 0 / 10%)')).toEqual({ l: 1, c: 0, h: 0 })
  })
  it('returns null for non-oklch values', () => {
    expect(parseOklch('#ffffff')).toBeNull()
  })
})

describe('contrastRatio', () => {
  it('is ~21 for black on white', () => {
    expect(contrastRatio('oklch(0 0 0)', 'oklch(1 0 0)')).toBeGreaterThan(20)
  })
  it('is 1 for identical colors', () => {
    expect(contrastRatio('oklch(0.5 0.1 200)', 'oklch(0.5 0.1 200)')).toBeCloseTo(1, 1)
  })
})
```

`src/lib/themes/index.test.ts` (registry half — CSS half added in Task 2):

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME_ID, isThemeId, NON_DEFAULT_THEME_IDS, THEMES, THEME_STORAGE_KEY } from './index'

describe('theme registry', () => {
  it('has eight themes with classic first as default', () => {
    expect(THEMES).toHaveLength(8)
    expect(THEMES[0].id).toBe('classic')
    expect(DEFAULT_THEME_ID).toBe('classic')
  })
  it('has unique ids and NON_DEFAULT_THEME_IDS excludes classic', () => {
    const ids = THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(NON_DEFAULT_THEME_IDS).toEqual(ids.filter((id) => id !== 'classic'))
  })
  it('validates ids', () => {
    expect(isThemeId('ocean')).toBe(true)
    expect(isThemeId('neon')).toBe(false)
    expect(isThemeId(null)).toBe(false)
  })
  it('uses the agreed storage key', () => {
    expect(THEME_STORAGE_KEY).toBe('mca-theme')
  })
})
```

- [ ] **Step 2: Run to verify failure** — `npm run test -- --run src/lib/themes` → FAIL (modules missing).
- [ ] **Step 3: Implement** — `src/lib/themes/contrast.ts`: `parseOklch` regex `^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+%?)?\s*\)$`; OKLCH→OKLab→LMS→linear sRGB→relative luminance (standard matrices, same constants as `branding-provider.tsx` inverted); `contrastRatio = (Lmax + 0.05) / (Lmin + 0.05)`. `src/lib/themes/index.ts`: the registry per the spec roster table (id/label/description/swatch hexes) + `REQUIRED_THEME_TOKENS` (the full variable list from `globals.css`: background, foreground, card, card-foreground, popover, popover-foreground, primary, primary-foreground, secondary, secondary-foreground, muted, muted-foreground, accent, accent-foreground, destructive, border, input, ring, chart-1..5, sidebar and its 7 sub-tokens, skeleton).
- [ ] **Step 4: Run to verify pass** — same command → PASS.
- [ ] **Step 5: Commit** — `feat(themes): theme registry and oklch contrast utilities`

### Task 2: themes.css palettes + globals.css wiring + completeness/contrast tests

**Files:**
- Create: `src/app/themes.css` (all 7 non-Classic themes, light + dark, full token set, plus per-theme `--radius`, `--font-app`, `--font-heading`, `--spacing`)
- Modify: `src/app/globals.css` (import themes.css; add `--font-app`/`--font-heading` defaults on `:root`; base rules `body { font-family: var(--font-app) }` and `h1–h6, [data-slot="card-title"] { font-family: var(--font-heading) }`)
- Test: extend `src/lib/themes/index.test.ts`

**Interfaces:**
- Consumes: `NON_DEFAULT_THEME_IDS`, `REQUIRED_THEME_TOKENS`, `contrastRatio` from Task 1.

- [ ] **Step 1: Write failing tests** — append to `index.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { contrastRatio } from './contrast'

const css = readFileSync(join(__dirname, '../../app/themes.css'), 'utf8')

function block(selector: string): string {
  const start = css.indexOf(selector)
  expect(start, `missing block ${selector}`).toBeGreaterThan(-1)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return css.slice(open + 1, close)
}
const token = (body: string, name: string) => body.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim()

describe('themes.css completeness', () => {
  for (const id of NON_DEFAULT_THEME_IDS) {
    it(`${id} defines every token in both modes`, () => {
      for (const sel of [`[data-theme="${id}"]`, `.dark[data-theme="${id}"]`]) {
        const body = block(sel)
        for (const t of REQUIRED_THEME_TOKENS) {
          expect(token(body, `--${t}`), `${sel} missing --${t}`).toBeTruthy()
        }
      }
    })
  }
})

describe('themes.css contrast (WCAG AA)', () => {
  const pairs: Array<[string, string]> = [
    ['primary', 'primary-foreground'],
    ['background', 'foreground'],
    ['card', 'card-foreground'],
    ['sidebar', 'sidebar-foreground'],
  ]
  for (const id of NON_DEFAULT_THEME_IDS) {
    for (const sel of [`[data-theme="${id}"]`, `.dark[data-theme="${id}"]`]) {
      it(`${sel} key pairs >= 4.5:1`, () => {
        const body = block(sel)
        for (const [bg, fg] of pairs) {
          const ratio = contrastRatio(token(body, `--${bg}`)!, token(body, `--${fg}`)!)
          expect(ratio, `${sel} ${bg}/${fg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
        }
      })
    }
  }
})
```

- [ ] **Step 2: Run to verify failure** — themes.css missing → FAIL.
- [ ] **Step 3: Write themes.css.** Per-theme recipe (light: tinted near-white surfaces L≈0.95–0.99 at theme hue with chroma 0.005–0.03, dark foregrounds L≈0.15–0.25, primary at the spec's starting hex converted to OKLCH with L ≤ 0.53 when the foreground is near-white; dark: inverted with primary as a light accent L≈0.78–0.85 and dark primary-foreground). Hues: Ocean 210, Forest 150, Lavender 290, Sunset 45, Slate gray-255/indigo-277 (dark sidebar in light mode: `--sidebar: oklch(0.28 0.035 257)`), Blossom 355, Sonata warm-neutral 90 (primary = ink `oklch(0.25 0.01 90)`). Non-color tokens per theme: `--radius` 0.625/0.5/0.875/0.625/0.375/0.75/0.125 rem respectively; `--font-app` var(--font-nunito|source-sans|quicksand|geist-sans|geist-sans|nunito|geist-sans); `--font-heading` defaults to `--font-app`, Sunset → var(--font-lora), Sonata → var(--font-eb-garamond); `--spacing` 0.23rem (Slate), 0.27rem (Lavender, Sonata), omitted otherwise. Charts: five analogous hues around the theme hue, L 0.45–0.75. Destructive: reuse Classic's values.
- [ ] **Step 4: Run to verify pass** — adjust any failing lightness values until contrast test passes.
- [ ] **Step 5: Commit** — `feat(themes): seven theme palettes with completeness and contrast tests`

### Task 3: Fonts + pre-paint script in root layout

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `NON_DEFAULT_THEME_IDS`, `THEME_STORAGE_KEY`.

- [ ] **Step 1: Declare fonts** with `next/font/google` alongside Geist: `Nunito` → `--font-nunito`, `Source_Sans_3` → `--font-source-sans`, `Quicksand` → `--font-quicksand`, `Lora` → `--font-lora`, `EB_Garamond` → `--font-eb-garamond`; add all `.variable` classes to `<body>`.
- [ ] **Step 2: Add the pre-paint script** before `<ThemeProvider>` (inside `<body>` is fine — it runs synchronously during parse):

```tsx
const themeScript = `try{if(!location.pathname.startsWith('/portal')){var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t&&${JSON.stringify(NON_DEFAULT_THEME_IDS)}.indexOf(t)>-1)document.documentElement.setAttribute('data-theme',t)}}catch(e){}`
// in JSX:
<script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit` clean; `npm run dev`, load `/login/`, run `localStorage.setItem('mca-theme','ocean')` + reload → `<html data-theme="ocean">` with no flash; on a `/portal/...` URL the attribute is NOT set.
- [ ] **Step 4: Commit** — `feat(themes): pre-paint theme application and theme font loading`

### Task 4: useAppTheme hook + Appearance popover + header swap

**Files:**
- Create: `src/lib/themes/use-app-theme.ts` (client hook: state from `document.documentElement.dataset.theme` on mount; `setTheme(id)` sets/removes attribute + localStorage per Global Constraints)
- Create: `src/components/ui/appearance-menu.tsx`
- Modify: `src/components/layout/header.tsx` (replace `ThemeToggle` import/usage with `AppearanceMenu`)
- Delete: `src/components/ui/theme-toggle.tsx`
- Test: `src/components/ui/appearance-menu.test.tsx`

**Interfaces:**
- Consumes: `THEMES`, `useAppTheme()` → `{ theme: ThemeId, setTheme(id: ThemeId): void }`.
- Produces: `AppearanceMenu` — a ghost icon button (Palette icon, `sr-only` "Appearance") opening a shadcn Popover with the light/dark/system mode row (same `useTheme()` logic and hydration placeholder as the old ThemeToggle) plus a 2-column grid of theme cards: three swatch dots + label, current theme ring-highlighted, `aria-pressed`, keyboard focusable.

- [ ] **Step 1: Write failing component test** — render `<AppearanceMenu />`, click trigger, click "Ocean": expect `document.documentElement.getAttribute('data-theme')` = `ocean` and `localStorage.getItem('mca-theme')` = `ocean`; click "Classic": both cleared. (jsdom + `fireEvent`; wrap in `ThemeProvider` from next-themes only if `useTheme` demands it.)
- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement hook + component + header swap.**
- [ ] **Step 4: Run to verify pass**; `npx tsc --noEmit`; `npm run lint`.
- [ ] **Step 5: Commit** — `feat(themes): appearance popover with theme picker in header`

### Task 5: Retire dashboard branding override

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx` (remove `BrandingProvider` from the provider stack)
- Delete: `src/components/providers/branding-provider.tsx`
- Modify: `src/app/(dashboard)/settings/practice/page.tsx` (Colors card description → "Customize colors used on client-facing surfaces — invoices, emails, and the client portal")

**Interfaces:** none — pure removal; portal/invoice/email branding paths are untouched.

- [ ] **Step 1: Remove provider + delete file.** Grep for remaining `branding-provider` / `--brand-primary` / `--brand-secondary` consumers; if any component reads `--brand-*` vars, switch it to `organization.primary_color` from context.
- [ ] **Step 2: Update the Colors card copy.**
- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run test -- --run`, `npm run lint` all clean.
- [ ] **Step 4: Commit** — `feat(themes): scope org branding to client-facing surfaces only`

### Task 6: Help article update

**Files:**
- Modify: `src/app/(dashboard)/help/_data/articles/getting-started.ts` (`appearance-and-dark-mode` article, line ~103)

- [ ] **Step 1: Rewrite the article** — title "Appearance: Themes & Dark Mode"; keep the mode section; add a Themes section naming all eight themes and the Appearance button in the header; note themes are personal, saved per browser, and don't change what clients see. Keywords: add `'appearance'`, `'colors'`, `'ocean'`, `'personalize'`.
- [ ] **Step 2: Run** `npm run test -- --run src/app/\(dashboard\)/help` → integrity tests PASS.
- [ ] **Step 3: Commit** — `docs(help): cover the new theme picker in the appearance article`

### Task 7: Full verification + local demo

- [ ] **Step 1:** `npm run test -- --run` (all), `npx tsc --noEmit`, `npm run lint` — all clean.
- [ ] **Step 2:** `npm run dev`; with Playwright, set each theme id via localStorage on `/login/`, screenshot light + dark for at least Ocean, Slate, Sonata; then log into the dashboard (local stack if up) and screenshot the Appearance popover + a themed dashboard.
- [ ] **Step 3:** Show screenshots to the user.

## Self-Review

- Spec coverage: roster/registry (T1), palettes+density+radius+fonts CSS (T2), pre-paint+fonts (T3), picker (T4), branding scope-down (T5), help (T6), tests woven through + e2e-equivalent Playwright demo (T7). E2E spec file deferred to the demo step deliberately — local Playwright demo covers the same smoke; add `tests/e2e/appearance.spec.ts` as follow-up if wanted.
- Placeholders: palette values are specified as recipes + exact non-color tokens rather than 400 literal lines; the completeness/contrast tests define "done" objectively. No TBDs.
- Type consistency: `ThemeId`, `THEME_STORAGE_KEY`, `NON_DEFAULT_THEME_IDS`, `useAppTheme` signatures consistent across tasks.
