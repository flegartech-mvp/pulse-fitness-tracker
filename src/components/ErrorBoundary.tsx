import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
}

/** Last-resort error screen so a render crash never leaves a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-6">
        <div className="w-full max-w-md rounded-2xl border border-edge bg-surface p-8 text-center shadow-card">
          <p className="text-4xl">🏋️</p>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">Something went wrong</h1>
          <p className="mt-2 text-sm text-soft">
            The app hit an unexpected error. Your data is safe on this device — reloading usually fixes it.
          </p>
          <pre className="scroll-slim mt-4 max-h-28 overflow-auto rounded-lg bg-raised p-3 text-left text-xs text-danger">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-10 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-on-accent transition hover:bg-accent-strong"
          >
            Reload app
          </button>
        </div>
      </div>
    )
  }
}
