import { test, expect, Page, Locator } from '@playwright/test'
import { login, selectFirstClient, TEST_PASSWORD } from './helpers'

// Test credentials - use environment variables in CI

/**
 * Helper: Pick the first available individual service type (no headcount field).
 * Same approach as session-creation.spec.ts.
 */
async function selectIndividualServiceType(page: Page): Promise<string | null> {
  const trigger = page.locator('[data-tour="session-form-service-type"] button[role="combobox"]')
  await trigger.click()

  const options = page.getByRole('option')
  const count = await options.count()

  for (let i = 0; i < count; i++) {
    const optionText = await options.nth(i).textContent()
    await options.nth(i).click()

    const headcountField = page.locator('#groupHeadcount')
    const isGroup = await headcountField.isVisible().catch(() => false)
    if (!isGroup) {
      return optionText?.trim() || null
    }
    await trigger.click()
  }
  return null
}

/** Resolves true/false without throwing, waiting briefly for the element to appear. */
async function isVisibleWithin(locator: Locator, timeout: number): Promise<boolean> {
  return locator.waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false)
}

/**
 * Helper: Set the session form's draft/submitted status, tolerating both UIs the form
 * can render for it.
 *
 * `input[name="status"]` radios only render for roles with `financial:view-details`
 * (developer/owner). Other roles (admin/contractor) see a text-link toggle instead —
 * "Saving as draft (not submitted)" + "Submit instead", or "Save as draft instead?"
 * (session-form.tsx ~1160-1201). Try the radio first; fall back to the text toggle;
 * if neither control is present, fail loudly instead of a raw locator timeout.
 */
async function setSessionStatus(page: Page, target: 'draft' | 'submitted') {
  const radio = page.locator(`input[name="status"][value="${target}"]`)
  if (await isVisibleWithin(radio, 1500)) {
    await radio.check()
    return
  }

  // Text-toggle fallback. The banner only renders when the current status is 'draft'.
  const draftBanner = page.getByText('Saving as draft (not submitted)')
  const submitInsteadLink = page.getByRole('button', { name: /submit instead/i })
  const draftInsteadLink = page.getByRole('button', { name: /save as draft instead/i })

  const bannerVisible = await isVisibleWithin(draftBanner, 1000)
  const submitLinkVisible = await isVisibleWithin(submitInsteadLink, 500)
  const draftLinkVisible = await isVisibleWithin(draftInsteadLink, 500)

  if (!bannerVisible && !submitLinkVisible && !draftLinkVisible) {
    throw new Error(
      `setSessionStatus("${target}"): no status control found on the form — neither the ` +
      `"status" radio inputs nor the draft/submit text-link toggle are visible.`
    )
  }

  const isCurrentlyDraft = bannerVisible
  if (target === 'draft' && !isCurrentlyDraft) {
    await draftInsteadLink.click()
  } else if (target === 'submitted' && isCurrentlyDraft) {
    await submitInsteadLink.click()
  }
  // else: already at the target status — nothing to click.
}

test.describe('P0 regression: draft submitted later still gets an invoice', () => {
  test.beforeEach(async () => {
    if (!TEST_PASSWORD) {
      test.skip()
    }
  })

  test('save as draft, then submit via edit — invoice is created', async ({ page }) => {
    await login(page)
    await page.goto('/sessions/new/')
    await page.waitForSelector('[data-tour="session-form-service-type"]', { timeout: 10000 })

    await page.fill('#time', '08:15')
    const serviceType = await selectIndividualServiceType(page)
    if (!serviceType) {
      test.skip()
      return
    }
    await selectFirstClient(page)
    await page.waitForTimeout(500)

    // Notes: required at submit time when the org's require_notes setting is on
    // (it is for this org). Fill them at creation so the later edit-submit passes.
    await page.getByPlaceholder('Internal notes (not visible to client)...').fill('e2e resubmit regression - internal')
    await page.getByPlaceholder('Notes visible to client in their portal...').fill('e2e resubmit regression - client note')

    // Save as DRAFT
    await setSessionStatus(page, 'draft')

    // Capture the created session's id straight off the Supabase insert response — the
    // form's success screen never surfaces it. Matching the sessions-list row on this exact
    // id (rather than "first row tagged draft") means the click below can ONLY ever land on
    // the draft this test just created, never an unrelated real draft: an owner sees every
    // draft in the org sorted by date desc, and .env.local points at prod Supabase, so a
    // position-based pick risks opening (and later submitting) someone else's real session.
    const [sessionInsertResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/rest/v1/sessions') && res.request().method() === 'POST'),
      page.locator('[data-tour="session-form-submit"]').click(),
    ])
    const createdSession = await sessionInsertResponse.json().catch(() => null)
    const sessionId: string | undefined = createdSession?.id
    if (!sessionId) {
      throw new Error(
        'session-resubmit-invoice: could not read the created session id from the Supabase ' +
        'insert response. Refusing to fall back to "first draft in the list" — that could ' +
        'open and mutate an unrelated real draft.'
      )
    }
    await expect(page.getByText('Session Logged!')).toBeVisible({ timeout: 15000 })

    // Open the draft we just created, matched by its exact id (from the row's href) — never
    // by position or a "looks like a draft" text heuristic.
    await page.goto('/sessions/')
    const draftRow = page.locator(`a[href="/sessions/${sessionId}/"]`)
    await draftRow.waitFor({ timeout: 10000 })
    await draftRow.click()
    await page.waitForURL(`**/sessions/${sessionId}/`, { timeout: 10000 })

    // Edit → switch to Submit for approval → save. Edit lives in the "More
    // actions" menu since the 2026-08-04 session-detail distill (the old
    // six-button header wall was reduced to Approve/Request Revision + menu).
    await page.getByRole('button', { name: 'More actions' }).click()
    await page.getByRole('menuitem', { name: /edit/i }).click()
    await page.waitForSelector('[data-tour="session-form-service-type"]', { timeout: 10000 })
    await setSessionStatus(page, 'submitted')
    await page.locator('[data-tour="session-form-submit"]').click()

    // The fix's direct signal: the edit path reports invoice creation
    await expect(page.getByText(/session updated and invoice(s)? created/i)).toBeVisible({ timeout: 15000 })

    // Second signal: back on the detail page, no "Create Invoice" recovery button.
    // The detail page fetches session data client-side (useEffect) and renders only a
    // spinner until it resolves — the Create Invoice button is absent during that load
    // for the wrong reason, which would make the assertion below pass vacuously. Wait
    // for the status badge (present once session data has loaded; 'approved' is included
    // because auto_approve_sessions can flip a submit straight to approved) before
    // asserting anything is NOT visible.
    await page.waitForURL(/\/sessions\/[0-9a-f-]+\//, { timeout: 10000 })
    await expect(page.getByText(/submitted|approved/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /create invoice/i })).not.toBeVisible()
  })
})
