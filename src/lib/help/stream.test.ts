import { describe, it, expect } from 'vitest'
import { parseHelpStream, isAnswerComplete, type HelpStreamEvent } from './stream'

/** Feed a stream in arbitrary chunk sizes, the way the browser delivers it. */
function drain(chunks: string[]): HelpStreamEvent[] {
  const events: HelpStreamEvent[] = []
  let buffer = ''
  for (const chunk of chunks) {
    buffer += chunk
    const parsed = parseHelpStream(buffer)
    buffer = parsed.rest
    events.push(...parsed.events)
  }
  return events
}

const frame = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`

describe('parseHelpStream', () => {
  it('reads text deltas and the terminator', () => {
    expect(drain([frame({ text: 'Hello ' }), frame({ text: 'world' }), 'data: [DONE]\n\n'])).toEqual([
      { type: 'text', text: 'Hello ' },
      { type: 'text', text: 'world' },
      { type: 'done' },
    ])
  })

  it('holds a partial frame until the rest of it arrives', () => {
    const whole = frame({ text: 'answer' })
    const events = drain([whole.slice(0, 9), whole.slice(9)])
    expect(events).toEqual([{ type: 'text', text: 'answer' }])
  })

  it('does not split on newlines inside a delta (JSON escapes them)', () => {
    // A markdown answer is full of blank lines; they must not look like frame
    // boundaries, or every list would truncate the answer.
    expect(drain([frame({ text: '## Title\n\n- one\n- two' })])).toEqual([
      { type: 'text', text: '## Title\n\n- one\n- two' },
    ])
  })

  it('skips a malformed frame instead of throwing away the answer', () => {
    expect(drain([frame({ text: 'kept' }), 'data: {not json\n\n', frame({ text: ' also kept' })])).toEqual([
      { type: 'text', text: 'kept' },
      { type: 'text', text: ' also kept' },
    ])
  })

  it('surfaces truncation and mid-stream failures', () => {
    expect(drain([frame({ text: 'partial' }), frame({ truncated: true }), 'data: [DONE]\n\n'])).toEqual([
      { type: 'text', text: 'partial' },
      { type: 'truncated' },
      { type: 'done' },
    ])
    expect(drain([frame({ error: 'stream_failed' })])).toEqual([{ type: 'error' }])
  })
})

describe('isAnswerComplete', () => {
  it('is complete only when the stream terminated and nothing was cut', () => {
    expect(isAnswerComplete({ sawDone: true, truncated: false })).toBe(true)
  })

  it('is incomplete when the model ran out of output budget', () => {
    expect(isAnswerComplete({ sawDone: true, truncated: true })).toBe(false)
  })

  it('is incomplete when the stream ended without [DONE]', () => {
    // Dropped connection / serverless timeout: partial text, no error.
    expect(isAnswerComplete({ sawDone: false, truncated: false })).toBe(false)
  })
})
