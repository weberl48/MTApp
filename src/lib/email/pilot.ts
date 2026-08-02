/**
 * Pilot mode — the phase-1 "guardrails" switch.
 *
 * While `EMAIL_PILOT_REDIRECT_TO` is set, every client-facing email is
 * delivered to that fixed list of internal testers instead of the real
 * recipient, with the intended recipient named in the subject and in a banner
 * at the top of the body. Unset the variable and the whole mechanism goes
 * inert — there is no second flag to remember and no code path that behaves
 * differently once it is gone.
 *
 * Two deliberate design choices:
 *
 * 1. **Redirect is default-on for new senders.** The wrapper in `./index.ts`
 *    applies this to everything; a sender must pass `pilotExempt` to opt out.
 *    The alternative polarity — senders opting in — means the next sender
 *    someone adds quietly mails a real client.
 *
 * 2. **A set-but-unusable value throws instead of falling through.** If the
 *    variable is present but contains no parseable address (a typo, a stray
 *    quote, a shell that ate the commas), treating it as "off" would mail the
 *    real client at exactly the moment an operator believed they were
 *    protected. Same reasoning as `getFromAddress()` refusing to fall back to
 *    a default domain.
 */

export const PILOT_ENV_VAR = 'EMAIL_PILOT_REDIRECT_TO'

/** Max intended recipients named in the subject before it is elided. */
const SUBJECT_RECIPIENT_LIMIT = 2

/**
 * True when the operator has asked for pilot mode, regardless of whether the
 * value parses. Kept separate from `getPilotRecipients()` so an unusable value
 * reads as "on but broken" rather than "off".
 */
export function isPilotModeActive(): boolean {
  return (process.env[PILOT_ENV_VAR] ?? '').trim().length > 0
}

/**
 * Parse the configured recipients. Accepts commas, semicolons and whitespace
 * as separators so a value pasted out of an email client still works.
 * Case-insensitively deduped, original casing preserved.
 */
export function getPilotRecipients(): string[] {
  const raw = process.env[PILOT_ENV_VAR]
  if (!raw) return []

  const seen = new Set<string>()
  const recipients: string[] = []

  for (const part of raw.split(/[,;\s]+/)) {
    const address = part.trim().replace(/^["'<]+|[">']+$/g, '')
    // Deliberately not a full RFC check — we only need to reject values that
    // could not possibly be addresses, so a typo fails loudly upstream.
    if (!address || !address.includes('@') || address.startsWith('@') || address.endsWith('@')) {
      continue
    }
    const key = address.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    recipients.push(address)
  }

  return recipients
}

function normalizeRecipients(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to]).map((address) => address.trim()).filter(Boolean)
}

function describeRecipients(recipients: string[]): string {
  if (recipients.length === 0) return 'an unknown recipient'
  if (recipients.length <= SUBJECT_RECIPIENT_LIMIT) return recipients.join(', ')
  const shown = recipients.slice(0, SUBJECT_RECIPIENT_LIMIT).join(', ')
  return `${shown} +${recipients.length - SUBJECT_RECIPIENT_LIMIT} more`
}

export interface PilotRedirectResult {
  /** Who the message should actually be sent to. */
  to: string[]
  /** Subject to send, prefixed when redirected. */
  subject: string
  /** Whether a redirect was applied. */
  redirected: boolean
  /** Who the message was addressed to before the redirect. */
  originalTo: string[]
  /** HTML block to prepend to the body (empty when not redirected). */
  htmlBanner: string
  /** Plain-text block to prepend to the body (empty when not redirected). */
  textBanner: string
}

/**
 * Resolve the real delivery target for a message.
 *
 * @throws when pilot mode is switched on but its recipient list is unusable.
 */
export function applyPilotRedirect(to: string | string[], subject: string): PilotRedirectResult {
  const originalTo = normalizeRecipients(to)

  if (!isPilotModeActive()) {
    return {
      to: originalTo,
      subject,
      redirected: false,
      originalTo,
      htmlBanner: '',
      textBanner: '',
    }
  }

  const pilotRecipients = getPilotRecipients()
  if (pilotRecipients.length === 0) {
    throw new Error(
      `${PILOT_ENV_VAR} is set but contains no usable email address — refusing to send. ` +
        'Fix the value (comma-separated addresses) or unset it to resume normal delivery.'
    )
  }

  const intended = describeRecipients(originalTo)

  return {
    to: pilotRecipients,
    subject: `[PILOT → ${intended}] ${subject}`,
    redirected: true,
    originalTo,
    htmlBanner: buildHtmlBanner(intended),
    textBanner: buildTextBanner(intended),
  }
}

/**
 * The Square path can only address one customer, and Square — not this app —
 * sends that mail. Returns the address to substitute, or null when pilot mode
 * is off.
 *
 * @throws when pilot mode is switched on but its recipient list is unusable.
 */
export function getPilotSquareRecipient(): string | null {
  if (!isPilotModeActive()) return null

  const pilotRecipients = getPilotRecipients()
  if (pilotRecipients.length === 0) {
    throw new Error(
      `${PILOT_ENV_VAR} is set but contains no usable email address — refusing to create a Square invoice. ` +
        'Fix the value (comma-separated addresses) or unset it to resume normal delivery.'
    )
  }

  return pilotRecipients[0]
}

function buildHtmlBanner(intended: string): string {
  // Inline styles only — every mail client strips <style> blocks.
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-bottom: 3px solid #d97706;">
  <tr>
    <td style="padding: 16px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
      <p style="margin: 0 0 4px; color: #92400e; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        Pilot mode — this email was not delivered to the client
      </p>
      <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 20px;">
        It would have gone to <strong>${intended}</strong>. You are seeing it because the app is
        running with client email redirected to the testing inboxes.
      </p>
    </td>
  </tr>
</table>
`
}

function buildTextBanner(intended: string): string {
  return [
    '*** PILOT MODE — THIS EMAIL WAS NOT DELIVERED TO THE CLIENT ***',
    `It would have gone to: ${intended}`,
    'You are seeing it because the app is running with client email redirected',
    'to the testing inboxes.',
    '',
    '----------------------------------------------------------------------',
    '',
  ].join('\n')
}
