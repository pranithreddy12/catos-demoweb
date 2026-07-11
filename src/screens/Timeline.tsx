import { useMemo, useState } from 'react'
import { usePassport, fmtDate, ageFrom } from '../lib/passport'
import { Loading, ErrorCard } from './Passport'

// One colour system: blue=hydration/up, terracotta=symptom/vet, peri=meds/diet,
// sage=steady, gold=origin.
const INK = '#1A1B2E'
const MUTED = '#757896'
const PERI = '#6B6BD6'
const BLUE = '#5B86C4'
const TERRA = '#B8693A'
const SAGE = '#4B5F42'
const IVORY = '#FAF7F1'

type Kind = 'water' | 'symptom' | 'vet' | 'med' | 'vaccine' | 'origin' | 'weight'
interface Ev { date: Date; kind: Kind; title: string; desc: string }

const ACCENT: Record<Kind, string> = { water: BLUE, symptom: TERRA, vet: TERRA, med: PERI, vaccine: PERI, origin: '#9A7B3A', weight: SAGE }

export default function Timeline() {
  const { data, loading, error } = usePassport()

  const events = useMemo<Ev[]>(() => {
    if (!data) return []
    const out: Ev[] = []
    const { cat } = data
    for (const v of data.vet_visits || [])
      out.push({ date: new Date(v.visit_date), kind: 'vet', title: v.clinic_name ? `Check-up at ${v.clinic_name}` : 'Vet visit', desc: [v.reason, v.diagnosis_given].filter(Boolean).join(' · ') || 'Recorded to her file.' })
    for (const m of data.medications || [])
      out.push({ date: new Date(m.start_date), kind: 'med', title: `Started ${m.medication_name}`, desc: [m.condition_being_treated, m.frequency].filter(Boolean).join(' · ') || 'Added to her routine.' })
    for (const vac of data.vaccinations || [])
      out.push({ date: new Date(vac.administered_date), kind: 'vaccine', title: `${vac.vaccine_name} given`, desc: vac.valid_until ? `Valid until ${fmtDate(vac.valid_until)}.` : 'On the record.' })
    // weight deviations between consecutive weigh-ins
    const wl = (data.weight_logs || []).map((w) => ({ kg: Number(w.weight_kg), at: new Date(w.logged_at) })).sort((a, b) => +a.at - +b.at)
    for (let i = 1; i < wl.length; i++) {
      const pct = wl[i - 1].kg ? ((wl[i].kg - wl[i - 1].kg) / wl[i - 1].kg) * 100 : 0
      if (Math.abs(pct) >= 3)
        out.push({ date: wl[i].at, kind: 'weight', title: pct > 0 ? 'Weight ticked up a little' : 'Weight eased down', desc: `${pct > 0 ? 'Up' : 'Down'} about ${Math.abs(pct).toFixed(0)}% to ${wl[i].kg.toFixed(1)} kg.` })
    }
    if (cat.created_at) out.push({ date: new Date(cat.created_at), kind: 'origin', title: `The day ${cat.name} came home`, desc: 'Her record begins here — kept for as long as you have together.' })
    if (cat.dob) out.push({ date: new Date(cat.dob), kind: 'origin', title: `${cat.name} was born`, desc: 'Where the whole story starts.' })
    return out.filter((e) => !isNaN(+e.date)).sort((a, b) => +b.date - +a.date)
  }, [data])

  const [year] = useState(() => new Date().getFullYear())
  const monthCounts = useMemo(() => {
    const c = new Array(12).fill(0)
    for (const e of events) if (e.date.getFullYear() === year) c[e.date.getMonth()]++
    return c
  }, [events, year])

  if (loading) return <Loading />
  if (error || !data) return <ErrorCard msg={error} />
  const { cat } = data

  // group events: This week, then "Month YYYY", oldest origin grouped by year.
  const now = Date.now()
  const groups: { label: string; items: Ev[] }[] = []
  const push = (label: string, e: Ev) => {
    const g = groups.find((x) => x.label === label)
    if (g) g.items.push(e); else groups.push({ label, items: [e] })
  }
  for (const e of events) {
    const days = (now - +e.date) / 86400000
    if (days <= 7) push('This week', e)
    else if (e.date.getFullYear() === new Date().getFullYear()) push(e.date.toLocaleDateString('en-US', { month: 'long' }), e)
    else push(`${e.date.getFullYear()} · the beginning`, e)
  }
  const nowMonth = new Date().getMonth()

  // "tap a month to jump": scroll to that month's event group (if it has any).
  const slug = (label: string) => 'tl-group-' + label.replace(/\s+/g, '-')
  const jumpToMonth = (i: number) => {
    const label = new Date(year, i, 1).toLocaleDateString('en-US', { month: 'long' })
    document.getElementById(slug(label))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-full px-5 pt-14 pb-10" style={{ background: IVORY }}>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>{cat.name} · {cat.dob ? ageFrom(cat.dob) : '—'}</p>
      <div className="flex items-end justify-between mt-1">
        <h1 className="font-serif text-[30px] leading-tight" style={{ color: INK }}>A life on <span style={{ fontStyle: 'italic', color: PERI }}>one axis</span></h1>
        <span className="text-[12px] rounded-full px-3 py-1.5" style={{ background: 'rgba(26,27,46,.05)', color: MUTED }}>This year</span>
      </div>

      {/* year scrubber */}
      <div className="mt-5 rounded-[20px] p-4" style={{ background: '#FFFCF7', border: '1px solid rgba(26,27,46,.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-medium" style={{ color: INK }}>{year}</span>
          <span className="text-[11px]" style={{ color: PERI }}>tap a month to jump</span>
        </div>
        <div className="flex items-end justify-between gap-1 h-[46px]">
          {monthCounts.map((c, i) => (
            <button key={i} type="button" onClick={() => jumpToMonth(i)} disabled={c === 0}
              title={`${c} event${c === 1 ? '' : 's'}`} aria-label={`Jump to month ${i + 1}, ${c} events`}
              className="flex-1 h-full flex items-end p-0 border-0 bg-transparent"
              style={{ cursor: c === 0 ? 'default' : 'pointer' }}>
              <span className="w-full rounded-t-[4px] transition-all block"
                style={{ height: `${Math.max(18, Math.min(100, 28 + c * 26))}%`, background: i === nowMonth ? PERI : 'rgba(107,107,214,.18)' }} />
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-1.5 text-[8px]" style={{ color: MUTED }}>
          {'JFMAMJJASOND'.split('').map((m, i) => <span key={i} className="flex-1 text-center">{m}</span>)}
        </div>
      </div>

      {/* event groups */}
      {groups.length === 0 && (
        <p className="mt-8 text-[13px]" style={{ color: MUTED }}>Nothing logged yet — her timeline fills in as you go.</p>
      )}
      {groups.map((g) => (
        <div key={g.label} id={slug(g.label)} className="mt-7">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] mb-3" style={{ color: MUTED }}>{g.label}</p>
          <div className="relative pl-7">
            <span className="absolute left-[10px] top-1 bottom-1 w-px" style={{ background: 'rgba(26,27,46,.1)' }} />
            {g.items.map((e, i) => (
              <div key={i} className="relative mb-3">
                <span className="absolute -left-[26px] top-1 w-[22px] h-[22px] rounded-full grid place-items-center" style={{ background: `${ACCENT[e.kind]}1f` }}><Dot kind={e.kind} /></span>
                <div className="rounded-[16px] px-4 py-3" style={{ background: '#fff', border: '1px solid rgba(26,27,46,.06)' }}>
                  <p className="text-[14.5px] font-semibold leading-tight" style={{ color: INK }}>{e.title}</p>
                  <p className="text-[12.5px] leading-relaxed mt-0.5" style={{ color: MUTED }}>{e.desc}</p>
                  <p className="text-[11px] mt-1.5" style={{ color: '#A6A8BC' }}>{fmtDate(e.date.toISOString())}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="mt-9 text-center font-serif italic text-[13px]" style={{ color: MUTED }}>kept for as long as you have together</p>
    </div>
  )
}

function Dot({ kind }: { kind: Kind }) {
  const c = ACCENT[kind]
  const p: Record<Kind, JSX.Element> = {
    water: <path d="M12 3s6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 6-10 6-10z" />,
    symptom: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
    vet: <path d="M12 5v14M5 12h14" />,
    med: <><rect x="3" y="9" width="13" height="6" rx="3" /><path d="M9.5 9.5l3 5" /></>,
    vaccine: <path d="M5 19l4-4M14 6l4 4M9 15l6-6 1 1-6 6z" />,
    origin: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8z" />,
    weight: <><rect x="4" y="7" width="16" height="13" rx="2" /><path d="M9 7a3 3 0 0 1 6 0" /></>,
  }
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{p[kind]}</svg>
}
