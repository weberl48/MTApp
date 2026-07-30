import { describe, it, expect } from 'vitest'
import { searchArticlesRanked, searchFaqs, expandTerms } from './search'

describe('expandTerms', () => {
  it('drops question stopwords but keeps meaning terms', () => {
    const groups = expandTerms('how do i change the no-show fee')
    const flat = groups.flat()
    expect(flat).toContain('no-show')
    expect(flat).toContain('fee')
    expect(flat).not.toContain('how')
    expect(flat).not.toContain('i')
  })

  it('expands synonyms', () => {
    expect(expandTerms('bill').flat()).toEqual(expect.arrayContaining(['bill', 'invoice']))
  })

  it('returns [] when everything is a stopword', () => {
    expect(expandTerms('how do i')).toEqual([])
  })
})

describe('searchArticlesRanked', () => {
  it('finds invoice articles for "bill"', () => {
    const top = searchArticlesRanked('bill')[0]
    expect(top.article.category).toBe('invoices')
  })

  it('ranks by keywords: "pay stub" surfaces my-earnings', () => {
    const slugs = searchArticlesRanked('pay stub').map(r => r.article.slug)
    expect(slugs[0]).toBe('my-earnings')
  })

  it('handles question phrasing: "how do i change the no-show fee"', () => {
    const slugs = searchArticlesRanked('how do i change the no-show fee').map(r => r.article.slug)
    expect(slugs[0]).toBe('no-shows-and-cancellations')
  })

  it('returns [] for empty and gibberish queries', () => {
    expect(searchArticlesRanked('')).toEqual([])
    expect(searchArticlesRanked('zzqqxx')).toEqual([])
  })
})

describe('searchFaqs', () => {
  it('matches FAQ question phrasing: why-no-invoice', () => {
    const results = searchFaqs('why didnt this client get an invoice')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].faq.id).toBe('why-no-invoice')
  })
})
