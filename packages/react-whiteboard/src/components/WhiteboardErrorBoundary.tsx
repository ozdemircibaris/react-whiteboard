import { Component, type ReactNode, type ErrorInfo } from 'react'

// ============================================================================
// Types
// ============================================================================

export interface WhiteboardErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback UI. Can be a ReactNode or a render function receiving the error and a reset callback. */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  /** Called when an error is caught. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  error: Error | null
}

// ============================================================================
// Component
// ============================================================================

/**
 * Error boundary for the whiteboard.
 * Catches rendering errors in child components and displays a fallback UI.
 */
export class WhiteboardErrorBoundary extends Component<WhiteboardErrorBoundaryProps, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo)
  }

  private reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    const { fallback } = this.props

    if (typeof fallback === 'function') {
      return fallback(error, this.reset)
    }

    if (fallback !== undefined) {
      return fallback
    }

    return (
      <div role="alert" style={{ padding: 16 }}>
        <p>Something went wrong in the whiteboard.</p>
        <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{error.message}</pre>
        <button type="button" onClick={this.reset} style={{ marginTop: 8 }}>
          Reset
        </button>
      </div>
    )
  }
}
