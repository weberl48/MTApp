import { describe, it, expect } from 'vitest'
import { toRoutePattern } from './route-pattern'

describe('toRoutePattern', () => {
  it('replaces UUID segments with [id]', () => {
    expect(toRoutePattern('/invoices/3f8a1c2e-9b4d-4e7a-8c1f-2d5e6a7b8c9d/')).toBe('/invoices/[id]/')
  })

  it('replaces numeric ids', () => {
    expect(toRoutePattern('/sessions/42/edit/')).toBe('/sessions/[id]/edit/')
  })

  it('keeps known static segments', () => {
    expect(toRoutePattern('/sessions/new/')).toBe('/sessions/new/')
    expect(toRoutePattern('/settings/profile/')).toBe('/settings/profile/')
  })

  it('preserves the trailing slash the app uses, and its absence', () => {
    expect(toRoutePattern('/invoices/')).toBe('/invoices/')
    expect(toRoutePattern('/invoices')).toBe('/invoices')
  })

  it('returns / for the root', () => {
    expect(toRoutePattern('/')).toBe('/')
  })

  it('drops query strings and hashes — portal tokens and search terms live there', () => {
    expect(toRoutePattern('/clients/?search=Jane%20Doe')).toBe('/clients/')
    expect(toRoutePattern('/help/?q=invoice#section')).toBe('/help/')
  })

  it('accepts a full URL and uses only its path', () => {
    expect(
      toRoutePattern('https://app.example.com/clients/3f8a1c2e-9b4d-4e7a-8c1f-2d5e6a7b8c9d/')
    ).toBe('/clients/[id]/')
  })

  it('scrubs long opaque tokens', () => {
    expect(toRoutePattern('/portal/AbCdEf0123456789XyZ/')).toBe('/portal/[token]/')
  })

  it('fails closed on unclassifiable segments', () => {
    // Mixed word+digits is exactly what a slugged record id looks like.
    expect(toRoutePattern('/clients/jane-doe-1987/')).toBe('/clients/[id]/')
  })

  it('keeps word-shaped slugs that carry no digits', () => {
    expect(toRoutePattern('/help/getting-started/')).toBe('/help/getting-started/')
  })

  it('never throws and never returns empty for junk input', () => {
    expect(toRoutePattern(null)).toBe('[unknown]')
    expect(toRoutePattern(undefined)).toBe('[unknown]')
    expect(toRoutePattern('')).toBe('[unknown]')
    expect(toRoutePattern('not a url at all')).toBe('/[id]')
  })

  it('leaks no digit-bearing segment in any form', () => {
    // The guarantee the GitHub issue body depends on.
    const cases = [
      '/clients/3f8a1c2e-9b4d-4e7a-8c1f-2d5e6a7b8c9d/',
      '/invoices/00000000-0000-0000-0000-000000000001/edit/',
      '/sessions/12345/',
      '/portal/tok_9c8b7a6d5e4f3g2h1i/',
    ]
    for (const c of cases) {
      expect(toRoutePattern(c)).not.toMatch(/\d/)
    }
  })
})
