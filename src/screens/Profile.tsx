import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePassport, fmtDate } from '../lib/passport'
import { useAuth } from '../lib/auth'
import { api, type CatSummary } from '../api'
import { Loading, ErrorCard } from './Passport'

// soft elevation so interactive cards lift off the warm page instead of blending in
const CARD_LIFT = '0 1px 2px rgba(26,27,46,.05), 0 10px 22px -8px rgba(26,27,46,.12)'

// meaningful pop of colour: a status dot per cat, keyed to its narrative state
function stateColor(state?: string | null): string {
  switch ((state || '').toLowerCase()) {
    case 'acute':      return '#B4552F' // terracotta — needs attention
    case 'developing':
    case 'emerging':   return '#B07A22' // amber — watching
    case 'resolving':  return '#4B7BA8' // slate blue — improving
    default:           return '#5B7A4F' // sage — stable
  }
}

export default function Profile() {
  const { data, loading, error, setActiveCat } = usePassport()
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [cats, setCats] = useState<CatSummary[]>([])
  const nav = useNavigate()

  const doSignOut = async () => {
    try {
      localStorage.removeItem('lunacat-cat-id')
    } catch {}
    try { await signOut() } catch {}
    // hard-navigate so the auth Gate re-evaluates and lands on the sign-in screen
    window.location.assign('/signin')
  }

  useEffect(() => {
    api.stats().then(setStats).catch(() => setStats(null))
    api.myCats().then(setCats).catch(() => setCats([]))
  }, [])

  if (loading) return <Loading />
  if (error || !data) return <ErrorCard msg={error} />

  const { cat, owner } = data

  return (
    <div className="px-4 pt-12 pb-6">
      <button onClick={() => nav(-1)} className="text-sepia-soft text-[13px] font-serif mb-2" style={{ background: 'none', border: 0, cursor: 'pointer' }}>‹ Back</button>
      <h1 className="passport-h text-[14px]">Chronicles of Guardianship</h1>

      {/* guardianship grant stamp */}
      <div className="page parchment-deep mt-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="field-label">Guardian / Tuteur</span>
            <p className="field-value font-bold text-base">{owner?.display_name || 'LunaCat Registry'}</p>
            {owner?.email && <p className="text-[11px] text-sepia-soft">{owner.email}</p>}
          </div>
          <div className="stamp text-stamp-blue rot2">
            <span className="text-[9px]">GUARDIANSHIP</span>
            <span className="text-[9px]">GRANTED</span>
            <span className="text-[7px] font-normal not-italic">{fmtDate(cat.created_at)}</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-sepia/12 text-[12px] text-sepia leading-relaxed font-serif">
          This certifies that <b>{cat.name}</b>
          {cat.breed_name ? `, a ${cat.breed_name},` : ''} entered the care of the above guardian
          and is enrolled in the LunaCat Health Intelligence registry.
        </div>
      </div>

      {/* your cats — switch between them, or create a new record */}
      <h2 className="passport-h text-[13px] mt-6">Your Cats</h2>
      <div className="mt-3 space-y-2.5">
        {cats.map((c) => {
          const active = c.id === data.cat.id
          return (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              style={{ boxShadow: active ? `0 0 0 2px rgb(var(--accent)), ${CARD_LIFT}` : CARD_LIFT }}
              className="w-full page bg-parchment-50 p-4 flex items-center gap-3 text-left active:scale-[0.99] transition"
            >
              <span className="w-9 h-9 rounded-full grid place-items-center text-base font-serif font-bold" style={{ background: 'rgba(107,107,214,.12)', color: '#45459A' }}>
                {c.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="flex-1">
                <p className="field-value font-bold">{c.name}{active ? ' · viewing' : ''}</p>
                <p className="text-[11px] text-sepia-faint flex items-center gap-1.5">
                  {c.narrative_state && <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: stateColor(c.narrative_state) }} />}
                  {c.breed_name || 'Cat'}{c.narrative_state ? ` · ${c.narrative_state.toLowerCase()}` : ''}
                </p>
              </div>
              <span className="text-sepia-faint">{active ? '✓' : '›'}</span>
            </button>
          )
        })}
        <button onClick={() => nav('/onboarding')} style={{ boxShadow: CARD_LIFT }} className="w-full page bg-parchment-50 p-4 flex items-center gap-3 text-left active:scale-[0.99] transition">
          <span className="w-9 h-9 rounded-full grid place-items-center text-lg" style={{ background: 'rgba(75,95,66,.12)', color: '#4B5F42' }}>+</span>
          <div className="flex-1">
            <p className="field-value font-bold">Start a new cat record</p>
            <p className="text-[11px] text-sepia-faint">Issue a passport · writes to the database</p>
          </div>
          <span className="text-sepia-faint">›</span>
        </button>
      </div>

      {/* platform tools */}
      <h2 className="passport-h text-[13px] mt-6">Registry Tools</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <ToolCard emoji="🍚" title="Food Library" sub="Search the catalogue" onClick={() => nav('/food')} />
        <ToolCard emoji="📚" title="Research" sub="PubMed-grounded" onClick={() => nav('/learn')} />
        <ToolCard emoji="🛍️" title="Provisions" sub="Explained · where to buy" onClick={() => nav('/shop')} />
      </div>

      {/* live DB stats */}
      <h2 className="passport-h text-[13px] mt-6">Registry Holdings</h2>
      <div className="page parchment mt-3 p-4">
        {stats ? (
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <Holding n={stats.food_products} label="Food products" />
            <Holding n={stats.food_with_nutrients} label="With nutrients" />
            <Holding n={stats.breeds} label="Breeds" />
            <Holding n={stats.research_conditions} label="Research conditions" />
          </div>
        ) : (
          <p className="text-sepia-soft text-sm italic text-center py-2">Loading registry holdings…</p>
        )}
      </div>

      {/* account / logout */}
      <h2 className="passport-h text-[13px] mt-6">Account</h2>
      <div className="page parchment mt-3 p-4">
        <p className="field-label">Signed in as</p>
        <p className="field-value font-bold mt-0.5">{user?.email || '—'}</p>
        <button
          onClick={doSignOut}
          className="w-full mt-3 rounded-xl p-3.5 text-center text-[13px] font-semibold active:scale-[0.99] transition"
          style={{ color: '#fff', background: '#B8693A' }}
        >
          Log out
        </button>
      </div>

      {/* legal */}
      <div className="mt-6 flex items-center justify-center gap-4 text-[12px]">
        <Link to="/terms" style={{ color: '#6B6BD6' }}>Terms of Service</Link>
        <span className="text-sepia-faint">·</span>
        <Link to="/privacy" style={{ color: '#6B6BD6' }}>Privacy Policy</Link>
      </div>
      <p className="mt-3 text-center text-[10px] text-sepia-faint italic">
        LunaCat is not a veterinary service. Observations are not a diagnosis.
      </p>

      <p className="mt-3 text-center text-[10px] text-sepia-faint italic">
        All records read live from the LunaCat database.
      </p>

      <div className="mt-4 text-center">
        <Link to="/admin" className="text-[11px]" style={{ color: '#9498B0' }}>Admin dashboard →</Link>
      </div>
    </div>
  )
}

function ToolCard({ emoji, title, sub, onClick }: { emoji: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="page parchment-deep p-4 text-left active:scale-[0.98] transition">
      <div className="text-2xl">{emoji}</div>
      <p className="field-value font-bold mt-1">{title}</p>
      <p className="text-[10px] text-sepia-faint italic">{sub}</p>
    </button>
  )
}

function Holding({ n, label }: { n?: number; label: string }) {
  return (
    <div>
      <p className="font-serif font-bold text-xl text-sepia leading-none">
        {n != null ? n.toLocaleString() : '—'}
      </p>
      <p className="field-label mt-1">{label}</p>
    </div>
  )
}
