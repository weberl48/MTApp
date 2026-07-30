// Build the admin onboarding guide: inline screenshots into a self-contained
// HTML, then print it to PDF with Playwright's bundled Chromium.
//
//   node scripts/build-onboarding-guide.mjs
//
// Source:      docs/onboarding/guide-src.html ({{SS}}/name.png placeholders)
// Screenshots: docs/feature-tour/screenshots/
// Outputs:     docs/onboarding/MCA-Admin-Onboarding-Guide.{html,pdf}
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(repo, 'docs/onboarding')
const shotsDir = join(repo, 'docs/feature-tour/screenshots')
const outHtml = join(outDir, 'MCA-Admin-Onboarding-Guide.html')
const outPdf = join(outDir, 'MCA-Admin-Onboarding-Guide.pdf')

let html = readFileSync(join(outDir, 'guide-src.html'), 'utf8')
const used = new Set()
html = html.replace(/\{\{SS\}\}\/([\w.-]+\.png)/g, (_, name) => {
  used.add(name)
  const b64 = readFileSync(join(shotsDir, name)).toString('base64')
  return `data:image/png;base64,${b64}`
})
console.log(`inlined ${used.size} screenshots`)

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
