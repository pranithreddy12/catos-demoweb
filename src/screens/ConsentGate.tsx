import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

// One-time gate shown after sign-in and before any cat data. The user must
// affirmatively accept that LunaCat is not a vet and its output is observational
// and preliminary. Acceptance is recorded server-side (consent_log); on later
// logins the gate is skipped because consent is already on record.
export default function ConsentGate({ onAccepted }: { onAccepted: () => void }) {
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const accept = async () => {
    if (!checked) return
    setBusy(true)
    setErr(null)
    try {
      await api.acceptConsent()
      onAccepted()
    } catch {
      setErr('Could not save your acceptance. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FAF7F1', color: '#1A1B2E', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#757896' }}>Before we begin</div>
          <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 32, lineHeight: 1.1, margin: '6px 0 0' }}>
            A calm record — <em style={{ color: '#6B6BD6' }}>not a diagnosis.</em>
          </h1>

          <div style={{ marginTop: 18, fontSize: 14.5, lineHeight: 1.6, color: '#2A2C45', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0 }}>
              <strong>LunaCat is not a veterinary service.</strong> It helps you keep a
              record of your cat and gently notice changes over time.
            </p>
            <p style={{ margin: 0 }}>
              Anything the app surfaces is <strong>observational and preliminary</strong> —
              it describes what your logs show, not what is medically wrong. It is{' '}
              <strong>not a diagnosis</strong> and not a substitute for professional
              veterinary care.
            </p>
            <p style={{ margin: 0 }}>
              The patterns it highlights use thresholds that are <strong>preliminary and
              not yet clinically validated</strong>. Always consult your vet about any
              concern, and seek emergency care if your cat is in distress.
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 22, cursor: 'pointer' }}>
            <input
              type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18, accentColor: '#6B6BD6', flex: 'none' }}
            />
            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: '#2A2C45' }}>
              I understand LunaCat is not a vet and its insights are observational and
              preliminary — not a diagnosis. I have access to the{' '}
              <Link to="/terms" style={{ color: '#6B6BD6' }}>Terms of Service</Link> and{' '}
              <Link to="/privacy" style={{ color: '#6B6BD6' }}>Privacy Policy</Link>.
            </span>
          </label>

          {err && <div style={{ color: '#B8693A', fontSize: 13, marginTop: 12 }}>{err}</div>}
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(26,27,46,.08)', background: '#FDFBF6', padding: '14px 24px calc(14px + env(safe-area-inset-bottom))' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <button
            onClick={accept} disabled={!checked || busy}
            style={{ width: '100%', borderRadius: 999, border: 0, padding: '15px', fontSize: 15, fontWeight: 600, color: '#fff', background: '#6B6BD6', cursor: checked && !busy ? 'pointer' : 'default', opacity: checked && !busy ? 1 : 0.5 }}
          >
            {busy ? 'Saving…' : 'Accept & continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
