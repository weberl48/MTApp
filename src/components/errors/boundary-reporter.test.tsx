import { render } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { BoundaryErrorReporter } from './boundary-reporter'
import { clientErrorBuffer } from '@/lib/errors/client-buffer'

/**
 * The error boundaries were silent before this component existed, so these
 * tests exist to keep them from going silent again. `window.onerror` cannot
 * cover this path — a boundary catching the error is precisely what stops it
 * reaching the global handler — so if this component stops posting, the most
 * severe class of frontend failure becomes invisible with nothing else failing.
 */

function lastPost() {
  const mock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
  const call = mock.mock.calls[mock.mock.calls.length - 1]
  return { url: call[0] as string, body: JSON.parse((call[1] as RequestInit).body as string) }
}

describe('BoundaryErrorReporter', () => {
  beforeEach(() => {
    clientErrorBuffer.clear()
    globalThis.fetch = vi.fn(() => Promise.resolve(new Response(null, { status: 200 }))) as never
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reports the crash with the boundary name as the kind', () => {
    const error = Object.assign(new TypeError('Cannot read properties of undefined'), {})
    render(<BoundaryErrorReporter error={error} boundary="dashboard" />)

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    const { body } = lastPost()
    expect(body.source).toBe('frontend')
    expect(body.kind).toBe('boundary:dashboard')
    expect(body.message).toContain('[dashboard boundary]')
    expect(body.message).toContain('Cannot read properties of undefined')
  })

  it("includes React's digest — the only link between this crash and its server log line", () => {
    const error = Object.assign(new Error('boom'), { digest: '3376988181' })
    render(<BoundaryErrorReporter error={error} boundary="global" />)

    expect(lastPost().body.message).toContain('digest 3376988181')
  })

  it('omits the digest cleanly when there is none', () => {
    render(<BoundaryErrorReporter error={new Error('boom')} boundary="portal" />)
    expect(lastPost().body.message).not.toContain('digest')
  })

  it('feeds the session buffer so a bug report filed next carries the crash', () => {
    render(<BoundaryErrorReporter error={new Error('boom')} boundary="auth" />)

    const buffered = clientErrorBuffer.snapshot()
    expect(buffered).toHaveLength(1)
    expect(buffered[0].kind).toBe('Error')
    expect(buffered[0].message).toContain('[auth boundary]')
  })

  it('reports once per mount, not once per render', () => {
    const error = new Error('boom')
    const { rerender } = render(<BoundaryErrorReporter error={error} boundary="dashboard" />)
    rerender(<BoundaryErrorReporter error={error} boundary="dashboard" />)

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('survives a rejected fetch — a crash report must not cause a second crash', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('network down'))) as never

    expect(() =>
      render(<BoundaryErrorReporter error={new Error('boom')} boundary="dashboard" />)
    ).not.toThrow()

    // Let the rejected promise settle; an unhandled rejection would fail the run.
    await new Promise((r) => setTimeout(r, 0))
  })

  it('falls back to a usable message when the error has none', () => {
    render(<BoundaryErrorReporter error={new Error('')} boundary="dashboard" />)
    expect(lastPost().body.message).toContain('Unknown error')
  })
})
