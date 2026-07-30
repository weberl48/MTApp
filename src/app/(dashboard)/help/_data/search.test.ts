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

  // un-todo in plan Task 6 when my-earnings gains its keywords
  it.todo('ranks by keywords: "pay stub" surfaces my-earnings')

  // un-todo in plan Task 5 when no-shows-and-cancellations lands
  it.todo('handles question phrasing: "how do i change the no-show fee"')

  it('returns [] for empty and gibberish queries', () => {
    expect(searchArticlesRanked('')).toEqual([])
    expect(searchArticlesRanked('zzqqxx')).toEqual([])
  })
})

describe('searchFaqs', () => {
  // un-todo in plan Task 3 when HELP_FAQS is seeded
  it.todo('matches FAQ question phrasing: why-no-invoice')
})
