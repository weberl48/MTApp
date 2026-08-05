import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockUseOrganization = vi.fn()
vi.mock('@/contexts/organization-context', () => ({
  useOrganization: () => mockUseOrganization(),
}))

let mockPathname = '/dashboard/'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

// Outside a real Next router context, next/link's own href resolution drops
// the trailing slash we pass in (a testing artifact, not app behavior —
// trailingSlash:true is enforced by Next's router in the real app). Render a
// plain anchor so the test observes exactly the href the component passed.
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/forms/quick-log-drawer', () => ({
  QuickLogDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="quick-log-drawer-open" /> : null,
}))

import { MobileTabBar } from './tab-bar'

function staff() {
  return { can: (p: string) => p === 'session:view-all', isContractor: false }
}
function contractor() {
  return { can: () => false, isContractor: true }
}

describe('MobileTabBar', () => {
  beforeEach(() => {
    mockPathname = '/dashboard/'
    mockUseOrganization.mockReset()
    // jsdom has no matchMedia; useIsMobile needs one. Report "mobile" —
    // that's the viewport this component exists for, and the post-hydration
    // gate unmounts it entirely on desktop (visualViewport is undefined in
    // jsdom, so the keyboard-listener effect still no-ops).
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: true,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    })
  })

  it('renders as a labeled Primary nav with the tour id', () => {
    mockUseOrganization.mockReturnValue(staff())
    render(<MobileTabBar />)
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(nav.getAttribute('data-tour')).toBe('mobile-tab-bar')
  })

  it('shows Billing (not Earnings) for staff who can view all sessions', () => {
    mockUseOrganization.mockReturnValue(staff())
    render(<MobileTabBar />)
    expect(screen.getByRole('link', { name: /billing/i })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /earnings/i })).toBeNull()
  })

  it('shows Earnings (not Billing) for contractors', () => {
    mockUseOrganization.mockReturnValue(contractor())
    render(<MobileTabBar />)
    expect(screen.getByRole('link', { name: /earnings/i })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /billing/i })).toBeNull()
  })

  it('Home and Sessions links are real anchors matching existing tour selectors', () => {
    mockUseOrganization.mockReturnValue(staff())
    render(<MobileTabBar />)
    expect(screen.getByRole('link', { name: /home/i }).getAttribute('href')).toBe('/dashboard/')
    expect(screen.getByRole('link', { name: /sessions/i }).getAttribute('href')).toBe('/sessions/')
  })

  it('contractor center action opens the quick-log drawer instead of navigating', () => {
    mockUseOrganization.mockReturnValue(contractor())
    render(<MobileTabBar />)
    expect(screen.queryByTestId('quick-log-drawer-open')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /log new session/i }))
    expect(screen.getByTestId('quick-log-drawer-open')).toBeTruthy()
  })

  it('staff center action is a link straight to the new-session form', () => {
    mockUseOrganization.mockReturnValue(staff())
    render(<MobileTabBar />)
    expect(screen.getByRole('link', { name: /log new session/i }).getAttribute('href')).toBe(
      '/sessions/new/'
    )
    expect(screen.queryByRole('button', { name: /log new session/i })).toBeNull()
  })

  it('the More button dispatches mca:open-more-sheet', () => {
    mockUseOrganization.mockReturnValue(staff())
    const handler = vi.fn()
    window.addEventListener('mca:open-more-sheet', handler)
    render(<MobileTabBar />)
    fireEvent.click(screen.getByRole('button', { name: /more/i }))
    expect(handler).toHaveBeenCalledOnce()
    window.removeEventListener('mca:open-more-sheet', handler)
  })

  it('marks the active tab from the current pathname', () => {
    mockPathname = '/sessions/123/'
    mockUseOrganization.mockReturnValue(staff())
    render(<MobileTabBar />)
    expect(screen.getByRole('link', { name: /sessions/i }).getAttribute('aria-current')).toBe(
      'page'
    )
    expect(screen.getByRole('link', { name: /home/i }).getAttribute('aria-current')).toBeNull()
  })
})
