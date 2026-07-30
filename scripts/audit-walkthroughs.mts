// Audit every in-app walkthrough against a running dev server (localhost:3000,
// DEV_AUTO_LOGIN). For each tour: start it from its help article, step through
// all steps, and verify the popover shows the right step and the highlight
// lands on the element the definition asks for (or is intentionally centered).
//
//   npx tsx scripts/audit-walkthroughs.mts [outDir]
//
// Writes walkthrough-results.json + per-step screenshots to outDir (default
// .walkthrough-audit/). Exits 1 if any step fails.
import { chromium, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ALL_WALKTHROUGHS } from '../src/components/walkthroughs/walkthroughs/index'

const BASE = process.env.APP_URL || 'http://localhost:3000'
const OUT = process.argv[2] || '.walkthrough-audit'

const ARTICLE_FOR: Record<string, string> = {
  'app-overview': 'getting-started',
  'add-client': 'adding-a-client',
  'log-session': 'logging-a-session',
  'invite-contractor': 'inviting-team-members',
  'configure-services': 'configuring-services',
  'edit-service-type': 'editing-service-types',
  'approve-sessions': 'approving-sessions',
  'scholarship-billing': 'scholarship-billing',
}

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

// Pre-warm every route the tours visit so on-demand dev compilation doesn't
// eat into the provider's 2.5s element-ready timeout.
const warmPaths = new Set<string>(['/dashboard/', '/help/getting-started/'])
for (const w of ALL_WALKTHROUGHS) for (const s of w.steps) warmPaths.add(s.href.split('?')[0])
for (const p of warmPaths) {
  await page.goto(BASE + p, { waitUntil: 'networkidle' })
}

const results: { id: string; steps: StepResult[]; endedCleanly: boolean }[] = []

const only = process.env.ONLY?.split(',')
for (const w of ALL_WALKTHROUGHS) {
  if (only && !only.includes(w.id)) continue
  const article = ARTICLE_FOR[w.id]
  const steps: StepResult[] = []
  let endedCleanly = false
  console.log(`\n=== ${w.id} (${w.steps.length} steps) ===`)

  await page.goto(`${BASE}/help/${article}/`, { waitUntil: 'networkidle' })
  const startBtn = page.getByRole('button', { name: 'Start Interactive Walkthrough' })
  await startBtn.click()

  for (let i = 0; i < w.steps.length; i++) {
    const step = w.steps[i]
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

    const expectedProgress = `${i + 1} of ${w.steps.length}`
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
    console.log(`  ${problems.length ? 'FAIL' : ' ok '} ${i + 1}/${w.steps.length} ${step.title} (${msToReady}ms)${problems.length ? ' — ' + problems.join('; ') : ''}`)

    await page.locator('.driver-popover-next-btn').click()
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
writeFileSync(join(OUT, 'walkthrough-results.json'), JSON.stringify({ results, consoleErrors }, null, 2))
console.log(`\n${failCount === 0 ? 'ALL PASS' : failCount + ' FAILURES'} across ${results.length} walkthroughs; results in ${OUT}/walkthrough-results.json`)
if (consoleErrors.length) console.log('page errors:', consoleErrors.slice(0, 10))
process.exit(failCount === 0 ? 0 : 1)
