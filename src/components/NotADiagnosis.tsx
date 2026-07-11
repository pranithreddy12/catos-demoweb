import type { CSSProperties } from 'react'

// Subtle, persistent reminder shown on every screen that displays health output
// (Today, Insights, Vet Summary). Calm — not an alarm — in the design language.
export default function NotADiagnosis({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 11px', borderRadius: 999,
        background: 'rgba(107,107,214,.08)', border: '1px solid rgba(107,107,214,.16)',
        ...style,
      }}
    >
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#6B6BD6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" />
      </svg>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.01em', color: '#565878' }}>
        Observational data · Not a diagnosis
      </span>
    </div>
  )
}
