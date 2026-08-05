// Audit every in-app walkthrough against a running dev server (localhost:3000,
// DEV_AUTO_LOGIN). For each tour: start it from its help article, step through
// all steps, and verify the popover shows the right step and the highlight
// lands on the element the definition asks for (or is intentionally centered).
//
//   npx tsx scripts/audit-walkthroughs.mts [outDir]
//
// Roles: AUDIT_ROLE picks whose steps to audit; VIEW_AS drives the header's
// "View As" switcher so one owner/developer login can audit every audience —
// including the contractor tours. Set both to the same value:
//   AUDIT_ROLE=contractor VIEW_AS=contractor npx tsx scripts/audit-walkthroughs.mts
//
// Writes walkthrough-results.json + per-step screenshots to outDir (default
// .walkthrough-audit/). Exits 1 if any step fails.
import { chromium, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ALL_WALKTHROUGHS } from '../src/components/walkthroughs/walkthroughs/index'
import { audienceAllows, visibleWalkthroughSteps, type AudienceFlags } from '../src/lib/walkthroughs/audience'
import { HELP_ARTICLES } from '../src/app/(dashboard)/help/_data/help-articles'

const BASE = process.env.APP_URL || 'http://localhost:3000'
const OUT = process.argv[2] || '.walkthrough-audit'

// Audience flags must match the account the audit logs in with, or tours the
// app hides for that role fail with a missing Start button while the provider
// filters steps differently than the script expects. AUDIT_ROLE selects them
// (default owner — the DEV_AUTO_LOGIN / cert-tester account).
const ROLE_FLAGS: Record<string, AudienceFlags> = {
  owner: { isAdmin: true, isOwner: true, isContractor: false },
  admin: { isAdmin: true, isOwner: false, isContractor: false },
  contractor: { isAdmin: false, isOwner: false, isContractor: true },
}
const AUDIT_ROLE = process.env.AUDIT_ROLE || 'owner'
const AUDIT_FLAGS = ROLE_FLAGS[AUDIT_ROLE]
if (!AUDIT_FLAGS) {
  console.error(`AUDIT_ROLE must be one of ${Object.keys(ROLE_FLAGS).join('|')}, got "${AUDIT_ROLE}"`)
  process.exit(1)
}

// VIEW_AS drives the header's "View As" switcher after login instead of needing a
// real account per role — the only way to audit the contractor tours from an
// owner/developer login. It must agree with AUDIT_ROLE, which decides how the
// script filters steps; disagreeing would audit one role's steps in another's UI.
// Set both (e.g. AUDIT_ROLE=contractor VIEW_AS=contractor).
const VIEW_AS = process.env.VIEW_AS
const VIEW_AS_MENU: Record<string, RegExp> = {
  owner: /^Owner$/i,
  admin: /^Admin$/i,
  contractor: /^Contractor \(generic\)$/i,
}
if (VIEW_AS && !VIEW_AS_MENU[VIEW_AS]) {
  console.error(`VIEW_AS must be one of ${Object.keys(VIEW_AS_MENU).join('|')}, got "${VIEW_AS}"`)
  process.exit(1)
}
if (VIEW_AS && VIEW_AS !== AUDIT_ROLE) {
  console.error(`VIEW_AS "${VIEW_AS}" must match AUDIT_ROLE "${AUDIT_ROLE}"`)
  process.exit(1)
}

// Walkthrough id → launching article slug, derived from the articles' own
// `walkthrough:` declarations (integrity.test.ts enforces the bijection) —
// a hand-maintained copy here is how a new tour silently goes unaudited.
const ARTICLE_FOR: Record<string, string> = Object.fromEntries(
  HELP_ARTICLES.filter((a) => a.walkthrough).map((a) => [a.walkthrough as string, a.slug])
)

type StepResult = {
  index: number
  title: string
  expectedElement: string | null
  status: 'ok' | 'fail'
  problems: string[]
  highlighted: null | { tag: string; id: string | null; dataTour: string | null; href: string | null; rect: { x: number; y: number; w: number; h: number } }
  progressText: string | null
  msToReady: number
  screenshot: string
}

// NOTE: page functions are passed as STRINGS throughout this script. tsx/esbuild
// rewrites function expressions with a __name() helper that doesn't exist inside
// the browser, so serialized closures throw ReferenceError there.
type PopoverState = {
  title: string | null
  progress: string | null
  nextBtn: string | null
  highlighted: null | { tag: string; id: string | null; dataTour: string | null; href: string | null; rect: { x: number; y: number; w: number; h: number } }
}
function popoverState(page: Page): Promise<PopoverState> {
  return page.evaluate(`(() => {
    // driver.js highlights an invisible dummy element for element-less
    // (intentionally centered) steps — that counts as "no highlight".
    let active = document.querySelector('.driver-active-element')
    if (active && active.id === 'driver-dummy-element') active = null
    const rect = active ? active.getBoundingClientRect() : null
    return {
      title: document.querySelector('.driver-popover-title')?.textContent ?? null,
      progress: document.querySelector('.driver-popover-progress-text')?.textContent ?? null,
      nextBtn: document.querySelector('.driver-popover-next-btn')?.textContent ?? null,
      highlighted: active
        ? {
            tag: active.tagName.toLowerCase(),
            id: active.id || null,
            dataTour: active.getAttribute('data-tour'),
            href: active.getAttribute('href'),
            rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          }
        : null,
    }
  })()`) as Promise<PopoverState>
}

mkdirSync(OUT, { recursive: true })
// VIEWPORT=mobile audits the phone layout (off-canvas nav drawer, FAB).
const isMobile = process.env.VIEWPORT === 'mobile'
const viewport = isMobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }
const browser = await chromium.launch()
const page = await browser.newPage({ viewport, ...(isMobile ? { hasTouch: true, isMobile: true } : {}) })
const consoleErrors: string[] = []
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

// Since the cert switch there is no DEV_AUTO_LOGIN: pass AUDIT_EMAIL +
// AUDIT_PASSWORD to log in through the UI first (one login per run — repeated
// logins hit Supabase auth rate limits). Local dev skips the MFA challenge, so
// email+password is enough even for MFA-enrolled accounts.
const audEmail = process.env.AUDIT_EMAIL
const audPassword = process.env.AUDIT_PASSWORD
if (audEmail && audPassword) {
  await page.goto(BASE + '/login/', { waitUntil: 'networkidle' })
  await page.fill('#email', audEmail)
  await page.fill('#password', audPassword)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard/', { timeout: 45000 })
  console.log(`logged in as ${audEmail}`)
}

/** Switch the header's "View As" menu to VIEW_AS (no-op when unset). */
async function applyViewAs() {
  if (!VIEW_AS) return
  const pattern = VIEW_AS_MENU[VIEW_AS]
  // Desktop: the header's View As button. Mobile (2026-08-05 shell): the
  // switcher lives inside the avatar "Account menu" as a submenu — open the
  // menu, then hover/click the View As sub-trigger to reveal the role items.
  const desktopTrigger = page.locator('header button:has(svg.lucide-eye)').first()
  if (await desktopTrigger.isVisible().catch(() => false)) {
    await desktopTrigger.click()
  } else {
    await page.locator('header [aria-label="Account menu"]').click()
    await page.waitForTimeout(250)
    await page.locator('[data-tour="view-as-switcher"]:visible').first().click()
  }
  await page.waitForTimeout(350)
  for (const item of await page.getByRole('menuitem').all()) {
    if (pattern.test(((await item.textContent()) || '').trim())) {
      await item.click()
      await page.waitForTimeout(800)
      return
    }
  }
  throw new Error(`View As menu has no item matching ${pattern} (is this login an owner/developer?)`)
}

// Pre-warm every route the tours visit so on-demand dev compilation doesn't
// eat into the provider's 2.5s element-ready timeout.
const warmPaths = new Set<string>(['/dashboard/', '/help/getting-started/'])
for (const w of ALL_WALKTHROUGHS) for (const s of w.steps) warmPaths.add(s.href.split('?')[0])
for (const p of warmPaths) {
  await page.goto(BASE + p, { waitUntil: 'networkidle' })
}

// Resilience probes: walkthrough id → the step after which to dismiss the
// dialog the tour is touring. These tours describe fields that live inside a
// Radix dialog, and a user can close it mid-tour (its X, Escape). That used to
// be unrecoverable — the page auto-opened the form once per mount, so every
// later step highlighted nothing and showed the "can't see a highlight?" note.
// The steps after the probe are asserted normally, so a regression reads as
// "no element highlighted" rather than passing silently on the happy path.
const DISMISS_PROBE: Record<string, number> = { 'edit-service-type': 4 }

const results: { id: string; steps: StepResult[]; endedCleanly: boolean }[] = []

const only = process.env.ONLY?.split(',')
const skipped: string[] = []
for (const w of ALL_WALKTHROUGHS) {
  if (only && !only.includes(w.id)) continue
  if (!audienceAllows(w.audience, AUDIT_FLAGS)) {
    // e.g. my-earnings under the default owner role. Rerun as that audience —
    // AUDIT_ROLE=contractor VIEW_AS=contractor covers it from this same login.
    skipped.push(w.id)
    console.log(`\n=== ${w.id} — SKIPPED (audience ${w.audience} not auditable as ${AUDIT_ROLE}) ===`)
    continue
  }
  // Audit exactly the steps the provider would run for this role.
  const auditSteps = visibleWalkthroughSteps(w.steps, AUDIT_FLAGS)
  const article = ARTICLE_FOR[w.id]
  const steps: StepResult[] = []
  let endedCleanly = false
  console.log(`\n=== ${w.id} (${auditSteps.length} steps) ===`)

  if (!article) {
    console.log(`  FAIL no launching article declares walkthrough: '${w.id}'`)
    results.push({ id: w.id, steps, endedCleanly: false })
    continue
  }

  await page.goto(`${BASE}/help/${article}/`, { waitUntil: 'networkidle' })
  // "View As" is React context state, so a full page load resets it — re-apply it
  // on every article load, before reading which tours the page offers.
  await applyViewAs()
  const startBtn = page.getByRole('button', { name: 'Start Interactive Walkthrough' })
  // Missing button = role/audience mismatch or article gating — record the
  // tour as failed and keep auditing the rest instead of crashing the run.
  try {
    await startBtn.click({ timeout: 15000 })
  } catch {
    console.log(`  FAIL Start button not found on /help/${article}/ (role mismatch or article hidden for ${AUDIT_ROLE})`)
    results.push({ id: w.id, steps, endedCleanly: false })
    continue
  }

  for (let i = 0; i < auditSteps.length; i++) {
    const step = auditSteps[i]
    const t0 = Date.now()
    const problems: string[] = []
    let state: Awaited<ReturnType<typeof popoverState>> = { title: null, progress: null, nextBtn: null, highlighted: null }
    try {
      await page.waitForFunction(
        `document.querySelector('.driver-popover-title')?.textContent === ${JSON.stringify(step.title)}`,
        null,
        { timeout: 15000 }
      )
      // let driver's highlight transition + provider's scroll settle
      await page.waitForTimeout(450)
      state = await popoverState(page)
    } catch (e) {
      state = await popoverState(page)
      problems.push(`title wait failed: ${(e as Error).message.split('\n')[0]} (dom title now: "${state.title}")`)
    }
    const msToReady = Date.now() - t0

    const expectedProgress = `${i + 1} of ${auditSteps.length}`
    if (state.progress && state.progress !== expectedProgress) {
      problems.push(`progress "${state.progress}" != "${expectedProgress}"`)
    }
    if (state.title && state.nextBtn !== step.ctaLabel) {
      problems.push(`next button "${state.nextBtn}" != ctaLabel "${step.ctaLabel}"`)
    }

    if (step.element) {
      if (!state.highlighted) {
        problems.push(`no element highlighted (fell back to centered popover); wanted "${step.element}"`)
      } else {
        const matches = await page.evaluate(`(() => {
          const active = document.querySelector('.driver-active-element')
          if (!active) return false
          return ${JSON.stringify(step.element)}.split(',').map((s) => s.trim()).filter(Boolean)
            .some((s) => { try { return active.matches(s) } catch { return false } })
        })()`)
        if (!matches) problems.push(`highlighted element does not match "${step.element}"`)
        const r = state.highlighted.rect
        if (r.y + r.h < 0 || r.y > viewport.height || r.x + r.w < 0 || r.x > viewport.width) {
          problems.push(`highlighted element out of viewport (rect ${JSON.stringify(r)})`)
        }
      }
    } else if (state.highlighted) {
      problems.push(`expected centered popover but an element is highlighted: ${JSON.stringify(state.highlighted)}`)
    }

    const shot = join(OUT, `${isMobile ? 'mobile-' : ''}${w.id}-step${i + 1}.png`)
    await page.screenshot({ path: shot })
    steps.push({
      index: i + 1, title: step.title, expectedElement: step.element ?? null,
      status: problems.length ? 'fail' : 'ok', problems,
      highlighted: state.highlighted, progressText: state.progress, msToReady, screenshot: shot,
    })
    console.log(`  ${problems.length ? 'FAIL' : ' ok '} ${i + 1}/${auditSteps.length} ${step.title} (${msToReady}ms)${problems.length ? ' — ' + problems.join('; ') : ''}`)

    await page.locator('.driver-popover-next-btn').click()

    if (DISMISS_PROBE[w.id] === i + 1) {
      await page.evaluate(`(() => {
        const openDialogs = Array.from(document.querySelectorAll('[role="dialog"]'))
        // The tour's own popover is also role="dialog" — pick the app's.
        const form = openDialogs.find((d) => !d.classList.contains('driver-popover'))
        form?.querySelector('[data-slot="dialog-close"]')?.click()
      })()`)
      console.log(`  .... dismissed the dialog after step ${i + 1} (resilience probe)`)
    }
  }

  try {
    await page.waitForFunction(`!document.querySelector('.driver-popover')`, null, { timeout: 8000 })
    endedCleanly = true
  } catch {
    console.log('  FAIL popover still open after final step')
    await page.evaluate(`document.querySelector('.driver-popover-close-btn')?.click()`)
  }
  results.push({ id: w.id, steps, endedCleanly })
}

await browser.close()

const failCount = results.reduce((n, r) => n + r.steps.filter((s) => s.status === 'fail').length, 0) +
  results.filter((r) => !r.endedCleanly).length
writeFileSync(join(OUT, 'walkthrough-results.json'), JSON.stringify({ results, skipped, consoleErrors }, null, 2))
console.log(`\n${failCount === 0 ? 'ALL PASS' : failCount + ' FAILURES'} across ${results.length} walkthroughs; results in ${OUT}/walkthrough-results.json`)
if (skipped.length) {
  // Name the audiences actually missing, so the hint is a command to run rather
  // than a generic example (which read as "rerun what you just ran").
  const missing = [...new Set(
    skipped.map((id) => ALL_WALKTHROUGHS.find((w) => w.id === id)?.audience).filter(Boolean)
  )] as string[]
  console.log(
    `UNVERIFIED — ${skipped.length} tour(s) whose audience isn't ${AUDIT_ROLE}: ${skipped.join(', ')}\n` +
    missing.map((a) => `  still to run: AUDIT_ROLE=${a} VIEW_AS=${a}`).join('\n')
  )
}
if (consoleErrors.length) console.log('page errors:', consoleErrors.slice(0, 10))
process.exit(failCount === 0 ? 0 : 1)
