import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PassportProvider } from './lib/passport'
import { ThemeProvider } from './lib/theme'
import { AuthProvider, useAuth } from './lib/auth'
import { api } from './api'
import SignIn from './screens/SignIn'
import ConsentGate from './screens/ConsentGate'
import Terms from './screens/Terms'
import Privacy from './screens/Privacy'
import Today from './screens/Passport'
import Trends from './screens/Timeline'
import PassportBook from './screens/PassportBook'
import PassportHome from './screens/PassportHome'
import Provisions from './screens/Provisions'
import Profile from './screens/Profile'
import Food from './screens/Food'
import Learn from './screens/Learn'
import VetSummary from './screens/VetSummary'
import Onboarding from './screens/Onboarding'
import Care from './screens/Care'
import Insights from './screens/Insights'
import Admin from './screens/Admin'
import Notifications from './screens/Notifications'
import Shop from './screens/Shop'
import AdminCatalog from './screens/AdminCatalog'
import ErrorBoundary from './components/ErrorBoundary'

function TabBar() {
  const side = [
    { to: '/', label: 'Today', icon: HomeIcon, end: true },
    { to: '/timeline', label: 'Timeline', icon: ClockIcon },
  ]
  const side2 = [
    { to: '/insights', label: 'Insights', icon: SparkIcon },
    { to: '/care', label: 'Care', icon: HeartIcon },
  ]
  const tabCls = (isActive: boolean) =>
    `flex-1 flex flex-col items-center justify-center gap-1 font-mono text-[8px] uppercase tracking-[0.12em] ${isActive ? 'text-accent' : 'text-sepia-faint'}`
  return (
    <nav className="absolute bottom-0 inset-x-0 h-[74px] flex items-stretch px-1" style={{ background: '#FDFBF6', borderTop: '1px solid rgba(26,27,46,.07)' }}>
      {side.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => tabCls(isActive)}>
          {({ isActive }) => (<><t.icon active={isActive} />{t.label}</>)}
        </NavLink>
      ))}
      {/* center elevated Passport */}
      <NavLink to="/passport" className="flex-1 flex flex-col items-center justify-start -mt-5">
        {({ isActive }) => (
          <>
            <span className="w-14 h-14 rounded-full grid place-items-center shadow-lg" style={{ background: isActive ? 'linear-gradient(160deg,#6B6BD6,#45459A)' : 'linear-gradient(160deg,#b4b7da,#9396c4)', boxShadow: '0 10px 22px -8px rgba(74,74,192,.45)' }}>
              <CatIcon />
            </span>
            <span className={`font-mono text-[8px] uppercase tracking-[0.12em] mt-1 ${isActive ? 'text-accent' : 'text-sepia-faint'}`}>Passport</span>
          </>
        )}
      </NavLink>
      {side2.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => tabCls(isActive)}>
          {({ isActive }) => (<><t.icon active={isActive} />{t.label}</>)}
        </NavLink>
      ))}
    </nav>
  )
}

// First-run gate: a brand-new signed-in owner with no cat yet is taken straight
// into onboarding — the journey starts at the Welcome promise.
function hasEntry() {
  try {
    return !!localStorage.getItem('lunacat-cat-id')
  } catch {
    return false
  }
}

function Shell() {
  const loc = useLocation()
  const fullscreen = loc.pathname.startsWith('/onboarding')

  // every tab/route change starts at the top
  useEffect(() => {
    const sc = document.querySelector('.no-scrollbar')
    if (sc) sc.scrollTop = 0
  }, [loc.pathname])

  if (!hasEntry() && loc.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="min-h-full w-full flex items-center justify-center bg-[rgb(var(--shell))] p-0 sm:p-6">
      <div id="lc-phone" className="relative w-full sm:max-w-[400px] h-[100dvh] sm:h-[860px] parchment sm:rounded-[2.5rem] sm:shadow-2xl overflow-hidden sm:border-[10px] sm:border-black">
        <div className={`absolute inset-0 overflow-y-auto no-scrollbar ${fullscreen ? '' : 'pb-[76px]'}`}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/passport" element={<PassportHome />} />
            <Route path="/passport/book" element={<PassportBook />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/provisions" element={<Provisions />} />
            <Route path="/care" element={<Care />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/timeline" element={<Trends />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/vet-summary" element={<VetSummary />} />
            <Route path="/notifications" element={<Notifications />} />
            {/* Commerce V1 product surface. Buy buttons live here only. */}
            <Route path="/shop" element={<Shop />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/food" element={<Food />} />
            <Route path="/learn" element={<Learn />} />
          </Routes>
        </div>
        {!fullscreen && <TabBar />}
      </div>
    </div>
  )
}

function FullScreenLoader() {
  return (
    <div className="min-h-full w-full flex items-center justify-center bg-[rgb(var(--shell))]">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-sepia-faint">Loading…</div>
    </div>
  )
}

// Between auth and the app: require consent on record. Checked server-side, so
// the gate can't be skipped. Mounts the data provider only after consent so no
// gated request 403s during the check.
function ConsentBoundary({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'need' | 'ok' | 'error'>('checking')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    setState('checking')
    // api.consent() already retries transient failures. Only treat a *successful*
    // "not accepted" as needing consent; a genuine failure becomes a retry screen,
    // never a false "Before we begin" prompt for an already-consented owner.
    api.consent()
      .then((r) => { if (!cancelled) setState(r.accepted ? 'ok' : 'need') })
      .catch(() => { if (!cancelled) setState('error') })
    return () => { cancelled = true }
  }, [attempt])
  if (state === 'checking') return <FullScreenLoader />
  if (state === 'error') return <RetryScreen onRetry={() => setAttempt((a) => a + 1)} />
  if (state === 'need') return <ConsentGate onAccepted={() => setState('ok')} />
  return <>{children}</>
}

// Shown when we genuinely can't reach the backend (after retries). Lets the user
// try again rather than dumping them on an error or a false consent prompt.
function RetryScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center gap-4 bg-[rgb(var(--shell))] px-8 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-sepia-faint">Can’t reach the server</div>
      <p className="text-sepia-faint text-[13px] max-w-[260px] leading-relaxed">
        We couldn’t load your account just now. Check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="rounded-full px-6 py-3 text-[14px] font-semibold text-white"
        style={{ background: '#6B6BD6' }}
      >
        Try again
      </button>
    </div>
  )
}

// Auth gate: wait for Firebase to resolve, then require a signed-in user before
// the app mounts. Sample mode lets a visitor browse the public demo without an
// account. /terms and /privacy render in any state (logged out, consent pending,
// signed in).
function Gate() {
  const { user, loading } = useAuth()
  const loc = useLocation()

  if (loc.pathname === '/terms') return <Terms />
  if (loc.pathname === '/privacy') return <Privacy />

  if (loading) return <FullScreenLoader />

  if (!user) {
    return loc.pathname === '/signin' ? <SignIn /> : <Navigate to="/signin" replace />
  }
  // Signed in: never sit on /signin.
  if (loc.pathname === '/signin') return <Navigate to="/" replace />

  // Admin dashboard: full-width (outside the phone frame), requires a real login.
  // Access is enforced server-side (ADMIN_EMAILS); Admin itself shows "no access".
  if (loc.pathname === '/admin') return <Admin />
  if (loc.pathname === '/admin/catalog') return <AdminCatalog />

  return (
    <ConsentBoundary>
      <PassportProvider>
        <Shell />
      </PassportProvider>
    </ConsentBoundary>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Gate />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  )
}

/* --- nav icons --- */
function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
    </svg>
  )
}
function ChartIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 15l3-3 3 2 4-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {active && <circle cx="17" cy="9" r="1.6" fill="currentColor" />}
    </svg>
  )
}
function ClockIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <path d="M12 8v4l2.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function SparkIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}
function BagIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M7 4v3M17 4v3M5.5 7h13M8 11v6M12 11v6M16 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {active && <circle cx="12" cy="9" r="0" />}
    </svg>
  )
}
function HeartIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
    </svg>
  )
}
function CatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M4 4l2.5 4M20 4l-2.5 4M5 9c0-1 1.5-2 7-2s7 1 7 2c0 6-3 10-7 10s-7-4-7-10z" />
      <path d="M9.5 12h.01M14.5 12h.01M12 14.5l-1 1M12 14.5l1 1" strokeLinecap="round" />
    </svg>
  )
}
