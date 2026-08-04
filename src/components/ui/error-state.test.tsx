import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorState } from './error-state'

describe('ErrorState', () => {
  it('renders the default copy and role="alert" with no retry button when onRetry is omitted', () => {
    render(<ErrorState />)

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Something went wrong')).toBeTruthy()
    expect(screen.getByText("This section couldn't load. Your data is safe.")).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders custom copy and calls onRetry when the retry button is clicked', () => {
    const onRetry = vi.fn()
    render(
      <ErrorState
        title="Couldn't load invoices"
        description="Check your connection and try again."
        retryLabel="Retry"
        onRetry={onRetry}
      />,
    )

    expect(screen.getByText("Couldn't load invoices")).toBeTruthy()
    expect(screen.getByText('Check your connection and try again.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
