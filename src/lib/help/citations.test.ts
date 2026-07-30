import { describe, it, expect } from 'vitest'
import { extractSources } from './citations'

describe('extractSources', () => {
  it('pulls slugs from the trailing Sources line and strips it', () => {
    const { text, slugs } = extractSources(
      'Scholarships batch monthly.\n\nSources: [[scholarship-billing]] [[billing-and-pay-rules]]'
    )
    expect(slugs).toEqual(['scholarship-billing', 'billing-and-pay-rules'])
    expect(text).toBe('Scholarships batch monthly.')
  })

  it('handles answers with no sources', () => {
    const { text, slugs } = extractSources('I could not find that in the documentation.')
    expect(slugs).toEqual([])
    expect(text).toBe('I could not find that in the documentation.')
  })

  it('dedupes and strips stray inline markers', () => {
    const { text, slugs } = extractSources('See [[my-earnings]] for details.\nSources: [[my-earnings]]')
    expect(slugs).toEqual(['my-earnings'])
    expect(text).not.toContain('[[')
  })
})
