import { describe, expect, it } from 'vitest'
import {
  sessionStatusAccents,
  sessionStatusColors,
  sessionStatusLabels,
} from './display'

describe('session status display maps', () => {
  it('colors, labels, and accents cover the same statuses', () => {
    const statuses = Object.keys(sessionStatusLabels).sort()
    expect(Object.keys(sessionStatusColors).sort()).toEqual(statuses)
    expect(Object.keys(sessionStatusAccents).sort()).toEqual(statuses)
  })

  it('accents are left-border classes', () => {
    for (const cls of Object.values(sessionStatusAccents)) {
      expect(cls).toMatch(/^border-l-/)
    }
  })
})
