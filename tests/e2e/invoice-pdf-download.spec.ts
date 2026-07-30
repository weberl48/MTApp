import { test, expect } from '@playwright/test'
import { login } from './helpers'

/**
 * Regression: invoice PDFs downloaded as extension-less blob UUIDs.
 *
 * Every download site used to call `URL.revokeObjectURL(url)` on the line right
 * after `a.click()`. That revoke races the browser's asynchronous download —
 * Chrome loses the anchor's `download` attribute and saves the file as the bare
 * blob UUID with no extension (e.g. `7e4136a1-7998-4048-bf35-48e74cd7d33e`).
 * The bytes arrive intact so the browser reports "Done", but Windows treats an
 * extension-less download as untrusted and commonly quarantines it, so the file
 * never lands in the Downloads folder.
 *
 * Asserting on `suggestedFilename()` is the point of this spec: it is the name
 * the browser would actually write to disk, which is exactly what regressed.
 * A unit test on the helper cannot catch a real Chromium download naming it.
 */
test.describe('Invoice PDF download', () => {
  test('saves with a .pdf filename, not a bare blob UUID', async ({ page }) => {
    await login(page)

    // Open the first invoice. Rows are not anchors — they are role="link"
    // TableRows that router.push() on click.
    await page.goto('/invoices/')
    const firstRow = page.getByRole('link', { name: /^Open invoice for/i }).first()

    // The list loads client-side, and locator.count() does NOT auto-wait — so
    // wait for a row explicitly rather than reading a count that is always 0.
    try {
      await firstRow.waitFor({ state: 'visible', timeout: 20000 })
    } catch {
      // Nothing to bill against in this environment — nothing to assert.
      test.skip(true, 'no invoices seeded in this environment')
      return
    }

    await firstRow.click()
    await page.waitForURL(/\/invoices\/[0-9a-f-]{36}\//i)

    await page.getByRole('button', { name: /invoice actions menu/i }).first().click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('menuitem', { name: /download pdf/i }).click()
    const download = await downloadPromise

    const filename = download.suggestedFilename()

    // The actual regression: a bare UUID with no extension.
    expect(filename).not.toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
    expect(filename).toMatch(/\.pdf$/i)
    expect(filename).toMatch(/^invoice-/i)

    // And it must be a real PDF, not an empty or truncated file — the other
    // failure mode of revoking the blob URL too early.
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    const bytes = Buffer.concat(chunks)

    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-')
    expect(bytes.byteLength).toBeGreaterThan(1000)
  })
})
