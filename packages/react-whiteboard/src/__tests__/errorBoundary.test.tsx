import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { WhiteboardErrorBoundary } from '../components/WhiteboardErrorBoundary'

// A helper that throws on first render, then renders normally after reset.
let shouldThrow = true

function ThrowingChild() {
  if (shouldThrow) {
    throw new Error('test error')
  }
  return <div>child content</div>
}

describe('WhiteboardErrorBoundary', () => {
  // Suppress React error boundary console.error noise in test output
  const originalError = console.error
  beforeEach(() => {
    shouldThrow = true
    console.error = vi.fn()
  })
  afterEach(() => {
    cleanup()
    console.error = originalError
  })

  it('renders fallback when a child throws', () => {
    const { getByRole, getByText } = render(
      <WhiteboardErrorBoundary>
        <ThrowingChild />
      </WhiteboardErrorBoundary>,
    )

    expect(getByRole('alert')).toBeTruthy()
    expect(getByText('test error')).toBeTruthy()
  })

  it('calls onError with error and errorInfo when a child throws', () => {
    const onError = vi.fn()

    render(
      <WhiteboardErrorBoundary onError={onError}>
        <ThrowingChild />
      </WhiteboardErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledOnce()
    const [error, errorInfo] = onError.mock.calls[0] as [Error, { componentStack: string }]
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('test error')
    expect(errorInfo).toHaveProperty('componentStack')
  })

  it('resets and re-renders children when the Reset button is clicked', () => {
    const { getByRole, getByText, queryByRole } = render(
      <WhiteboardErrorBoundary>
        <ThrowingChild />
      </WhiteboardErrorBoundary>,
    )

    expect(getByRole('alert')).toBeTruthy()

    // After reset, the child should not throw
    shouldThrow = false
    fireEvent.click(getByText('Reset'))

    expect(queryByRole('alert')).toBeNull()
    expect(getByText('child content')).toBeTruthy()
  })

  it('renders custom fallback ReactNode', () => {
    const { getByText } = render(
      <WhiteboardErrorBoundary fallback={<div>custom fallback</div>}>
        <ThrowingChild />
      </WhiteboardErrorBoundary>,
    )

    expect(getByText('custom fallback')).toBeTruthy()
  })

  it('renders fallback render function with error and reset', () => {
    const { getByText } = render(
      <WhiteboardErrorBoundary
        fallback={(error, reset) => (
          <div>
            <span>{error.message}</span>
            <button type="button" onClick={reset}>retry</button>
          </div>
        )}
      >
        <ThrowingChild />
      </WhiteboardErrorBoundary>,
    )

    expect(getByText('test error')).toBeTruthy()

    shouldThrow = false
    fireEvent.click(getByText('retry'))

    expect(getByText('child content')).toBeTruthy()
  })
})
