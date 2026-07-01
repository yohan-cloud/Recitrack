import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: ''
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected app error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-[var(--school-blue)]">ReciTrack</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">Something went wrong</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              The page hit an unexpected frontend error. You can retry the page state or reload the app.
            </p>
            {this.state.message ? (
              <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-left text-xs text-slate-500">{this.state.message}</p>
            ) : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                className="rounded-2xl bg-[var(--school-blue)] px-5 py-3 text-sm font-semibold text-white"
                onClick={() => this.setState({ hasError: false, message: '' })}
              >
                Try again
              </button>
              <button
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                onClick={() => window.location.reload()}
              >
                Reload app
              </button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
