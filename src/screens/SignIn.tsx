import { useState, type FormEvent, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { api } from '../api'

// Dedicated sign-in screen, shown before onboarding. Email/password (the only
// method enabled). The only two ways in are sign in or create an account - there
// is no demo/sample entry.
export default function SignIn() {
  const { signIn, signUp } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      if (mode === 'in') await signIn(email.trim(), pw)
      else await signUp(email.trim(), pw)
      // Load this owner's cats so a returning user lands on their cat instead of
      // onboarding (the active cat is tracked client-side). New users have none
      // -> onboarding, as before.
      try {
        const cats = await api.myCats()
        if (cats && cats.length) localStorage.setItem('lunacat-cat-id', cats[0].id)
        else localStorage.removeItem('lunacat-cat-id')
      } catch { /* fall through to onboarding */ }
      nav('/')
    } catch (e: any) {
      const code = (e?.code || '').replace('auth/', '')
      setErr(
        code === 'invalid-credential' || code === 'wrong-password' || code === 'user-not-found'
          ? 'Email or password is incorrect.'
          : code === 'email-already-in-use'
          ? 'That email already has an account — try signing in.'
          : code === 'weak-password'
          ? 'Password should be at least 6 characters.'
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'radial-gradient(120% 80% at 50% 0%, #1A1C38 0%, #0E0F1A 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 26px', color: '#EDECF8' }}>
      <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(160deg,#8B89DA,#6B6BD6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10z" /></svg>
      </div>
      <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 38, lineHeight: 1.04, margin: 0 }}>
        {mode === 'in' ? 'Welcome back.' : "Let's begin."}
      </h1>
      <p style={{ color: '#9498B0', marginTop: 8, fontSize: 14.5 }}>
        {mode === 'in' ? 'Sign in to your cat’s passport.' : 'Create an account to start a passport.'}
      </p>

      <form onSubmit={submit} style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email" inputMode="email" autoComplete="email" placeholder="Email" required
          value={email} onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} placeholder="Password" required
          value={pw} onChange={(e) => setPw(e.target.value)}
          style={inputStyle}
        />
        {err && <div style={{ color: '#EEB582', fontSize: 13 }}>{err}</div>}
        <button type="submit" disabled={busy} style={{ marginTop: 6, borderRadius: 999, border: 0, padding: '15px', fontSize: 15, fontWeight: 600, background: '#F2F1FC', color: '#1A1B2E', cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button onClick={() => { setErr(null); setMode(mode === 'in' ? 'up' : 'in') }} style={linkStyle}>
        {mode === 'in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}

const inputStyle: CSSProperties = {
  background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 14, padding: '14px 16px', fontSize: 15, color: '#EDECF8', outline: 'none',
}
const linkStyle: CSSProperties = {
  background: 'none', border: 0, color: '#9498B0', fontSize: 13.5, marginTop: 18,
  cursor: 'pointer', textAlign: 'center', width: '100%',
}
