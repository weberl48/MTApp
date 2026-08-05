import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Outside a real Next router context, next/link's own href resolution drops
// the trailing slash we pass in (a testing artifact, not app behavior —
// trailingSlash:true is enforced by Next's router in the real app). Render a
// plain anchor so the test observes exactly the href the component passed.
// Same mock as tab-bar.test.tsx.
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

import { MobileListItem } from './list-item'

describe('MobileListItem', () => {
  it('renders title, trailing, meta, and footer slots', () => {
    render(
      <MobileListItem
        title="Jane Doe"
        trailing="$120.00"
        meta={<span>Music Therapy</span>}
        footer={<button type="button">Mark Paid</button>}
      />
    )
    expect(screen.getByText('Jane Doe')).toBeTruthy()
    expect(screen.getByText('$120.00')).toBeTruthy()
    expect(screen.getByText('Music Therapy')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mark Paid' })).toBeTruthy()
  })

  it('applies tabular-nums to the trailing slot', () => {
    render(<MobileListItem title="Jane Doe" trailing="$120.00" />)
    expect(screen.getByText('$120.00').className).toContain('tabular-nums')
  })

  it('fires checkbox onChange with the new checked value and uses the given aria-label', () => {
    const onChange = vi.fn()
    render(
      <MobileListItem
        title="Jane Doe"
        checkbox={{ checked: false, onChange, label: 'Select invoice for Jane Doe' }}
      />
    )
    const checkbox = screen.getByRole('checkbox', { name: 'Select invoice for Jane Doe' })
    fireEvent.click(checkbox)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('renders a link when href is set and no footer is present (whole card is the link)', () => {
    render(<MobileListItem title="Jane Doe" href="/invoices/abc-123/" />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/invoices/abc-123/')
    expect(link.contains(screen.getByText('Jane Doe'))).toBe(true)
  })

  it('with a footer present, only the title row is the link — footer content sits outside it', () => {
    render(
      <MobileListItem
        title="Jane Doe"
        href="/invoices/abc-123/"
        footer={<button type="button">Mark Paid</button>}
      />
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/invoices/abc-123/')
    expect(link.contains(screen.getByText('Jane Doe'))).toBe(true)
    expect(link.contains(screen.getByRole('button', { name: 'Mark Paid' }))).toBe(false)
  })

  it('renders no link when href is omitted', () => {
    render(<MobileListItem title="Jane Doe" footer={<button type="button">Mark Paid</button>} />)
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('clicking the checkbox cancels the wrapping link\'s navigation (defaultPrevented)', () => {
    const onChange = vi.fn()
    render(
      <MobileListItem
        title="Jane Doe"
        href="/invoices/abc-123/"
        checkbox={{ checked: false, onChange, label: 'Select invoice for Jane Doe' }}
      />
    )
    // dispatchEvent (what fireEvent wraps) returns false when some handler
    // in the dispatch path called preventDefault() on a cancelable event —
    // the only way to observe cancellation of a native <a> navigation given
    // React's root-delegated event system (a raw ancestor addEventListener
    // would already have fired before React's own handler runs).
    const notCanceled = fireEvent.click(
      screen.getByRole('checkbox', { name: 'Select invoice for Jane Doe' })
    )
    expect(onChange).toHaveBeenCalledWith(true)
    expect(notCanceled).toBe(false)
  })

  it('applies the card token classes', () => {
    const { container } = render(<MobileListItem title="Jane Doe" />)
    const card = container.firstElementChild as HTMLElement
    expect(card.className).toContain('bg-card')
    expect(card.className).toContain('border-border')
    expect(card.className).toContain('rounded-lg')
  })
})
