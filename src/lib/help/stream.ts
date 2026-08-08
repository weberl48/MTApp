/** One event from the `/api/help/chat` SSE stream. */
export type HelpStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'truncated' }
  | { type: 'error' }
  | { type: 'done' }

/**
 * Incremental parser for the help-chat SSE stream.
 *
 * The caller keeps `rest` between reads: a network chunk can end mid-frame, so
 * only complete `data: …\n\n` frames are parsed. A frame whose payload doesn't
 * parse is skipped rather than thrown — one malformed frame must not throw out
 * of the read loop and discard an answer that is otherwise streaming fine.
 */
export function parseHelpStream(buffer: string): { events: HelpStreamEvent[]; rest: string } {
  const frames = buffer.split('\n\n')
  const rest = frames.pop() ?? ''
  const events: HelpStreamEvent[] = []
  for (const frame of frames) {
    if (!frame.startsWith('data: ')) continue
    const payload = frame.slice(6)
    if (payload === '[DONE]') {
      events.push({ type: 'done' })
      continue
    }
    let parsed: { text?: string; error?: string; truncated?: boolean }
    try {
      parsed = JSON.parse(payload)
    } catch {
      continue
    }
    if (parsed.error) events.push({ type: 'error' })
    else if (parsed.truncated) events.push({ type: 'truncated' })
    else if (parsed.text) events.push({ type: 'text', text: parsed.text })
  }
  return { events, rest }
}

/**
 * Was the answer complete? An answer is incomplete when the model ran out of
 * output budget (`truncated`) OR when the stream ended without `[DONE]` — a
 * dropped connection or a serverless timeout cuts the response mid-sentence
 * with no error, and silently rendering that as a finished answer is what made
 * the truncation bug invisible.
 */
export function isAnswerComplete(opts: { sawDone: boolean; truncated: boolean }): boolean {
  return opts.sawDone && !opts.truncated
}
