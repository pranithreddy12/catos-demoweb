import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

// Shared layout for /terms and /privacy — readable long-form prose in the warm
// design language. Works in any auth state (reachable from the consent gate,
// the sign-in screen, and the profile).
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  const nav = useNavigate()
  return (
    <div style={{ minHeight: '100dvh', background: '#FAF7F1', color: '#1A1B2E' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 22px 80px' }}>
        <button
          onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}
          style={{ background: 'none', border: 0, color: '#6B6BD6', fontSize: 13.5, cursor: 'pointer', padding: 0, marginBottom: 18 }}
        >
          ‹ Back
        </button>
        <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 34, lineHeight: 1.08, margin: 0 }}>{title}</h1>
        <p style={{ color: '#9498B0', fontSize: 12.5, marginTop: 8 }}>Last updated {updated}</p>
        <div style={{ marginTop: 18, fontSize: 14.5, lineHeight: 1.65, color: '#2A2C45' }}>{children}</div>
      </div>
    </div>
  )
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, margin: '26px 0 8px', color: '#1A1B2E' }}>{children}</h2>
}
