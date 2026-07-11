import { useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePassport } from '../lib/passport'
import { api, FoodProduct } from '../api'
import DailyCheckin from '../components/DailyCheckin'
import NotADiagnosis from '../components/NotADiagnosis'

// ===== final design tokens =====
const CREAM = '#FAF7F1'
const INK = '#1A1B2E'
const MUTED = '#757896'
const MUTED2 = '#565878'
const MUTED3 = '#9498B0'
const SLATE = '#3D3F5A'
const PERI = '#6B6BD6'
const PERI_DK = '#45459A'
const PERI_TINT = '#E3E2FA'
const PERI_BG = '#F2F1FC'
const SAGE = '#4B5F42'
const SAGE_BG = '#DDE6D8'
const TERRA = '#C97B5B'
const SH_SM = '0 1px 2px rgba(26,27,46,.04),0 4px 12px rgba(26,27,46,.04)'
const SH_MD = '0 2px 4px rgba(26,27,46,.05),0 12px 28px rgba(26,27,46,.06)'

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1)
const isToday = (iso?: string) => { if (!iso) return false; const d = new Date(iso), n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate() }

export default function Today() {
  const { data, loading, error, reload } = usePassport()
  const nav = useNavigate()
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [checkinSub, setCheckinSub] = useState<'weight' | 'vaccine' | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [foods, setFoods] = useState<FoodProduct[]>([])
  const [unread, setUnread] = useState(0)

  const openCheckin = (sub: 'weight' | 'vaccine' | null = null) => { setCheckinSub(sub); setCheckinOpen(true) }

  useEffect(() => {
    api.notificationsUnread().then((r) => setUnread(r.unread)).catch(() => setUnread(0))
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    api.foods('', 6).then((f) => setFoods(f.filter((x) => x.image_url).slice(0, 4))).catch(() => setFoods([]))
  }, [])

  if (loading) return <Loading />
  if (error || !data) return <ErrorCard msg={error} />

  const { cat } = data
  const ws = (data.weight_logs || []).map((w) => Number(w.weight_kg))
  const curW = ws.length ? ws[ws.length - 1] : cat.weight_kg
  const baseW = ws.length ? mean(ws) : null
  const dPct = baseW && curW ? ((curW - baseW) / baseW) * 100 : 0
  const gentle = Math.abs(dPct) >= 3

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.'

  const startIso = data.weight_logs[0]?.logged_at || cat.created_at
  const daysIn = startIso ? Math.max(1, Math.floor((now.getTime() - new Date(startIso).getTime()) / 86400000)) : 1
  const learning = daysIn < 14
  const day = Math.min(daysIn, 14)

  const mealsToday = (data.feeding || []).filter((f) => isToday(f.logged_at)).length
  // Vaccines "current" only if none have lapsed past their valid_until.
  const vaxExpired = (data.vaccinations || []).filter((v) => v.valid_until && new Date(v.valid_until) < now).length
  const activeMeds = (data.medications || []).filter((m) => m.active).length

  // An urgent pattern (urinary red flag) is time-critical — surface it here, not
  // buried in a tab. Calm wording, clear action, never a diagnosis.
  const urgent = (data.patterns || []).find((p) => p.urgency_level === 'urgent')

  return (
    <div style={{ minHeight: '100%', background: CREAM, padding: '56px 16px 120px' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '8px 8px 14px' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: MUTED }}>{dateStr}</div>
          <h1 style={{ margin: '4px 0 0', fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 34, lineHeight: 1.02, letterSpacing: '-.02em', color: INK }}>{greeting}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button onClick={() => nav('/notifications')} style={{ position: 'relative', border: 0, background: 'transparent', cursor: 'pointer', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SLATE }} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" /><path d="M10 21h4" /></svg>
            {unread > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: '#B8693A', color: '#fff', fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </button>
          <button onClick={() => nav('/profile')} style={{ border: 0, background: 'transparent', cursor: 'pointer', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SLATE }} aria-label="Profile & account">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></svg>
          </button>
        </div>
      </div>

      <div style={{ padding: '0 8px 12px' }}><NotADiagnosis /></div>

      {/* urgent pattern banner (only when a time-critical sign is logged) */}
      {urgent && (
        <div onClick={() => nav('/insights')} style={{ background: '#FBEDE4', border: '1px solid rgba(184,105,58,.35)', borderRadius: 18, padding: 16, marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
          <div style={{ width: 30, height: 30, flex: 'none', borderRadius: 9, background: '#B8693A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#8A4A22', lineHeight: 1.25 }}>{urgent.owner_label}</div>
            <div style={{ fontSize: 12.5, color: '#9A5A33', marginTop: 4, lineHeight: 1.5 }}>{urgent.owner_note}</div>
          </div>
        </div>
      )}

      {/* hero */}
      <div style={{ background: PERI_BG, borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,#FAE7D5 0%,transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: PERI_DK, position: 'relative' }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10z" /></svg>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>This week</span>
        </div>
        <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 30, lineHeight: 1.1, letterSpacing: '-.01em', color: INK, position: 'relative' }}>
          {cat.name} seems <em>{gentle ? 'mostly herself' : 'herself'}</em> this week.
        </div>
        <div style={{ marginTop: 10, fontSize: 14, color: MUTED2, lineHeight: 1.55, position: 'relative' }}>
          {gentle ? 'One small thing on the radar — otherwise her usual rhythm.' : 'Eating, resting and moving on her usual rhythm.'}
        </div>
        <div style={{ marginTop: 16, position: 'relative' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: SAGE_BG, color: SAGE, fontSize: 13, fontWeight: 500 }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>Compared to her baseline
          </span>
        </div>
      </div>

      {/* check-in */}
      <div onClick={() => openCheckin()} style={{ marginTop: 14, background: '#fff', borderRadius: 20, boxShadow: SH_MD, padding: 18, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
        <div style={{ width: 44, height: 44, borderRadius: 999, flex: 'none', background: PERI_TINT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, background: PERI }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: MUTED }}>Today's check-in</div>
          <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 21, lineHeight: 1.2, marginTop: 2, color: INK }}>How does {cat.name} seem today?</div>
        </div>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={MUTED3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </div>

      {/* learning progress / established */}
      <div style={{ marginTop: 14, background: '#fff', borderRadius: 20, boxShadow: SH_SM, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>Getting to know {cat.name}'s normal</span>
          <span style={{ fontSize: 13, color: MUTED, fontVariantNumeric: 'tabular-nums' }}>{learning ? `Day ${day} of 14` : 'Baseline learned'}</span>
        </div>
        <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: '#F1F2F5', overflow: 'hidden' }}>
          <div style={{ width: `${learning ? Math.round((day / 14) * 100) : 100}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#8B89DA,#6B6BD6)' }} />
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
          {learning ? `${14 - day} more days and her baseline becomes truly hers.` : 'Her baseline is well-learned — every reading is measured against her own normal.'}
        </div>
      </div>

      {/* what changed */}
      <SectionLabel>What changed</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ChangeRow
          tile={PERI_TINT} tileFg={PERI_DK}
          icon={<path d="M12 3c4 5 6 8.5 6 12a6 6 0 0 1-12 0c0-3.5 2-7 6-12z" />}
          title={gentle ? `Weight ${dPct > 0 ? 'crept up' : 'eased'} a little.` : 'Weight is holding.'}
          sub={gentle ? `${dPct > 0 ? 'Up' : 'Down'} about ${Math.abs(dPct).toFixed(0)}% from her usual — worth a glance.` : `${curW ?? '—'} kg, steady against her baseline.`}
          right={gentle
            ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={TERRA} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={dPct > 0 ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'} /></svg>
            : <span style={{ fontSize: 12, color: SAGE, fontWeight: 600 }}>steady</span>}
        />
        <ChangeRow
          tile={SAGE_BG} tileFg={SAGE}
          icon={<path d="M5 7h14l-1 12H6L5 7zM9 7V5a3 3 0 0 1 6 0v2" />}
          title={activeMeds ? `${activeMeds} medication${activeMeds === 1 ? '' : 's'} on routine.` : 'No medications on routine.'}
          sub={activeMeds ? "Confirmed and tracked — we'll remind you, never nag." : `Nothing to track right now — add one if ${cat.name} starts a course.`}
          right={<span style={{ fontSize: 12, color: activeMeds ? SAGE : MUTED, fontWeight: 600 }}>{activeMeds ? 'on track' : 'none'}</span>}
        />
      </div>

      {/* today at a glance */}
      <SectionLabel>Today at a glance</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Glance label="Meals" value={String(mealsToday)} unit="of 3" caption={mealsToday >= 3 ? 'All in' : 'Tap to log'} captionColor={MUTED} onClick={() => openCheckin()} icon={<path d="M5 2v8a3 3 0 0 0 3 3v9M8 13a3 3 0 0 0 3-3V2M19 2c-2 0-3 1-3 4v6a2 2 0 0 0 2 2v8" />} />
        <Glance label="Weight" value={curW ? String(curW) : '—'} unit="kg" caption={gentle ? 'Keep an eye' : 'Tap to log'} captionColor={gentle ? TERRA : SAGE} onClick={() => openCheckin('weight')} icon={<path d="M5 7h14l-1 12H6L5 7zM9 7V5a3 3 0 0 1 6 0v2" />} />
        <Glance label="Vaccines" value={String(data.vaccinations.length)} unit={data.vaccinations.length && !vaxExpired ? 'current' : 'on record'} caption={vaxExpired ? `${vaxExpired} to review` : 'Tap to add'} captionColor={vaxExpired ? TERRA : SAGE} onClick={() => openCheckin('vaccine')} icon={<path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7z" />} />
        <Glance label="Check-in" value={data.feeding.length ? '✓' : '—'} unit="" caption="Tap to log today" captionColor={MUTED} onClick={() => openCheckin()} icon={<path d="M9 11l3 3L20 6M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />} />
      </div>

      {/* food & nutrition — real product data */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '22px 6px 10px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: MUTED }}>Food &amp; nutrition</span>
        <button onClick={() => nav('/food')} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: PERI }}>Browse all ›</button>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, margin: '0 -16px', padding: '0 16px 4px' }} className="no-scrollbar">
        {foods.length === 0 && <div style={{ fontSize: 13, color: MUTED, padding: '4px 2px' }}>Loading her food library…</div>}
        {foods.map((f) => (
          <button key={f.id} onClick={() => nav('/food')} style={{ flex: 'none', width: 132, background: '#fff', borderRadius: 16, boxShadow: SH_SM, padding: 10, textAlign: 'left', border: 0, cursor: 'pointer' }}>
            <div style={{ width: '100%', height: 96, borderRadius: 11, overflow: 'hidden', background: '#F0ECDF', display: 'grid', placeItems: 'center' }}>
              {f.image_url ? <img src={f.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>🐟</span>}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: INK, marginTop: 8, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as never, minHeight: 30 }}>{f.product_name}</div>
            <div style={{ marginTop: 5, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {f.calories_per_100g != null && <span style={{ fontSize: 10, fontWeight: 600, color: PERI_DK, background: PERI_TINT, borderRadius: 6, padding: '2px 6px' }}>{Math.round(f.calories_per_100g)} kcal</span>}
              {f.moisture_pct != null && <span style={{ fontSize: 10, fontWeight: 600, color: SAGE, background: SAGE_BG, borderRadius: 6, padding: '2px 6px' }}>{Math.round(f.moisture_pct)}% moist</span>}
            </div>
          </button>
        ))}
      </div>

      <DailyCheckin
        open={checkinOpen}
        catId={cat.id}
        catName={cat.name}
        baselineKg={baseW}
        currentKg={curW}
        lastWeightLb={curW ? `${(curW * 2.205).toFixed(1)} lb` : undefined}
        meds={data.medications}
        initialSub={checkinSub}
        onClose={() => setCheckinOpen(false)}
        onSaved={(msg) => { setCheckinOpen(false); setToast(msg); reload() }}
      />
      {toast && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 100, zIndex: 80, padding: '10px 16px', borderRadius: 999, background: PERI, color: '#fff', fontSize: 12.5, fontWeight: 500, boxShadow: SH_MD }}>{toast}</div>
      )}
    </div>
  )
}

/* ===== pieces matching the design ===== */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '22px 6px 10px' }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: MUTED }}>{children}</span>
    </div>
  )
}

function ChangeRow({ tile, tileFg, icon, title, sub, right }: { tile: string; tileFg: string; icon: ReactNode; title: string; sub: string; right: ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: SH_SM, padding: '15px 16px', display: 'flex', alignItems: 'center', gap: 13 }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, flex: 'none', background: tile, color: tileFg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{title}</div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{sub}</div>
      </div>
      {right}
    </div>
  )
}

function Glance({ label, value, unit, caption, captionColor, icon, onClick }: { label: string; value: string; unit: string; caption: string; captionColor: string; icon: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ background: '#fff', borderRadius: 16, boxShadow: SH_SM, padding: 16, textAlign: 'left', border: 0, cursor: 'pointer', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: MUTED }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={MUTED3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: "'Manrope'", fontSize: 28, fontWeight: 500, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', color: INK }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>{unit}</span>}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: captionColor }}>{caption}</div>
    </button>
  )
}

/* ===== shared primitives (imported across screens) ===== */
export function Card({ children, className = '', as = 'div', onClick }: { children: ReactNode; className?: string; as?: 'div' | 'button'; onClick?: () => void }) {
  const style = { background: '#fff', borderRadius: 18, boxShadow: SH_SM } as const
  if (as === 'button') return <button onClick={onClick} className={`w-full ${className}`} style={style}>{children}</button>
  return <div className={className} style={style}>{children}</div>
}

export function Loading() {
  return <div style={{ background: CREAM, minHeight: '100%', paddingTop: 96, textAlign: 'center', color: MUTED, fontSize: 14 }}>Opening her record…</div>
}

export function ErrorCard({ msg }: { msg?: string | null }) {
  return (
    <div style={{ background: CREAM, minHeight: '100%', padding: '80px 20px' }}>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: SH_SM, padding: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: "'Instrument Serif',serif", fontSize: 20, color: '#B8693A' }}>Backend unreachable</p>
        <p style={{ fontSize: 13.5, marginTop: 8, color: MUTED }}>The record could not load. Make sure the API is running on port 8000.</p>
        {msg && <p style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 10, wordBreak: 'break-all', color: '#C2C5DA' }}>{msg}</p>}
      </div>
    </div>
  )
}
