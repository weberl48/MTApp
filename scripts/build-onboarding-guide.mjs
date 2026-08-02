// Build the admin onboarding guide: inline screenshots into a self-contained
// HTML, then print it to PDF with Playwright's bundled Chromium.
//
//   node scripts/build-onboarding-guide.mjs
//
// Source:      docs/onboarding/guide-src.html ({{SS}}/name.png placeholders)
// Screenshots: docs/feature-tour/screenshots/
// Outputs:     docs/onboarding/MCA-Admin-Onboarding-Guide.{html,pdf}
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(repo, 'docs/onboarding')
const outHtml = join(outDir, 'MCA-Admin-Onboarding-Guide.html')
const outPdf = join(outDir, 'MCA-Admin-Onboarding-Guide.pdf')

// Screenshot search path, most-preferred first.
//
// admin-guide/ holds shots taken from the LOCAL stack as a real admin: fake
// seed data (no PHI at all) and the true admin view, with owner-only surfaces
// genuinely absent rather than cropped out. feature-tour/ is the older set,
// captured as an owner against cert — real client names — so it is the
// fallback, used only where no admin equivalent has been captured yet.
const shotDirs = [join(repo, 'docs/admin-guide/screenshots'), join(repo, 'docs/feature-tour/screenshots')]

function findShot(name) {
  for (const dir of shotDirs) {
    const path = join(dir, name)
    if (existsSync(path)) return { path, dir }
  }
  throw new Error(`screenshot not found in any source dir: ${name}`)
}

let html = readFileSync(join(outDir, 'guide-src.html'), 'utf8')
const fromAdmin = new Set()
const fromTour = new Set()
html = html.replace(/\{\{SS\}\}\/([\w.-]+\.png)/g, (_, name) => {
  const { path, dir } = findShot(name)
  ;(dir === shotDirs[0] ? fromAdmin : fromTour).add(name)
  return `data:image/png;base64,${readFileSync(path).toString('base64')}`
})
console.log(`inlined ${fromAdmin.size + fromTour.size} screenshots ` +
  `(${fromAdmin.size} admin/local, ${fromTour.size} legacy tour/cert)`)
if (fromTour.size) console.log('  still on legacy cert shots:', [...fromTour].join(', '))

writeFileSync(outHtml, html)

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('file:///' + outHtml.replace(/\\/g, '/'))
await page.pdf({
  path: outPdf,
  format: 'Letter',
  printBackground: true,
  margin: { top: '0.5in', bottom: '0.6in', left: '0.5in', right: '0.5in' },
})
await browser.close()
console.log('wrote', outHtml, 'and', outPdf)
