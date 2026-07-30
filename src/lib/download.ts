/**
 * Browser file-download helpers.
 *
 * The single home for "turn a fetched response into a saved file". Every
 * download in the app must go through here.
 *
 * Why this module exists: each download site used to inline the same
 * create-anchor/click dance and call `URL.revokeObjectURL(url)` on the line
 * straight after `a.click()`. That revoke races the browser's asynchronous
 * download — Chrome loses the anchor's `download` attribute and saves the file
 * under the bare blob UUID with **no extension** (e.g.
 * `7e4136a1-7998-4048-bf35-48e74cd7d33e`). The bytes are intact, so the
 * download reports "Done", but Windows/SmartScreen treats an extension-less
 * download as untrusted and commonly quarantines it — so the file never
 * reaches the Downloads folder. Deferring the revoke is the fix.
 */

/** How long the blob URL stays alive after the click. Long enough for the
 *  browser to have taken its own reference, short enough not to hold large
 *  exports in memory for the rest of the session. */
const REVOKE_DELAY_MS = 30_000

/** Last-resort name; a download must never be saved without an extension. */
const FALLBACK_FILENAME = 'download.bin'

/**
 * Strip any directory component from a filename.
 *
 * `Content-Disposition` is server-controlled, but resource filenames are
 * user-supplied at upload time, so treat the value as untrusted: a name like
 * `../../etc/passwd` must not steer where the browser writes.
 */
function baseName(name: string): string {
  const last = name.split(/[/\\]/).pop() ?? ''
  return last.trim()
}

/**
 * Pull the filename out of a `Content-Disposition` header value.
 *
 * Handles `filename="quoted"`, bare `filename=unquoted`, and RFC 5987
 * `filename*=UTF-8''percent%20encoded` (which wins when both are present,
 * since that is the form carrying non-ASCII names).
 */
export function parseContentDispositionFilename(header: string | null | undefined): string | null {
  if (!header) return null

  // RFC 5987 extended form takes precedence over the plain one.
  const extended = header.match(/filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/)
  if (extended) {
    try {
      const decoded = baseName(decodeURIComponent(extended[1].trim()))
      if (decoded) return decoded
    } catch {
      // Malformed percent-encoding — fall through to the plain filename.
    }
  }

  const quoted = header.match(/filename\s*=\s*"([^"]*)"/)
  if (quoted) {
    const name = baseName(quoted[1])
    if (name) return name
  }

  const bare = header.match(/filename\s*=\s*([^;]+)/)
  if (bare) {
    const name = baseName(bare[1].replace(/^["']|["']$/g, ''))
    if (name) return name
  }

  return null
}

/**
 * The filename a response wants to be saved as, falling back to `fallback`.
 *
 * Prefer this over hardcoding a name at the call site: the API route that
 * generated the file already declares the authoritative filename, so reading
 * it back keeps the two from drifting.
 */
export function filenameFromResponse(response: Response, fallback: string): string {
  return (
    parseContentDispositionFilename(response.headers.get('content-disposition')) ||
    baseName(fallback) ||
    FALLBACK_FILENAME
  )
}

/**
 * Save a blob to the user's disk as `filename`.
 *
 * Cleanup (revoking the object URL and detaching the anchor) is deferred —
 * see the module comment for why doing it synchronously corrupts the filename.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const name = baseName(filename) || FALLBACK_FILENAME
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = name
  anchor.rel = 'noopener'
  anchor.style.display = 'none'

  document.body.appendChild(anchor)
  anchor.click()

  setTimeout(() => {
    anchor.remove()
    URL.revokeObjectURL(url)
  }, REVOKE_DELAY_MS)
}

/**
 * Fetch a URL and save the result, honouring the server's declared filename.
 *
 * Throws on a non-OK response so callers can surface a toast — which is why
 * this keeps the fetch/blob round-trip instead of just navigating to the URL.
 */
export async function downloadFromUrl(url: string, fallbackFilename: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`)
  }
  const blob = await response.blob()
  downloadBlob(blob, filenameFromResponse(response, fallbackFilename))
}
