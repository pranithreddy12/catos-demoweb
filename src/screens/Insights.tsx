import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePassport } from '../lib/passport'
import { Loading, ErrorCard } from './Passport'
import NotADiagnosis from '../components/NotADiagnosis'
import type { Pattern, OwnerSummary } from '../api'

type Range = '7d' | '30d' | '1y'
const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '1y': 365 }

// final design tokens
const CREAM = '#FAF7F1'
const INK = '#1A1B2E'
const INK2 = '#2A2C45'
const MUTED = '#757896'
const MUTED2 = '#565878'
const MUTED3 = '#9498B0'
const PERI = '#6B6BD6'
const PERI_DK = '#45459A'
const PERI_TINT = '#E3E2FA'
const PERI_BG = '#F2F1FC'
const SAGE = '#4B5F42'
const SAGE_BG = '#DDE6D8'
const SAGE_LINE = '#607855'
const AMBER = '#DD8649'
const PEACH = '#FAE7D5'
const TERRA = '#C97B5B'
const TAN = '#F4EFE4'
const SH = '0 1px 2px rgba(26,27,46,.04),0 4px 12px rgba(26,27,46,.04)'

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1)

// build the design's sparkline path (area + line) from a real series
function spark(series: number[]) {
  const n = series.length
  if (n < 2) return null
  const lo = Math.min(...series), hi = Math.max(...series)
  const span = hi - lo || 1
  const W = 140, H = 48, top = 8, bot = 40
  const pts = series.map((v, i) => [(i / (n - 1)) * W, bot - ((v - lo) / span) * (bot - top)] as const)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(0)},${p[1].toFixed(0)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  return { line, area, end: pts[n - 1] }
}

export default function Insights() {
  const { data, loading, error } = usePassport()
  const nav = useNavigate()
  const [range, setRange] = useState<Range>('30d')
  if (loading) return <Loading />
  if (error || !data) return <ErrorCard msg={error} />
  const { cat } = data

  // Time-range filter for the whole view (the 7d/30d/1y toggle).
  const cutoff = Date.now() - RANGE_DAYS[range] * 86400000
  const inRange = <T extends { logged_at?: string }>(rows: T[]): T[] =>
    rows.filter((r) => !r.logged_at || new Date(r.logged_at).getTime() >= cutoff)

  const ws = inRange(data.weight_logs || []).map((w) => Number(w.weight_kg))
  const mealsInRange = inRange(data.feeding || []).length

  // Water / thirst: the qualitative less/normal/more check-in mapped to 1/2/3.
  const WATER_N: Record<string, number> = { less: 1, normal: 2, more: 3 }
  const WATER_LABEL: Record<number, string> = { 1: 'Low', 2: 'Normal', 3: 'High' }
  const checkins = inRange(data.checkins || []).filter((c) => c.water)
  const waterSeries = checkins.map((c) => WATER_N[(c.water || '').toLowerCase()] ?? 2)
  const waterLast = waterSeries.length ? waterSeries[waterSeries.length - 1] : null
  const waterSteady = waterLast === 2

  // Appetite: the logged % eaten per check-in — recent vs the range's mean.
  // No fabricated "steady": it reads "learning" until there are enough check-ins.
  const ateSeries = inRange(data.checkins || []).filter((c) => c.ate_pct != null).map((c) => c.ate_pct as number)
  const ateBase = ateSeries.length ? mean(ateSeries) : null
  const ateLast = ateSeries.length ? ateSeries[ateSeries.length - 1] : null
  const ateDelta = ateBase && ateLast != null ? ((ateLast - ateBase) / ateBase) * 100 : 0
  const ateGentle = ateSeries.length >= 2 && Math.abs(ateDelta) >= 10
  const wBase = ws.length ? mean(ws) : null
  const wCur = ws.length ? ws[ws.length - 1] : null
  const wDelta = wBase && wCur ? ((wCur - wBase) / wBase) * 100 : 0
  const wGentle = Math.abs(wDelta) >= 3

  // Rendered as JSX (not an HTML string) so the user-controlled cat name is a
  // text node React escapes — a cat named "<img onerror=...>" can't inject script.
  const obs = wGentle ? (
    <>{cat.name}'s weight has {wDelta > 0 ? 'crept up' : 'eased'} <em>gently</em> this month.</>
  ) : (
    <>{cat.name}'s numbers are holding <em>steady</em> against her own normal.</>
  )

  // "What this might mean" — driven by the real intelligence (narrative +
  // consolidated patterns), not a weight heuristic. Taps through to the vet summary.
  const patternCount = data.owner_summary?.pattern_count ?? 0
  const urgentTone = data.owner_summary?.tone === 'ACUTE' || !!data.owner_summary?.emergency
  const meaning = patternCount > 0
    ? {
        title: urgentTone
          ? 'Some signs need prompt vet attention — see the note above.'
          : `${patternCount === 1 ? 'A change is' : `${patternCount} changes are`} worth mentioning to your vet.`,
        sub: 'Tap to prepare a vet-ready summary — the numbers are ready when you visit.',
        fg: urgentTone ? TERRA : PERI, bg: urgentTone ? '#FBEDE4' : PERI_BG,
      }
    : {
        title: 'Nothing here needs action — a steady record is its own kind of good news.',
        sub: 'A gentle note, not a prescription. Tap any time to prep a vet summary.',
        fg: SAGE, bg: SAGE_BG,
      }

  return (
    <div style={{ minHeight: '100%', background: CREAM, padding: '56px 16px 120px' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '8px 8px 14px' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: MUTED }}>Against her own baseline</div>
          <h1 style={{ margin: '4px 0 0', fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 34, lineHeight: 1.02, letterSpacing: '-.02em', color: INK }}>Insights</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, background: TAN, padding: 4, borderRadius: 999 }}>
            {(['7d', '30d', '1y'] as Range[]).map((p) => {
              const on = p === range
              return (
                <button key={p} onClick={() => setRange(p)} style={{ border: 0, cursor: 'pointer', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: on ? INK : MUTED, background: on ? '#fff' : 'transparent', boxShadow: on ? '0 1px 2px rgba(26,27,46,.06)' : 'none' }}>{p}</button>
              )
            })}
          </div>
          <button onClick={() => nav('/profile')} aria-label="Account & sign out" style={{ border: 0, background: 'transparent', cursor: 'pointer', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}>
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></svg>
          </button>
        </div>
      </div>

      <div style={{ padding: '0 6px 14px' }}><NotADiagnosis /></div>

      {/* Worth mentioning — when clusters co-fire, ONE consolidated card (never
          N cards, never a disease name, no asserted relationship). Falls back to
          per-pattern cards for older API responses without owner_summary. */}
      {data.owner_summary && data.owner_summary.pattern_count > 0 ? (
        <div style={{ marginBottom: 18 }}>
          <div style={{ padding: '0 6px 10px' }}><span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: MUTED }}>Worth mentioning to your vet</span></div>
          <ConsolidatedCard s={data.owner_summary} validated={(data.patterns || []).every((p) => p.clinically_validated)} />
        </div>
      ) : (data.patterns && data.patterns.length > 0) && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ padding: '0 6px 10px' }}><span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: MUTED }}>Worth mentioning to your vet</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.patterns.map((p, i) => <PatternCard key={i} p={p} />)}
          </div>
        </div>
      )}

      {/* quiet observation */}
      <div style={{ background: PERI_BG, borderRadius: 20, padding: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: PERI_DK }}>Quiet observation</div>
        <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 26, lineHeight: 1.15, letterSpacing: '-.01em', color: INK, marginTop: 6 }}>{obs}</div>
        <div style={{ fontSize: 14, color: MUTED2, marginTop: 10, lineHeight: 1.55 }}>
          {wGentle
            ? `Small, steady, and worth keeping in view — exactly the kind of thing a record is for. Nothing to act on today.`
            : `Reassuring across the board. We'll keep watching quietly and tell you only if something shifts.`}
        </div>
      </div>

      {/* trends */}
      <div style={{ padding: '22px 6px 10px' }}><span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: MUTED }}>Trends</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Trend
          label="Weight" tile={SAGE_BG} tileFg={SAGE} line={SAGE_LINE} fill={SAGE_BG}
          icon={<path d="M5 7h14l-1 12H6L5 7zM9 7V5a3 3 0 0 1 6 0v2" />}
          delta={wGentle ? `${wDelta > 0 ? '↑' : '↓'} ${Math.abs(wDelta).toFixed(0)}%` : 'steady'} deltaColor={wGentle ? TERRA : SAGE}
          value={wCur != null ? String(wCur) : '—'} unit="kg" baseline={wBase != null ? `Baseline ${wBase.toFixed(1)} kg` : 'Learning her normal'}
          series={ws}
        />
        <Trend
          label="Appetite" tile={PEACH} tileFg={AMBER} line={AMBER} fill={PEACH}
          icon={<path d="M5 2v8a3 3 0 0 0 3 3v9M8 13a3 3 0 0 0 3-3V2M19 2c-2 0-3 1-3 4v6a2 2 0 0 0 2 2v8" />}
          delta={ateSeries.length < 2 ? 'learning' : ateGentle ? `${ateDelta > 0 ? '↑' : '↓'} ${Math.abs(ateDelta).toFixed(0)}%` : 'steady'}
          deltaColor={ateSeries.length < 2 ? MUTED : ateGentle ? TERRA : SAGE}
          value={`${mealsInRange || 0}`} unit="meals logged"
          baseline={ateSeries.length ? `Avg ${Math.round(ateBase!)}% eaten · ${ateSeries.length} check-ins` : 'Log daily check-ins to track her pace'}
          series={ateSeries}
        />
        <Trend
          label="Water" tile={PERI_TINT} tileFg={PERI}
          icon={<path d="M12 3c4 5 6 8.5 6 12a6 6 0 0 1-12 0c0-3.5 2-7 6-12z" />} line={PERI} fill={PERI_TINT}
          delta={waterSeries.length < 3 ? 'learning' : waterSteady ? 'steady' : WATER_LABEL[waterLast!].toLowerCase()}
          deltaColor={waterSeries.length < 3 ? MUTED : waterSteady ? SAGE : AMBER}
          value={waterLast != null ? WATER_LABEL[waterLast] : '—'}
          unit={waterLast != null ? 'thirst' : ''}
          baseline={waterSeries.length ? `${waterSeries.length} days logged · reported level` : 'Log a few days to see her pattern'}
          series={waterSeries}
        />
      </div>

      {/* what this might mean — reflects the live narrative; taps to the vet summary */}
      <div style={{ padding: '22px 6px 10px' }}><span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: MUTED }}>What this might mean</span></div>
      <button onClick={() => nav('/vet-summary')} style={{ width: '100%', textAlign: 'left', background: '#fff', borderRadius: 18, boxShadow: SH, padding: 18, display: 'flex', gap: 12, alignItems: 'flex-start', border: 0, cursor: 'pointer' }}>
        <div style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: meaning.bg, color: meaning.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" /><path d="M4 4v12a4 4 0 0 0 4 4" /></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.35 }}>{meaning.title}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>{meaning.sub}</div>
        </div>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={MUTED3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  )
}

// A "pattern worth mentioning" — calm, never a diagnosis. Urgent patterns
// (urinary red flags) get a warmer accent + a prompt-vet line; everything else
// is gentle. Always tagged preliminary until a vet signs off the thresholds.
function PatternCard({ p }: { p: Pattern }) {
  const urgent = p.urgency_level === 'urgent'
  const accent = urgent ? TERRA : PERI
  const tint = urgent ? '#FBEDE4' : PERI_BG
  return (
    <div style={{ background: '#fff', borderRadius: 18, boxShadow: SH, padding: 18, borderLeft: `3px solid ${accent}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: tint, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            {urgent ? <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></> : <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>}
          </svg>
        </div>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: INK, lineHeight: 1.25 }}>{p.owner_label}</span>
      </div>
      <div style={{ display: 'inline-block', marginTop: 12, fontSize: 11, fontWeight: 600, color: accent, background: tint, padding: '4px 10px', borderRadius: 999, textTransform: 'capitalize' }}>{p.area}</div>
      <div style={{ fontSize: 13.5, color: MUTED2, marginTop: 10, lineHeight: 1.55 }}>{p.owner_note}</div>
      <div style={{ fontSize: 11, color: MUTED3, marginTop: 12, lineHeight: 1.5, borderTop: '1px solid rgba(26,27,46,.06)', paddingTop: 10 }}>
        Not a diagnosis — a preliminary pattern from {`her`} logs that {p.clinically_validated ? 'your vet can confirm' : 'is still being clinically reviewed'}. Your vet is the one to confirm what it means.
      </div>
    </div>
  )
}

// When 2+ patterns co-fire, the owner sees ONE card, not N. The backend already
// wrote disease-name-free, relationship-free copy routed to a single vet visit
// (Dr May Q-HYPER-C2); this just renders it. ACUTE / emergency leads warm, the
// body areas are shown as chips so the owner can mention each at the one visit.
function ConsolidatedCard({ s, validated }: { s: OwnerSummary; validated: boolean }) {
  const urgent = s.tone === 'ACUTE' || s.emergency
  const accent = urgent ? TERRA : PERI
  const tint = urgent ? '#FBEDE4' : PERI_BG
  const multi = s.pattern_count >= 2
  return (
    <div style={{ background: '#fff', borderRadius: 18, boxShadow: SH, padding: 18, borderLeft: `3px solid ${accent}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: tint, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            {urgent ? <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></> : <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>}
          </svg>
        </div>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: INK, lineHeight: 1.25 }}>{s.headline}</span>
      </div>
      {multi && s.areas && s.areas.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {s.areas.map((a, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 600, color: accent, background: tint, padding: '4px 10px', borderRadius: 999, textTransform: 'capitalize' }}>{a}</span>
          ))}
        </div>
      )}
      <div style={{ fontSize: 13.5, color: MUTED2, marginTop: 10, lineHeight: 1.55 }}>{s.body}</div>
      <div style={{ fontSize: 11, color: MUTED3, marginTop: 12, lineHeight: 1.5, borderTop: '1px solid rgba(26,27,46,.06)', paddingTop: 10 }}>
        Not a diagnosis — {multi ? 'preliminary patterns from her logs, gathered for a single vet visit' : 'a preliminary pattern from her logs'} that {validated ? 'your vet can confirm' : 'is still being clinically reviewed'}. Your vet is the one to confirm what it means.
      </div>
    </div>
  )
}

function Trend({ label, tile, tileFg, icon, delta, deltaColor, value, unit, baseline, series, line, fill }: {
  label: string; tile: string; tileFg: string; icon: React.ReactNode; delta: string; deltaColor: string
  value: string; unit: string; baseline: string; series: number[]; line: string; fill: string
}) {
  const sp = spark(series)
  return (
    <div style={{ background: '#fff', borderRadius: 18, boxShadow: SH, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 10, flex: 'none', background: tile, color: tileFg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: INK2 }}>{label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: deltaColor, fontWeight: 600 }}>{delta}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: "'Manrope'", fontSize: 30, fontWeight: 500, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', color: INK }}>{value}</span>
            {unit && <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>{unit}</span>}
          </div>
          <div style={{ fontSize: 12, color: MUTED3, marginTop: 2 }}>{baseline}</div>
        </div>
        {sp ? (
          <svg width="140" height="48" viewBox="0 0 140 48" style={{ overflow: 'visible' }}>
            <path d={sp.area} fill={fill} opacity=".5" />
            <path d={sp.line} stroke={line} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={sp.end[0]} cy={sp.end[1]} r="3.5" fill={line} />
          </svg>
        ) : (
          <span style={{ fontSize: 11, color: MUTED3, fontStyle: 'italic' }}>still learning</span>
        )}
      </div>
    </div>
  )
}
