import { Component, type ReactNode } from 'react'

// Catches any render/runtime error thrown by a screen and shows a calm recovery
// screen instead of a blank white page. Only activates on an actual crash, so it
// has zero effect on the normal app. A deployed build can forward `error` to
// Sentry from componentDidCatch.
interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div
        style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32,
          textAlign: 'center', background: '#FAF7F1', color: '#1A1B2E',
        }}
      >
        <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 27, lineHeight: 1.1 }}>
          Something went wrong
        </div>
        <p style={{ color: '#757896', fontSize: 14, maxWidth: 300, lineHeight: 1.55, margin: 0 }}>
          The app hit an unexpected error. Reloading usually clears it — your data is safe.
        </p>
        <button
          onClick={() => window.location.assign('/')}
          style={{
            border: 0, borderRadius: 999, padding: '13px 22px', fontSize: 14.5,
            fontWeight: 600, color: '#fff', background: '#6B6BD6', cursor: 'pointer',
          }}
        >
          Reload LunaCat
        </button>
      </div>
    )
  }
}
