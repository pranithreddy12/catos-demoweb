import { useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePassport, fmtDate, ageFrom } from '../lib/passport'
import { Loading, ErrorCard, Card } from './Passport'

// ===== one system: clean periwinkle on ivory; dark cover = brand moment =====
const PERI = '#6B6BD6'
const INK = '#1A1B2E'
const MUTED = '#757896'
const GREEN = '#4B5F42'
const TERRA = '#B8693A'
const IVORY = '#FAF7F1'
const G3 = '#E8CE86'
const FOIL = 'linear-gradient(96deg,#cdb27a 0%,#f3e6bf 32%,#d8be86 52%,#fff4d6 66%,#cab277 100%)'

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1)

export default function PassportBook() {
  const { data, loading, error } = usePassport()
  const [open, setOpen] = useState(false)

  // when the passport opens, reveal the chapters from the very top (Chapter I)
  useEffect(() => {
    if (open) {
      const sc = document.querySelector('.no-scrollbar')
      if (sc) sc.scrollTop = 0
    }
  }, [open])
  const nav = useNavigate()

  if (loading) return <Loading />
  if (error || !data) return <ErrorCard msg={error} />
  const { cat } = data

  return (
    <div className="relative min-h-full" style={{ background: IVORY }}>
      {/* chapters */}
      <div className="min-h-full px-5 pt-14 pb-12" style={{ background: IVORY }}>
        <p className="text-[13px] font-medium" style={{ color: MUTED }}>Passport</p>
        <h1 className="font-serif text-[30px] leading-tight mt-0.5" style={{ color: INK }}>{cat.name}'s record.</h1>

        <ChapterStanding data={data} />
        <ChapterIdentity data={data} />
        <ChapterNormal data={data} />
        <ChapterGuardianship data={data} />
        <ChapterChronicle data={data} />
        <ChapterStamps data={data} />

        <button onClick={() => nav('/insights')} className="mt-6 w-full rounded-[22px] p-4 flex items-center justify-center gap-2 font-semibold text-[14px] text-white active:scale-[0.99] transition" style={{ background: `linear-gradient(150deg,${PERI},#45459A)` }}>
          See {cat.name} against her baseline ›
        </button>
        <p className="mt-7 text-center font-serif italic text-[13px]" style={{ color: '#9498B0' }}>one continuous record — birth to legacy</p>
      </div>

      {/* ===== dark cover (the one ceremonial moment) ===== */}
      <div
        onClick={() => setOpen(true)}
        className="absolute inset-0 z-30 flex flex-col items-center text-center px-8 pt-16 pb-10 transition-all duration-700"
        style={{ background: 'radial-gradient(125% 78% at 50% 20%, #3a3a86 0%, #1c1c52 46%, #0e0e28 100%)', transform: open ? 'translateY(-102%)' : 'translateY(0)', opacity: open ? 0 : 1, pointerEvents: open ? 'none' : 'auto' }}
      >
        <div className="font-mono text-[10px] tracking-[0.4em] uppercase" style={{ backgroundImage: FOIL, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>United Feline Record</div>
        <div className="font-serif text-[31px] leading-tight mt-7" style={{ backgroundImage: FOIL, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>The Feline Passport</div>
        <div className="mt-8"><Crest color={G3} size={100} /></div>
        <div className="font-serif text-[52px] leading-none mt-6" style={{ backgroundImage: FOIL, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{cat.name}</div>
        <div className="mt-4 font-mono text-[10px] tracking-[0.22em] uppercase leading-[2]" style={{ color: '#B9C0E0' }}>
          {cat.breed_name || 'Domestic Shorthair'}<br />on record since {cat.dob ? new Date(cat.dob).getFullYear() : new Date(cat.created_at || 0).getFullYear() || '—'}
        </div>
        <div className="flex-1" />
        <button className="mt-6 w-full rounded-full py-3.5 font-mono text-[12px] tracking-[0.18em] uppercase font-semibold flex items-center justify-center gap-2.5" style={{ background: '#FDFBF6', color: '#1c1c4a' }}>
          Open passport <span>→</span>
        </button>
      </div>

      {open && (
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 z-40 w-9 h-9 rounded-full grid place-items-center" style={{ background: '#fff', border: '1px solid rgba(26,27,46,.08)', color: INK }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      )}
    </div>
  )
}

/* ===== chapters (clean light) ===== */
function Chapter({ no, title, children }: { no: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="font-mono text-[9px] tracking-[0.24em] uppercase flex items-center gap-2.5" style={{ color: PERI }}>
        {no}<span className="flex-1 h-px" style={{ background: 'rgba(107,107,214,.2)' }} />
      </div>
      <h2 className="font-serif text-[26px] leading-tight mt-2.5 mb-3" style={{ color: INK }}>{title}</h2>
      {children}
    </section>
  )
}

function ChapterStanding({ data }: { data: any }) {
  const { cat } = data
  const wl = data.weight_logs || []
  const ws = wl.map((w: any) => Number(w.weight_kg))
  const curW = ws.length ? ws[ws.length - 1] : cat.weight_kg
  const base = ws.length ? mean(ws) : null
  const dPct = base && curW ? ((curW - base) / base) * 100 : 0
  const steady = Math.abs(dPct) < 3
  const activeMeds = data.medications.filter((m: any) => m.active).length
  const lastVisit = [...(data.vet_visits || [])].sort((a, b) => +new Date(b.visit_date) - +new Date(a.visit_date))[0]
  const entries = wl.length + data.vaccinations.length + (data.vet_visits?.length || 0) + data.medications.length + (data.feeding?.length || 0)
  return (
    <Chapter no="Chapter I · Standing" title={<><span>{cat.name} is </span><span style={{ fontStyle: 'italic', color: GREEN }}>{steady ? 'holding steady' : 'on the radar'}</span>.</>}>
      <Card className="overflow-hidden">
        <Row l="Weight" r={base ? (steady ? `Steady · ${curW} kg` : `${dPct > 0 ? 'Up' : 'Down'} ${Math.abs(dPct).toFixed(0)}% · ${curW} kg`) : (curW ? `${curW} kg` : '—')} ok={steady} />
        <Row l="Weigh-ins" r={`${wl.length} on record`} ok />
        <Row l="Medications" r={activeMeds ? `${activeMeds} active` : 'None'} ok={activeMeds === 0 || true} />
        <Row l="Last vet visit" r={lastVisit ? fmtDate(lastVisit.visit_date) : 'None recorded'} last />
      </Card>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Stat k="On record" v={ageFrom(cat.created_at)} s={`since ${fmtDate(cat.created_at)}`} />
        <Stat k="Entries" v={String(entries)} green s="all from her record" />
      </div>
    </Chapter>
  )
}

function ChapterIdentity({ data }: { data: any }) {
  const { cat, owner } = data
  return (
    <Chapter no="Chapter II · Identity" title={cat.name}>
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="w-[92px] h-[112px] flex-none rounded-2xl overflow-hidden" style={{ background: '#ECE5D2' }}>
            {cat.profile_photo_url ? <img src={cat.profile_photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-3xl">🐱</div>}
          </div>
          <div className="pt-1 grid grid-cols-2 gap-x-3 gap-y-3 flex-1">
            <Field k="Breed" v={cat.breed_name || 'Domestic shorthair'} />
            <Field k="Sex" v={cap(cat.sex)} />
            <Field k="Born" v={fmtDate(cat.dob)} />
            <Field k="Age" v={ageFrom(cat.dob)} />
          </div>
        </div>
        <div className="mt-4 pt-3 grid grid-cols-1 gap-3" style={{ borderTop: '1px solid rgba(26,27,46,.06)' }}>
          <Field k="Guardian" v={owner?.display_name || 'You'} />
          <Field k="Microchip" v={cat.microchip_id || '—'} mono />
          <Field k="Passport No." v={passNo(cat.id)} mono />
        </div>
      </Card>
    </Chapter>
  )
}

function ChapterNormal({ data }: { data: any }) {
  const wl = data.weight_logs || []
  const ws = wl.map((w: any) => Number(w.weight_kg))
  const lo = ws.length ? Math.min(...ws) : 0
  const hi = ws.length ? Math.max(...ws) : 1
  const base = ws.length ? mean(ws) : 0
  const cur = ws.length ? ws[ws.length - 1] : 0
  const span = Math.max(hi - lo, 0.1)
  const pos = Math.max(6, Math.min(94, ((cur - lo) / span) * 100))
  // "In range" = current weight close to her learned baseline (within 3%, the
  // app-wide steady threshold) — not the trivial "inside its own min/max".
  const devPct = base ? ((cur - base) / base) * 100 : 0
  const inRange = ws.length > 0 && Math.abs(devPct) < 3
  // Confidence scales with how many weigh-ins the baseline was learned from.
  const confident = wl.length >= 5
  return (
    <Chapter no="Chapter III · Her Normal" title={<>What <span style={{ fontStyle: 'italic', color: PERI }}>normal</span> looks like.</>}>
      <p className="text-[13px] leading-relaxed mb-3" style={{ color: MUTED }}>Her own baseline, learned from her records — the line everything is measured against.</p>
      <Card className="p-4">
        <div className="flex justify-between items-baseline">
          <span className="text-[14.5px] font-semibold" style={{ color: INK }}>Weight</span>
          <span className="font-mono text-[9px] uppercase tracking-wide flex items-center gap-1.5" style={{ color: inRange ? GREEN : PERI }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: inRange ? GREEN : PERI }} />{inRange ? 'In range' : 'Watch'}
          </span>
        </div>
        <div className="relative h-8 mt-3">
          <div className="absolute left-0 right-0 top-3 h-1.5 rounded-full" style={{ background: 'rgba(26,27,46,.07)' }} />
          <div className="absolute top-3 h-1.5 rounded-full" style={{ left: '12%', right: '12%', background: 'rgba(107,107,214,.3)' }} />
          <div className="absolute top-2 w-3.5 h-3.5 rounded-full" style={{ left: `${pos}%`, transform: 'translateX(-50%)', background: PERI, border: '2px solid #fff', boxShadow: '0 2px 6px rgba(107,107,214,.4)' }} />
          <div className="absolute top-6 left-0 font-mono text-[8.5px]" style={{ color: MUTED }}>{lo.toFixed(1)} kg</div>
          <div className="absolute top-6 right-0 font-mono text-[8.5px]" style={{ color: MUTED }}>{hi.toFixed(1)} kg</div>
        </div>
        <p className="mt-4 text-[12px]" style={{ color: MUTED }}>{inRange ? 'Holding around' : 'Now at'} <b style={{ color: INK }}>{cur} kg</b> · baseline {base.toFixed(2)} kg.</p>
      </Card>
      <p className="mt-3 font-mono text-[9px] tracking-wide flex items-center gap-1.5" style={{ color: confident ? GREEN : MUTED }}>
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: confident ? GREEN : MUTED }} />{confident ? 'High confidence' : 'Building confidence'} · {wl.length} weigh-in{wl.length === 1 ? '' : 's'}
      </p>
    </Chapter>
  )
}

function ChapterGuardianship({ data }: { data: any }) {
  const { cat, owner } = data
  return (
    <Chapter no="Chapter IV · Guardianship" title={<>The chain of <span style={{ fontStyle: 'italic', color: PERI }}>care</span>.</>}>
      <Card className="p-4">
        <Node title="Born" role="origin" meta={`${fmtDate(cat.dob)} · the first entry in her record.`} />
        <Node title={owner?.display_name || 'You'} role="primary guardian" meta={`On record since ${fmtDate(cat.created_at)} · current holder.`} cur last />
      </Card>
    </Chapter>
  )
}

function ChapterChronicle({ data }: { data: any }) {
  const { cat, owner } = data
  const evs: { date: Date; year: string; t: string; d: string; flag?: boolean }[] = []
  const push = (iso: string | undefined, t: string, d: string, flag = false) => {
    if (!iso) return
    const dt = new Date(iso); if (isNaN(dt.getTime())) return
    evs.push({ date: dt, year: String(dt.getFullYear()), t, d, flag })
  }
  push(cat.dob, 'Born', `${cat.breed_name || 'Domestic shorthair'} · her record begins.`)
  push(cat.created_at, 'Joined the record', `Into the care of ${owner?.display_name || 'you'}.`)
  const wl = data.weight_logs || []
  if (wl.length) push(wl[0].logged_at, 'Baseline began', `First weigh-in · ${Number(wl[0].weight_kg)} kg.`)
  data.vaccinations.forEach((v: any) => push(v.administered_date, `${v.vaccine_name} vaccine`, v.clinic_name || ''))
  data.vet_visits.forEach((v: any) => push(v.visit_date, v.reason || 'Vet visit', v.diagnosis_given || '', !!v.diagnosis_given && !/healthy|stable|normal/i.test(v.diagnosis_given)))
  data.medications.forEach((m: any) => push(m.start_date, `Started ${m.medication_name}`, m.condition_being_treated || ''))
  evs.sort((a, b) => a.date.getTime() - b.date.getTime())
  return (
    <Chapter no="Chapter V · Health Chronicle" title={<>A story of <span style={{ fontStyle: 'italic', color: PERI }}>proactive</span> care.</>}>
      <Card className="p-4">
        {evs.map((e, i) => (
          <div key={i} className="relative pl-11 pb-5 last:pb-0">
            {i < evs.length - 1 && <span className="absolute left-[19px] top-1.5 bottom-[-10px] w-px" style={{ background: 'rgba(26,27,46,.1)' }} />}
            <span className="absolute left-0 top-[-2px] w-9 font-serif italic text-[13px]" style={{ color: MUTED }}>{e.year}</span>
            <span className="absolute left-[15px] top-1.5 w-[11px] h-[11px] rounded-full" style={{ background: '#fff', border: `2px solid ${e.flag ? TERRA : PERI}` }} />
            <div className="text-[14px] font-semibold" style={{ color: e.flag ? TERRA : INK }}>{e.t}</div>
            {e.d && <div className="text-[12px] mt-0.5" style={{ color: MUTED }}>{e.d}</div>}
          </div>
        ))}
      </Card>
    </Chapter>
  )
}

function ChapterStamps({ data }: { data: any }) {
  const stamps = data.vaccinations.map((v: any) => ({ lab: v.vaccine_name, dt: new Date(v.administered_date).getFullYear() }))
  stamps.push({ lab: 'On Record', dt: new Date(data.cat.created_at || 0).getFullYear() || '—' })
  return (
    <Chapter no="Chapter VI · Official Record" title={<>Earned, not <span style={{ fontStyle: 'italic', color: PERI }}>collected</span>.</>}>
      <div className="grid grid-cols-2 gap-3">
        {stamps.map((s: any, i: number) => (
          <Card key={i} className="py-5 flex flex-col items-center justify-center text-center">
            <span className="w-12 h-12 rounded-full grid place-items-center mb-2" style={{ background: 'rgba(107,107,214,.08)', color: PERI }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </span>
            <div className="font-mono text-[10px] tracking-wide uppercase font-semibold px-2 leading-tight" style={{ color: INK }}>{s.lab}</div>
            <div className="font-mono text-[8px] mt-1" style={{ color: MUTED }}>{s.dt}</div>
          </Card>
        ))}
      </div>
    </Chapter>
  )
}

/* ===== bits ===== */
function passNo(id: string) { return `LC·${String(new Date().getFullYear()).slice(2)}·${(id || '').replace(/\D/g, '').slice(0, 6).padStart(6, '0')}` }
function cap(s?: string) { return s ? s[0].toUpperCase() + s.slice(1) : '—' }
function Row({ l, r, ok, last }: { l: string; r: string; ok?: boolean; last?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: last ? 'none' : '1px solid rgba(26,27,46,.06)' }}>
      <span className="text-[13.5px]" style={{ color: INK }}>{l}</span>
      <span className="font-mono text-[11px]" style={{ color: ok ? GREEN : MUTED }}>{r}</span>
    </div>
  )
}
function Stat({ k, v, s, green }: { k: string; v: string; s: string; green?: boolean }) {
  return (
    <Card className="p-4">
      <div className="font-mono text-[8px] tracking-[0.18em] uppercase" style={{ color: MUTED }}>{k}</div>
      <div className="font-serif text-[22px] mt-1 leading-none" style={{ color: green ? GREEN : INK }}>{v}</div>
      <div className="text-[10.5px] mt-1" style={{ color: MUTED }}>{s}</div>
    </Card>
  )
}
function Field({ k, v, mono }: { k: string; v?: string; mono?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[8px] tracking-[0.14em] uppercase" style={{ color: MUTED }}>{k}</div>
      <div className={`text-[14px] mt-0.5 font-medium ${mono ? 'font-mono text-[12px]' : ''}`} style={{ color: INK }}>{v || '—'}</div>
    </div>
  )
}
function Node({ title, role, meta, cur, last }: { title: string; role: string; meta: string; cur?: boolean; last?: boolean }) {
  return (
    <div className="relative pl-8 pb-5 last:pb-0">
      {!last && <span className="absolute left-[13px] top-5 bottom-[-8px] w-px" style={{ background: 'rgba(26,27,46,.12)' }} />}
      <span className="absolute left-1.5 top-1 w-[13px] h-[13px] rounded-full" style={{ background: '#fff', border: `2px solid ${cur ? PERI : MUTED}` }} />
      <div className="text-[16px] font-semibold" style={{ color: INK }}>{title}</div>
      <div className="font-mono text-[8.5px] tracking-[0.18em] uppercase mt-1" style={{ color: PERI }}>{role}</div>
      <div className="text-[12px] mt-1.5" style={{ color: MUTED }}>{meta}</div>
    </div>
  )
}
function Crest({ color, size = 60 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="1.4" opacity="0.6" />
      <circle cx="60" cy="60" r="42" fill="none" stroke={color} strokeWidth="0.7" opacity="0.4" />
      <path d="M60 36c-10 0-17 9-17 20 0 13 10 24 17 28 7-4 17-15 17-28 0-11-7-20-17-20z" fill={color} opacity="0.16" />
      <path d="M51 54c0-5 4-9 9-9s9 4 9 9" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="53" cy="60" r="2" fill={color} /><circle cx="67" cy="60" r="2" fill={color} />
    </svg>
  )
}
