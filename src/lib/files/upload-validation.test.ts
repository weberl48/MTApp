import { describe, it, expect } from 'vitest'
import {
  hasAllowedFileSignature,
  validateUploadContent,
  isAllowedUploadMimeType,
} from './upload-validation'

/** Build a buffer from leading bytes plus optional padding. */
function bytes(...leading: number[]): Uint8Array {
  return new Uint8Array(leading)
}

const PDF = bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34) // "%PDF-1.4"
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10)
const GIF = bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61)
const MP3_ID3 = bytes(0x49, 0x44, 0x33, 0x03, 0x00)
const MP3_FRAME = bytes(0xff, 0xfb, 0x90, 0x00)
const WAV = bytes(0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45)
const MP4 = bytes(0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70) // ....ftyp
const DOC = bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)
const DOCX = bytes(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00)

const HTML = new TextEncoder().encode('<!DOCTYPE html><html><script>alert(1)</script>')
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>')
const PLAIN = new TextEncoder().encode('just some text')

describe('hasAllowedFileSignature', () => {
  it('accepts every allowed binary signature', () => {
    for (const buf of [PDF, PNG, JPEG, GIF, MP3_ID3, MP3_FRAME, WAV, MP4, DOC, DOCX]) {
      expect(hasAllowedFileSignature(buf)).toBe(true)
    }
  })

  it('rejects HTML, SVG, and plain text payloads', () => {
    expect(hasAllowedFileSignature(HTML)).toBe(false)
    expect(hasAllowedFileSignature(SVG)).toBe(false)
    expect(hasAllowedFileSignature(PLAIN)).toBe(false)
  })

  it('rejects empty or too-short buffers', () => {
    expect(hasAllowedFileSignature(new Uint8Array([]))).toBe(false)
    expect(hasAllowedFileSignature(new Uint8Array([0x25, 0x50]))).toBe(false)
  })

  it('accepts an ArrayBuffer as well as a Uint8Array', () => {
    expect(hasAllowedFileSignature(PNG.buffer as ArrayBuffer)).toBe(true)
  })
})

describe('validateUploadContent', () => {
  it('accepts a real PNG declared as image/png', () => {
    expect(validateUploadContent(PNG, 'image/png')).toEqual({ ok: true })
  })

  it('rejects HTML content spoofed as image/png (the core attack)', () => {
    expect(validateUploadContent(HTML, 'image/png')).toEqual({ ok: false, reason: 'content-mismatch' })
  })

  it('rejects an SVG spoofed as an allowed image type', () => {
    expect(validateUploadContent(SVG, 'image/gif')).toEqual({ ok: false, reason: 'content-mismatch' })
  })

  it('rejects a disallowed declared MIME type outright', () => {
    expect(validateUploadContent(SVG, 'image/svg+xml')).toEqual({ ok: false, reason: 'type-not-allowed' })
    expect(validateUploadContent(HTML, 'text/html')).toEqual({ ok: false, reason: 'type-not-allowed' })
  })

  it('accepts a genuine PDF/JPEG/MP3/DOCX with matching declared type', () => {
    expect(validateUploadContent(PDF, 'application/pdf')).toEqual({ ok: true })
    expect(validateUploadContent(JPEG, 'image/jpeg')).toEqual({ ok: true })
    expect(validateUploadContent(MP3_ID3, 'audio/mpeg')).toEqual({ ok: true })
    expect(
      validateUploadContent(
        DOCX,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    ).toEqual({ ok: true })
  })
})

describe('isAllowedUploadMimeType', () => {
  it('is true for allow-listed types and false otherwise', () => {
    expect(isAllowedUploadMimeType('application/pdf')).toBe(true)
    expect(isAllowedUploadMimeType('image/svg+xml')).toBe(false)
    expect(isAllowedUploadMimeType('text/html')).toBe(false)
  })
})
