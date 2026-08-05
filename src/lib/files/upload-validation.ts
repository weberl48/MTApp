/**
 * Client-resource upload validation.
 *
 * The upload route's `Content-Type` allow-list is a first gate only — the MIME
 * type is declared by the browser and can be spoofed (e.g. an `.html`/`.svg`
 * payload sent as `image/png`). This module sniffs the file's actual leading
 * bytes so stored content is what it claims to be. Markup/text payloads (HTML,
 * SVG, JS) match none of the binary signatures below, which is the point: the
 * files that could carry active content are exactly the ones with no allowed
 * magic number.
 *
 * Downloads are already served `Content-Disposition: attachment` from a private
 * bucket, so this is defense-in-depth against a stored file being opened later.
 */

/** MIME types accepted for client resource uploads (the declared-type gate). */
export const ALLOWED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'audio/mpeg',
  'audio/wav',
  'audio/mp3',
  'video/mp4',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export type AllowedUploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number]

export function isAllowedUploadMimeType(type: string): type is AllowedUploadMimeType {
  return (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(type)
}

function matchesAt(buf: Uint8Array, sig: number[], offset = 0): boolean {
  if (buf.length < offset + sig.length) return false
  for (let i = 0; i < sig.length; i++) {
    if (buf[offset + i] !== sig[i]) return false
  }
  return true
}

/**
 * True when the buffer's leading bytes match one of the binary file signatures
 * we accept. Intentionally checks "is this any allowed binary type" rather than
 * "does it match the declared type": the security goal is to reject text/markup
 * masquerading as a media file, not to police image/jpeg-vs-image/png.
 */
export function hasAllowedFileSignature(input: Uint8Array | ArrayBuffer): boolean {
  const buf = input instanceof Uint8Array ? input : new Uint8Array(input)
  if (buf.length < 4) return false

  // PDF: "%PDF"
  if (matchesAt(buf, [0x25, 0x50, 0x44, 0x46])) return true
  // PNG
  if (matchesAt(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return true
  // JPEG (JFIF/EXIF/raw all start FF D8 FF)
  if (matchesAt(buf, [0xff, 0xd8, 0xff])) return true
  // GIF: "GIF8" (covers GIF87a and GIF89a)
  if (matchesAt(buf, [0x47, 0x49, 0x46, 0x38])) return true
  // MP3 with an ID3 tag: "ID3"
  if (matchesAt(buf, [0x49, 0x44, 0x33])) return true
  // MP3 as a raw MPEG audio frame: 0xFF followed by the 11-bit frame sync.
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true
  // WAV: "RIFF"...."WAVE"
  if (matchesAt(buf, [0x52, 0x49, 0x46, 0x46]) && matchesAt(buf, [0x57, 0x41, 0x56, 0x45], 8)) return true
  // MP4/M4V/MOV: "ftyp" box at offset 4
  if (matchesAt(buf, [0x66, 0x74, 0x79, 0x70], 4)) return true
  // Legacy MS Office (.doc) — OLE compound file
  if (matchesAt(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return true
  // ZIP-based OOXML (.docx and friends): "PK\x03\x04"
  if (matchesAt(buf, [0x50, 0x4b, 0x03, 0x04])) return true

  return false
}

export type UploadContentResult = { ok: true } | { ok: false; reason: 'type-not-allowed' | 'content-mismatch' }

/**
 * Full gate for an uploaded file: the declared MIME must be on the allow-list
 * AND the bytes must match an allowed binary signature.
 */
export function validateUploadContent(
  input: Uint8Array | ArrayBuffer,
  declaredType: string
): UploadContentResult {
  if (!isAllowedUploadMimeType(declaredType)) return { ok: false, reason: 'type-not-allowed' }
  if (!hasAllowedFileSignature(input)) return { ok: false, reason: 'content-mismatch' }
  return { ok: true }
}
