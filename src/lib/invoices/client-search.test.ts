import { describe, it, expect } from 'vitest'
import { clientSearchFilterIds } from './client-search'

describe('clientSearchFilterIds (regression for #12 — reconciliation client-name search)', () => {
  it('returns the matched client ids when there are matches', () => {
    expect(clientSearchFilterIds(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('returns a non-matching sentinel when nothing matched (must NOT return all invoices)', () => {
    const r = clientSearchFilterIds([])
    expect(r).toHaveLength(1)
    expect(r[0]).toMatch(/^0{8}-0{4}-0{4}-0{4}-0{12}$/)
  })
})
