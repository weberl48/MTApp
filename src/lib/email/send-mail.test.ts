import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PILOT_ENV_VAR } from './pilot'

/**
 * Coverage for the wiring, not the policy.
 *
 * `pilot.test.ts` proves `applyPilotRedirect()` computes the right answer.
 * These tests prove `sendMail()` actually hands that answer to Resend — the
 * step where a redirect that is computed correctly but never applied would
 * still mail a real client.
 */

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('resend', () => ({
  // A class, not vi.fn(() => ...) — the SDK is invoked with `new`, and an
  // arrow-function implementation is not a constructor.
  Resend: class {
    emails = { send: mockSend }
  },
}))

// Imported after the mock is registered.
const { sendMail } = await import('./index')

const ORIGINAL_ENV = { ...process.env }

const HTML_DOC = '<!DOCTYPE html><html><head></head><body style="margin:0"><p>Body copy</p></body></html>'

function baseArgs() {
  return {
    to: 'client@example.com',
    subject: 'Invoice 1043',
    html: HTML_DOC,
    text: 'Body copy',
  }
}

/** The payload Resend was actually called with. */
function sentPayload() {
  expect(mockSend).toHaveBeenCalledTimes(1)
  return mockSend.mock.calls[0][0]
}

beforeEach(() => {
  mockSend.mockReset()
  mockSend.mockResolvedValue({ data: { id: 'msg_1' }, error: null })
  process.env.RESEND_API_KEY = 'test-key'
  process.env.EMAIL_FROM_DOMAIN = 'maycreativearts.com'
  delete process.env[PILOT_ENV_VAR]
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('sendMail — pilot mode off', () => {
  it('delivers to the real recipient with an untouched subject and body', async () => {
    await sendMail(baseArgs())

    const payload = sentPayload()
    expect(payload.to).toEqual(['client@example.com'])
    expect(payload.subject).toBe('Invoice 1043')
    expect(payload.html).toBe(HTML_DOC)
    expect(payload.text).toBe('Body copy')
  })

  it('omits the attachments key entirely when there are none', async () => {
    await sendMail({ ...baseArgs(), attachments: [] })
    expect(sentPayload()).not.toHaveProperty('attachments')
  })
})

describe('sendMail — pilot mode on', () => {
  beforeEach(() => {
    process.env[PILOT_ENV_VAR] = 'a@mca.test, b@mca.test'
  })

  it('replaces the recipients with the pilot list', async () => {
    await sendMail(baseArgs())

    const payload = sentPayload()
    expect(payload.to).toEqual(['a@mca.test', 'b@mca.test'])
    // The real client must not appear anywhere in the envelope.
    expect(payload.to).not.toContain('client@example.com')
  })

  it('names the intended recipient in the subject', async () => {
    await sendMail(baseArgs())
    expect(sentPayload().subject).toBe('[PILOT → client@example.com] Invoice 1043')
  })

  it('injects the banner immediately after <body>, not before <!DOCTYPE>', async () => {
    await sendMail(baseArgs())

    const { html } = sentPayload()
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html).toContain('not delivered to the client')
    // Banner must land inside the document body, ahead of the original content.
    expect(html.indexOf('not delivered to the client')).toBeGreaterThan(html.indexOf('<body'))
    expect(html.indexOf('not delivered to the client')).toBeLessThan(html.indexOf('Body copy'))
  })

  it('prepends the banner for a fragment with no <body> (the reminder cron)', async () => {
    await sendMail({ ...baseArgs(), html: '<div>Reminder</div>' })

    const { html } = sentPayload()
    expect(html).toContain('not delivered to the client')
    expect(html.indexOf('not delivered to the client')).toBeLessThan(html.indexOf('<div>Reminder</div>'))
  })

  it('prepends the plain-text banner naming the intended recipient', async () => {
    await sendMail(baseArgs())

    const { text } = sentPayload()
    expect(text).toContain('PILOT MODE')
    expect(text).toContain('client@example.com')
    expect(text.trimStart().startsWith('***')).toBe(true)
    expect(text).toContain('Body copy')
  })

  it('still carries attachments through', async () => {
    await sendMail({
      ...baseArgs(),
      attachments: [{ filename: 'invoice-1043.pdf', content: Buffer.from('pdf') }],
    })
    expect(sentPayload().attachments).toHaveLength(1)
  })

  it('redirects a multi-recipient message and lists both in the subject', async () => {
    await sendMail({ ...baseArgs(), to: ['one@example.com', 'two@example.com'] })

    const payload = sentPayload()
    expect(payload.to).toEqual(['a@mca.test', 'b@mca.test'])
    expect(payload.subject).toBe('[PILOT → one@example.com, two@example.com] Invoice 1043')
  })

  it('refuses to send when the pilot list is set but unusable', async () => {
    process.env[PILOT_ENV_VAR] = 'not-an-address'
    await expect(sendMail(baseArgs())).rejects.toThrow(/no usable email address/)
    // The critical property: nothing was handed to Resend at all.
    expect(mockSend).not.toHaveBeenCalled()
  })
})

describe('sendMail — pilotExempt', () => {
  beforeEach(() => {
    process.env[PILOT_ENV_VAR] = 'a@mca.test'
  })

  it('delivers to the real recipient with no banner and no subject prefix', async () => {
    await sendMail({ ...baseArgs(), to: 'owner@maycreativearts.com', pilotExempt: true })

    const payload = sentPayload()
    expect(payload.to).toEqual(['owner@maycreativearts.com'])
    expect(payload.subject).toBe('Invoice 1043')
    expect(payload.html).toBe(HTML_DOC)
    expect(payload.text).toBe('Body copy')
  })
})

describe('sendMail — failure handling', () => {
  it('throws when Resend reports an error so callers keep their retry/logging', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'domain not verified', name: 'x' } })
    await expect(sendMail(baseArgs())).rejects.toMatchObject({ message: 'domain not verified' })
  })
})
