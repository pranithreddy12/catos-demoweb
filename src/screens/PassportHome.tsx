import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePassport, fmtDate, ageFrom } from '../lib/passport'
import { Loading, ErrorCard } from './Passport'

const INK = '#1A1B2E'
const MUTED = '#757896'
const PERI = '#6B6BD6'
const TERRA = '#B8693A'

export default function PassportHome() {
  const { data, loading, error } = usePassport()
  const nav = useNavigate()
  const [soon, setSoon] = useState<string | null>(null)

  if (loading) return <Loading />
  if (error || !data) return <ErrorCard msg={error} />
  const { cat } = data

  const yr = (cat.dob || cat.created_at || '').slice(0, 4) || '20XX'
  const digits = (cat.id || '').replace(/\D/g, '').slice(-6).padStart(6, '0')
  const passportNo = `LC-${yr}-${digits}`
  const guardian = data.owner?.display_name || 'You'

  const tiles: { icon: string; title: string; sub: string; onClick: () => void }[] = [
    { icon: 'book', title: 'Read the passport', sub: 'Identity to memory', onClick: () => nav('/passport/book') },
    { icon: 'share', title: 'Share a moment', sub: 'Gotcha day · milestones', onClick: () => setSoon('Share a moment') },
    { icon: 'export', title: 'Vet-ready export', sub: 'PDF · transfer', onClick: () => nav('/vet-summary') },
    { icon: 'shield', title: 'Lost-cat ID card', sub: 'Chip + contacts', onClick: () => setSoon('Lost-cat ID card') },
  ]

  return (
    <div className="min-h-full px-5 pt-12 pb-10" style={{ background: '#FAF7F1' }}>
      {/* cover card */}
      <div className="rounded-[24px] p-5 relative overflow-hidden" style={{ background: 'radial-gradient(120% 90% at 80% 0%, #4a4aa0 0%, #2c2c63 48%, #1b1b42 100%)' }}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-white/90 text-[13px] font-medium"><span>☾</span> LunaCat</span>
          <span className="font-mono text-[9px] tracking-[0.22em] uppercase" style={{ color: 'rgba(255,255,255,.55)' }}>Passport</span>
        </div>
        <div className="flex items-center gap-3.5 mt-4">
          <div className="w-14 h-14 rounded-[16px] grid place-items-center shrink-0 overflow-hidden" style={{ background: 'linear-gradient(150deg,#D98A4E,#B8693A)' }}>
            {cat.profile_photo_url
              ? <img src={cat.profile_photo_url} alt="" className="w-full h-full object-cover" />
              : <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M4 9l2-5 3 3h6l3-3 2 5v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9z" opacity=".3" /><circle cx="9" cy="12" r="1.3" fill="#fff" /><circle cx="15" cy="12" r="1.3" fill="#fff" /></svg>}
          </div>
          <div>
            <h1 className="font-serif text-[30px] leading-none text-white">{cat.name}</h1>
            <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,.6)' }}>Digital feline passport</p>
          </div>
        </div>
        <div className="h-px my-4" style={{ background: 'rgba(255,255,255,.12)' }} />
        <div className="grid grid-cols-2 gap-y-3.5">
          <CoverField label="Passport no." value={passportNo} />
          <CoverField label="Born" value={cat.dob ? `${yr} · ${ageFrom(cat.dob)}` : '—'} />
          <CoverField label="Breed" value={cat.breed_name || 'Unknown'} />
          <CoverField label="Guardian" value={guardian} />
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,.5)' }}>On record since {cat.created_at ? fmtDate(cat.created_at) : '—'}</span>
          <span className="flex items-center gap-1.5 text-[11px] rounded-full px-2.5 py-1" style={{ background: 'rgba(96,193,120,.18)', color: '#8fdca0' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6cd17f' }} /> Active</span>
        </div>
      </div>

      {/* open the book */}
      <button onClick={() => nav('/passport/book')} className="mt-4 w-full rounded-[18px] py-4 flex items-center justify-center gap-2 font-serif text-[18px] text-white active:scale-[0.99] transition" style={{ background: INK }}>
        Open {cat.name}'s passport <span className="text-white/70">›</span>
      </button>
      <p className="text-center text-[12px] mt-2.5" style={{ color: MUTED }}>Seven pages · a life, kept on one record</p>

      {/* quick actions */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        {tiles.map((t) => (
          <button key={t.title} onClick={t.onClick} className="rounded-[18px] p-4 text-left active:scale-[0.98] transition" style={{ background: '#fff', border: '1px solid rgba(26,27,46,.06)' }}>
            <span className="w-9 h-9 rounded-[10px] grid place-items-center mb-3" style={{ background: tileBg(t.icon) }}><TileIcon name={t.icon} /></span>
            <p className="text-[14px] font-semibold leading-tight" style={{ color: INK }}>{t.title}</p>
            <p className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>{t.sub}</p>
          </button>
        ))}
      </div>

      {soon && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSoon(null)} style={{ background: 'rgba(20,21,40,.45)' }}>
          <div className="w-full sm:max-w-[400px] rounded-t-[24px] p-6 pb-9" style={{ background: '#FDFBF6' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'rgba(26,27,46,.15)' }} />
            <p className="font-serif text-[22px]" style={{ color: INK }}>{soon}</p>
            <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: MUTED }}>
              Designed and on the build list — next up after the onboarding pass. It'll generate a shareable card from {cat.name}'s record.
            </p>
            <button onClick={() => setSoon(null)} className="mt-5 w-full rounded-full py-3.5 font-semibold text-[14px] text-white" style={{ background: INK }}>Got it</button>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-[10px] tracking-wide" style={{ color: '#9498B0' }}>An owner-kept record — not a diagnosis.</p>
    </div>
  )
}

function CoverField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[8px] uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,.45)' }}>{label}</p>
      <p className="text-[14px] font-medium mt-0.5 text-white truncate">{value}</p>
    </div>
  )
}

function tileBg(icon: string) {
  return icon === 'shield' ? 'rgba(184,105,58,.14)' : icon === 'share' ? 'rgba(184,105,58,.14)' : 'rgba(107,107,214,.12)'
}

function TileIcon({ name }: { name: string }) {
  const stroke = name === 'shield' || name === 'share' ? TERRA : PERI
  const s = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const p: Record<string, JSX.Element> = {
    book: <path d="M4 5a2 2 0 0 1 2-2h9v16H6a2 2 0 0 0-2 2zM15 3l5 2v14l-5-2z" />,
    share: <><circle cx="6" cy="12" r="2.5" /><circle cx="17" cy="6" r="2.5" /><circle cx="17" cy="18" r="2.5" /><path d="M8.2 10.8l6.6-3.6M8.2 13.2l6.6 3.6" /></>,
    export: <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />,
    shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />,
  }
  return <svg {...s}>{p[name]}</svg>
}
