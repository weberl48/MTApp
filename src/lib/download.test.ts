import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  parseContentDispositionFilename,
  filenameFromResponse,
  downloadBlob,
} from './download'

describe('parseContentDispositionFilename', () => {
  it('reads a quoted filename from an attachment header', () => {
    expect(
      parseContentDispositionFilename('attachment; filename="invoice-7e4136a1.pdf"')
    ).toBe('invoice-7e4136a1.pdf')
  })

  it('reads a filename from an inline header (the ?inline=1 preview)', () => {
    expect(parseContentDispositionFilename('inline; filename="invoice-02d71c54.pdf"')).toBe(
      'invoice-02d71c54.pdf'
    )
  })

  it('reads an unquoted filename', () => {
    expect(parseContentDispositionFilename('attachment; filename=sessions-export.csv')).toBe(
      'sessions-export.csv'
    )
  })

  it('prefers RFC 5987 filename* and percent-decodes it', () => {
    expect(
      parseContentDispositionFilename(
        "attachment; filename=\"cafe.pdf\"; filename*=UTF-8''caf%C3%A9.pdf"
      )
    ).toBe('café.pdf')
  })

  it('returns null when there is no header or no filename', () => {
    expect(parseContentDispositionFilename(null)).toBeNull()
    expect(parseContentDispositionFilename('attachment')).toBeNull()
  })

  it('strips any path so a crafted header cannot steer the save location', () => {
    expect(parseContentDispositionFilename('attachment; filename="../../etc/passwd"')).toBe(
      'passwd'
    )
    expect(parseContentDispositionFilename('attachment; filename="C:\\\\evil\\\\x.pdf"')).toBe(
      'x.pdf'
    )
  })
})

describe('filenameFromResponse', () => {
  const resWith = (header: string | null) =>
    ({ headers: { get: () => header } }) as unknown as Response

  it('uses the server-provided filename when present', () => {
    expect(filenameFromResponse(resWith('attachment; filename="invoice-abc.pdf"'), 'fb.pdf')).toBe(
      'invoice-abc.pdf'
    )
  })

  it('falls back when the server sent no filename', () => {
    expect(filenameFromResponse(resWith(null), 'invoice-fallback.pdf')).toBe(
      'invoice-fallback.pdf'
    )
  })
})

describe('downloadBlob', () => {
  let created: string[]
  let revoked: string[]
  let clicked: HTMLAnchorElement[]

  beforeEach(() => {
    vi.useFakeTimers()
    created = []
    revoked = []
    clicked = []
    let n = 0
    // jsdom implements neither of these.
    URL.createObjectURL = vi.fn(() => {
      const u = `blob:http://localhost:3000/uuid-${++n}`
      created.push(u)
      return u
    }) as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = vi.fn((u: string) => {
      revoked.push(u)
    }) as unknown as typeof URL.revokeObjectURL
    // Anchor click would trigger a jsdom "navigation not implemented" error.
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      clicked.push(this)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('clicks an anchor carrying the filename in its download attribute', () => {
    downloadBlob(new Blob(['x']), 'invoice-7e4136a1.pdf')

    expect(clicked).toHaveLength(1)
    expect(clicked[0].download).toBe('invoice-7e4136a1.pdf')
    expect(clicked[0].href).toBe(created[0])
  })

  it('does NOT revoke the blob URL synchronously', () => {
    // The bug this module exists to prevent: revoking in the same tick as
    // click() races the browser's async download. Chrome then loses the
    // download-attribute filename and saves the file as the bare blob UUID
    // with no extension (which Windows/SmartScreen then quarantines).
    downloadBlob(new Blob(['x']), 'invoice-7e4136a1.pdf')

    expect(revoked).toEqual([])
  })

  it('revokes the blob URL and detaches the anchor once timers run', () => {
    downloadBlob(new Blob(['x']), 'invoice-7e4136a1.pdf')
    const anchor = clicked[0]
    expect(document.body.contains(anchor)).toBe(true)

    vi.runAllTimers()

    expect(revoked).toEqual([created[0]])
    expect(document.body.contains(anchor)).toBe(false)
  })

  it('never leaves an extension-less name when given one', () => {
    downloadBlob(new Blob(['x']), '')
    expect(clicked[0].download).not.toBe('')
  })
})
