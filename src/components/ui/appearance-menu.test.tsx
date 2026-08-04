import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppearanceMenu } from './appearance-menu'

function renderMenu() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppearanceMenu />
    </ThemeProvider>,
  )
}

describe('AppearanceMenu', () => {
  // Node 25's native webstorage stub shadows jsdom's localStorage in vitest
  // (methods are missing entirely), so back it with an in-memory Map — same
  // pattern as walkthroughs/completion.test.ts.
  beforeEach(() => {
    const store = new Map<string, string>()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, String(v)) },
        removeItem: (k: string) => { store.delete(k) },
        clear: () => { store.clear() },
      },
    })
    // next-themes calls matchMedia for system-mode detection; jsdom lacks it.
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('selecting a theme sets data-theme and persists to localStorage', async () => {
    renderMenu()
    fireEvent.click(screen.getByRole('button', { name: /appearance/i }))
    fireEvent.click(await screen.findByRole('button', { name: /ocean/i }))

    expect(document.documentElement.getAttribute('data-theme')).toBe('ocean')
    expect(window.localStorage.getItem('mca-theme')).toBe('ocean')
  })

  it('selecting Classic clears the attribute and the stored value', async () => {
    window.localStorage.setItem('mca-theme', 'ocean')
    document.documentElement.setAttribute('data-theme', 'ocean')

    renderMenu()
    fireEvent.click(screen.getByRole('button', { name: /appearance/i }))
    fireEvent.click(await screen.findByRole('button', { name: /classic/i }))

    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
    expect(window.localStorage.getItem('mca-theme')).toBeNull()
  })

  it('lists all eight themes', async () => {
    renderMenu()
    fireEvent.click(screen.getByRole('button', { name: /appearance/i }))
    for (const label of [
      'Classic',
      'Ocean',
      'Forest',
      'Lavender',
      'Sunset',
      'Slate',
      'Blossom',
      'Sonata',
    ]) {
      expect(await screen.findByRole('button', { name: new RegExp(label, 'i') })).toBeTruthy()
    }
  })
})
