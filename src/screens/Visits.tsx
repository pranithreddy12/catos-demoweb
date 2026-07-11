import { useRef, useState } from 'react'
import { usePassport, fmtDate } from '../lib/passport'
import { api } from '../api'
import { Loading, ErrorCard } from './Passport'

const NAVY = '#1A1B2E'
const GOLD = '#8a6a24'
const TERRA = '#B8693A'
const GREEN = '#4B5F42'

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1)

interface Ev {
  date: Date
  year: string
  title: string
  desc: string
  flag?: boolean
  cur?: boolean
}

// The Health Timeline (R6 / P1) — the cat's whole life on one axis, merged
// from every dated record. "The moat made visible."
export default function Visits() {
  const { data, loading, error, offline, reload } = usePassport()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  if (loading) return <Loading />
  if (error || !data) return <ErrorCard msg={error} />

  const { cat, owner } = data
  const evs: Ev[] = []
  const push = (iso: string | undefined, title: string, desc: string, opts: Partial<Ev> = {}) => {
    if (!iso) return
    const d = new Date(iso)
    if (isNaN(d.getTime())) return
    evs.push({ date: d, year: String(d.getFullYear()), title, desc, ...opts })
  }

  // birth + record begin
  push(cat.dob, 'Born', `${cat.breed_name || 'Domestic shorthair'} · the very first entry in her record.`)
  push(cat.created_at, 'Joined the record', `Into the care of ${owner?.display_name || 'her guardian'} — home ever since.`)

  // baseline begins (first weigh-in)
  const wl = data.weight_logs || []
  if (wl.length) push(wl[0].logged_at, 'Baseline began', `First weigh-in logged · ${Number(wl[0].weight_kg)} kg. Her "normal" starts here.`)

  // vaccines
  data.vaccinations.forEach((v) =>
    push(v.administered_date, `${v.vaccine_name} vaccine`, `${[v.clinic_name, v.vet_name].filter(Boolean).join(' · ')}${v.valid_until ? ` · valid to ${new Date(v.valid_until).getFullYear()}` : ''}.`)
  )

  // vet visits
  data.vet_visits.forEach((v) =>
    push(v.visit_date, v.reason || 'Vet visit', `${[v.vet_name, v.clinic_name].filter(Boolean).join(' · ')}${v.diagnosis_given ? ` · ${v.diagnosis_given}` : ''}.`, {
      flag: !!v.diagnosis_given && !/healthy|stable|normal/i.test(v.diagnosis_given),
    })
  )

  // meds started
  data.medications.forEach((m) =>
    push(m.start_date, `Started ${m.medication_name}`, `${[m.condition_being_treated, m.frequency].filter(Boolean).join(' · ')}.`)
  )

  // baseline deviation (real, computed) — flagged like the mockup's "caught gently"
  if (wl.length > 1) {
    const ws = wl.map((w) => Number(w.weight_kg))
    const base = mean(ws)
    const cur = ws[ws.length - 1]
    const dPct = base ? ((cur - base) / base) * 100 : 0
    if (Math.abs(dPct) >= 3) {
      push(wl[wl.length - 1].logged_at, `Weight ${dPct > 0 ? 'crept up' : 'eased'} ~${Math.abs(dPct).toFixed(0)}%`, 'Caught gently against her own baseline — months before it would show on a chart.', { flag: true })
    }
  }

  // present-day anchor
  if (wl.length) push(wl[wl.length - 1].logged_at, 'Settled', `Weight steady · ${Number(wl[wl.length - 1].weight_kg)} kg. She is herself.`, { cur: true })

  evs.sort((a, b) => a.date.getTime() - b.date.getTime())
  // de-dupe the present-day pair (deviation + settled share a date) keeps both — fine

  return (
    <div className="px-6 pt-12 pb-10">
      <div className="font-mono text-[9px] tracking-[0.3em] uppercase flex items-center gap-2.5" style={{ color: NAVY }}>
        Chapter VI · Chronicle
        <span className="flex-1 h-px" style={{ background: 'rgba(150,118,46,.28)' }} />
      </div>
      <h1 className="font-serif text-[34px] leading-[1.06] mt-3 text-sepia">
        Her whole life,<br />on one <em style={{ fontStyle: 'italic', color: GREEN }}>axis</em>.
      </h1>
      <p className="mt-3 text-[13px] leading-relaxed text-sepia-soft max-w-[34ch] font-light">
        Food, weigh-ins, vaccines, visits, medications — every dated record on a single thread. Whatever comes next,
        her history travels with her.
      </p>

      <div className="mt-7 relative">
        {evs.map((e, i) => {
          const last = i === evs.length - 1
          return (
            <div key={i} className="relative pl-[46px] pb-6">
              {/* connector */}
              {!last && <span className="absolute left-[24px] top-[6px] bottom-[-8px] w-px" style={{ background: 'rgba(23,58,116,.22)' }} />}
              {/* year */}
              <span className="absolute left-0 top-[-2px] w-10 font-serif italic text-[15px]" style={{ color: GOLD }}>{e.year}</span>
              {/* node */}
              <span
                className="absolute left-[19px] top-[5px] w-[13px] h-[13px] rounded-full"
                style={
                  e.cur
                    ? { background: GREEN, border: `2px solid ${GREEN}`, boxShadow: '0 0 0 4px rgba(75,95,66,.16)' }
                    : { background: 'rgb(var(--parchment))', border: '2px solid #BC983E', boxShadow: '0 0 0 3px rgba(188,152,62,.12)' }
                }
              />
              <div className="text-[14.5px] font-semibold" style={{ color: e.flag ? TERRA : 'rgb(var(--sepia))' }}>{e.title}</div>
              <div className="text-[12px] mt-1 leading-relaxed text-sepia-soft">{e.desc}</div>
              <div className="font-mono text-[9px] mt-1.5 text-sepia-faint">
                {e.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2 font-mono text-[9px] tracking-wide flex items-center gap-1.5" style={{ color: GREEN }}>
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: GREEN }} />
        {evs.length} entries on her record{offline ? ' · offline copy' : ' · live'}
      </div>

      {/* ===== Reports & documents (R2) ===== */}
      <div className="mt-9 font-mono text-[9px] tracking-[0.22em] uppercase flex items-center gap-2.5" style={{ color: NAVY }}>
        Reports &amp; documents
        <span className="flex-1 h-px bg-sepia/10" />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          setUploading(true)
          try {
            await api.uploadReport(cat.id, f, 'bloodwork')
            reload()
          } catch {
            alert('Upload failed — is the backend running?')
          } finally {
            setUploading(false)
            if (fileRef.current) fileRef.current.value = ''
          }
        }}
      />

      <div className="mt-3 space-y-2.5">
        {(data.reports || []).map((r) => (
          <a
            key={r.id}
            href={api.reportFileUrl(r.id)}
            target="_blank"
            rel="noreferrer"
            className="page parchment-50 p-3.5 flex items-center gap-3 active:scale-[0.99] transition"
          >
            <span className="w-10 h-10 rounded-[10px] grid place-items-center flex-none" style={{ background: 'rgba(23,58,116,.08)', color: NAVY }}>
              <DocIcon />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-sepia truncate">{r.filename || 'Report'}</p>
              <p className="font-mono text-[9px] uppercase tracking-wide text-sepia-faint mt-0.5">{r.kind} · {fmtDate(r.uploaded_at)}</p>
            </div>
            <span className="text-sepia-faint">↗</span>
          </a>
        ))}

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || offline}
          className="w-full rounded-[14px] py-4 flex items-center justify-center gap-2.5 text-[13px] font-semibold disabled:opacity-50 active:scale-[0.99] transition"
          style={{ border: '1px dashed rgba(23,58,116,.4)', color: NAVY, background: 'rgba(23,58,116,.03)' }}
        >
          {uploading ? 'Uploading…' : (data.reports?.length ? '+ Add another report' : '+ Upload bloodwork or a document')}
        </button>
        {offline && <p className="text-center font-mono text-[9px] text-sepia-faint">uploads need the live backend</p>}
      </div>

      <p className="mt-8 text-center">
        <span className="font-serif italic text-[13px] text-sepia-faint">one continuous record — birth to legacy</span>
      </p>
    </div>
  )
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  )
}
