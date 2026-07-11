import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { usePassport, fmtDate } from '../lib/passport'
import { Loading, ErrorCard } from './Passport'
import NotADiagnosis from '../components/NotADiagnosis'

const NAVY = '#1A1B2E'
const GREEN = '#4B5F42'
const TERRA = '#B8693A'
const GOLD = '#8a6a24'

const METRIC_LABEL: Record<string, string> = {
  weight_kg: 'Weight', daily_food_grams: 'Food intake',
  daily_urine_count: 'Urination', daily_water_signal: 'Thirst',
}

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1)

// V3 Vet Readiness + V5 "What Changed Since Last Visit".
// A factual, share-ready record summary — never a diagnosis (Law 1 & 4).
export default function VetSummary() {
  const { data, loading, error } = usePassport()
  const nav = useNavigate()
  if (loading) return <Loading />
  if (error || !data) return <ErrorCard msg={error} />

  const { cat, owner } = data
  const wl = [...(data.weight_logs || [])].sort((a, b) => +new Date(a.logged_at) - +new Date(b.logged_at))
  const ws = wl.map((w) => Number(w.weight_kg))
  const baseW = ws.length ? mean(ws) : null
  const curW = ws.length ? ws[ws.length - 1] : cat.weight_kg
  const deltaPct = baseW && curW ? ((curW - baseW) / baseW) * 100 : 0

  // last vet visit anchors "what changed"
  const visits = [...(data.vet_visits || [])].sort((a, b) => +new Date(b.visit_date) - +new Date(a.visit_date))
  const lastVisit = visits[0]
  const since = lastVisit ? new Date(lastVisit.visit_date) : null

  const changed: { t: string; d: string; flag?: boolean }[] = []
  if (since) {
    data.vaccinations.filter((v) => new Date(v.administered_date) > since).forEach((v) => changed.push({ t: `${v.vaccine_name} vaccine given`, d: fmtDate(v.administered_date) }))
    data.medications.filter((m) => new Date(m.start_date) > since).forEach((m) => changed.push({ t: `Started ${m.medication_name}`, d: `${m.condition_being_treated || ''} · ${fmtDate(m.start_date)}` }))
    // weight since the visit
    const atVisit = wl.filter((w) => new Date(w.logged_at) <= since).pop()
    if (atVisit && curW) {
      const d = ((curW - Number(atVisit.weight_kg)) / Number(atVisit.weight_kg)) * 100
      if (Math.abs(d) >= 2) changed.push({ t: `Weight ${d > 0 ? 'up' : 'down'} ${Math.abs(d).toFixed(0)}% since the visit`, d: `${atVisit.weight_kg} → ${curW} kg`, flag: true })
    }
  }

  // smart questions, derived from the data (never prescriptive)
  const questions: string[] = []
  if (Math.abs(deltaPct) >= 3) questions.push(`Her weight is ${deltaPct > 0 ? 'up' : 'down'} ~${Math.abs(deltaPct).toFixed(0)}% vs her baseline — is that worth watching?`)
  if (data.medications.some((m) => m.active)) questions.push('Are her current medications still the right dose and frequency?')
  questions.push('Anything in her recent records you’d want me to track more closely?')

  // Vaccines: report validity from the record, don't assert it. A vaccine whose
  // valid_until is in the past is flagged rather than counted as "current".
  const today = new Date()
  const expiredVax = data.vaccinations.filter((v) => v.valid_until && new Date(v.valid_until) < today).length

  // Appetite: derived from logged % eaten (daily check-ins), not assumed. Falls
  // back to "not logged" rather than fabricating a "Stable" reading.
  const atePcts = (data.checkins || []).filter((c) => c.ate_pct != null).map((c) => c.ate_pct as number)
  const apRecent = atePcts.slice(-7)
  const apMean = apRecent.length ? mean(apRecent) : null

  // Body condition scored against the ideal 4-5/9 band — tone reflects the value,
  // not a fixed "ok". Below 4 or above 5 is flagged for the clinician.
  const bcs = wl[wl.length - 1]?.body_condition_score
  const bcsTone: 'ok' | 'warn' = bcs == null || (bcs >= 4 && bcs <= 5) ? 'ok' : 'warn'
  const bcsNote = bcs == null ? 'ideal range 4–5' : bcs < 4 ? 'below ideal (4–5)' : bcs > 5 ? 'above ideal (4–5)' : 'in ideal range (4–5)'

  return (
    // The vet summary is a shareable / printable DOCUMENT, so it always renders on
    // the light parchment theme (data-theme='atelier' scopes the CSS vars) regardless
    // of the app theme — dark-mode section titles would be unreadable here and print poorly.
    <div data-theme="atelier" className="px-6 pt-12 pb-10 printable" style={{ minHeight: '100%', background: 'rgb(var(--parchment))' }}>
      <button onClick={() => nav('/')} className="font-mono text-[11px] text-sepia-soft mb-1 no-print">‹ Today</button>

      <div className="font-mono text-[9px] tracking-[0.3em] uppercase flex items-center gap-2.5" style={{ color: NAVY }}>
        Vet-ready summary
        <span className="flex-1 h-px" style={{ background: 'rgba(150,118,46,.28)' }} />
      </div>
      <h1 className="font-serif text-[32px] leading-[1.08] mt-3 text-sepia">
        A clear picture,<br />ready to <em style={{ fontStyle: 'italic', color: GREEN }}>share</em>.
      </h1>
      <p className="mt-2.5 text-[12.5px] text-sepia-soft">
        {cat.name} · {cat.breed_name} · born {fmtDate(cat.dob)}{owner?.display_name ? ` · ${owner.display_name}` : ''}
      </p>

      <div className="mt-3 no-print"><NotADiagnosis /></div>

      {/* WHAT CHANGED SINCE LAST VISIT (V5) */}
      <SectionTitle>What changed since the last visit</SectionTitle>
      <div className="page parchment-50 mt-3 p-4">
        <div className="font-mono text-[9px] tracking-wide uppercase text-sepia-faint">
          {lastVisit ? `Since ${fmtDate(lastVisit.visit_date)} · ${lastVisit.clinic_name || 'last visit'}` : 'No prior visit on record'}
        </div>
        {changed.length === 0 ? (
          <p className="mt-2 text-[13px] text-sepia-soft">Nothing material has changed — steady since the last visit.</p>
        ) : (
          <div className="mt-2.5 space-y-2.5">
            {changed.map((c, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-none" style={{ background: c.flag ? TERRA : GREEN }} />
                <div>
                  <div className="text-[13.5px] font-medium" style={{ color: c.flag ? TERRA : 'rgb(var(--sepia))' }}>{c.t}</div>
                  <div className="font-mono text-[10px] text-sepia-faint mt-0.5">{c.d}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PATTERNS FROM LOGS (clinician-facing, preliminary) */}
      {(data.patterns && data.patterns.length > 0) && (
        <>
          <SectionTitle>Patterns flagged from logs</SectionTitle>
          <div className="page parchment-50 mt-3 p-4 space-y-3">
            {data.patterns.map((p, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-none" style={{ background: p.urgency_level === 'urgent' ? TERRA : GOLD }} />
                <div>
                  <div className="text-[13.5px] font-medium" style={{ color: p.urgency_level === 'urgent' ? TERRA : 'rgb(var(--sepia))' }}>{p.vet_label}</div>
                  <div className="font-mono text-[10px] text-sepia-faint mt-0.5">
                    {(Array.isArray(p.signals_active) ? p.signals_active : []).join(', ') || p.area}{p.clinically_validated ? '' : ' · thresholds not yet clinically validated'}
                  </div>
                </div>
              </div>
            ))}
            <p className="text-[11px] text-sepia-faint leading-relaxed pt-1">
              Algorithmic patterns from owner-logged data, surfaced for your review — not a diagnosis.
            </p>
          </div>
        </>
      )}

      {/* PROJECTED TRAJECTORY (M3 / Gap B) — clinician-facing, not a prediction */}
      {data.vet_forecast && Object.keys(data.vet_forecast).length > 0 && (
        <>
          <SectionTitle>Projected trajectory</SectionTitle>
          <div className="page parchment-50 mt-3 p-4 space-y-2.5">
            {Object.entries(data.vet_forecast).map(([metric, f], i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-none" style={{ background: f.trajectory === 'APPROACHING_THRESHOLD' ? TERRA : GOLD }} />
                <div>
                  <div className="text-[13.5px] font-medium text-sepia">
                    {METRIC_LABEL[metric] || metric}: {f.trajectory.replace(/_/g, ' ').toLowerCase()}
                  </div>
                  <div className="font-mono text-[10px] text-sepia-faint mt-0.5">
                    projected {f.projected ?? '—'} ({f.projected_deviation_pct != null ? `${f.projected_deviation_pct > 0 ? '+' : ''}${f.projected_deviation_pct}%` : '—'}) over {f.horizon_days}d
                    {f.days_to_threshold != null ? ` · ~${f.days_to_threshold}d to threshold` : ''}
                  </div>
                </div>
              </div>
            ))}
            <p className="text-[11px] text-sepia-faint leading-relaxed pt-1">
              A linear projection of the current trend if it continues — not a prediction. For your review.
            </p>
          </div>
        </>
      )}

      {/* RECENT LAB FINDINGS (from analysed uploaded reports) — facts, not a diagnosis */}
      {data.lab_findings && data.lab_findings.length > 0 && (
        <>
          <SectionTitle>Recent lab findings</SectionTitle>
          <div className="page parchment-50 mt-3 p-4 space-y-2.5">
            {data.lab_findings.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-none" style={{ background: TERRA }} />
                <div className="flex-1">
                  <div className="text-[13.5px] font-medium text-sepia">
                    {f.marker}: {f.result}{f.unit ? ` ${f.unit}` : ''} <span style={{ color: TERRA }}>({f.flag.toUpperCase()})</span>
                  </div>
                  <div className="font-mono text-[10px] text-sepia-faint mt-0.5">
                    {f.area_label}{f.reference ? ` · ref ${f.reference}` : ''}{f.date ? ` · ${f.date}` : ''}
                  </div>
                  {f.caveat && (
                    <div className="text-[10px] mt-0.5" style={{ color: GOLD }}>A single value cannot confirm or exclude a condition.</div>
                  )}
                </div>
              </div>
            ))}
            <p className="text-[11px] text-sepia-faint leading-relaxed pt-1">
              Values the laboratory flagged outside its reference range, read from {cat.name}'s uploaded reports.
              For your interpretation — LunaCat does not diagnose from lab values.
            </p>
          </div>
        </>
      )}

      {/* SNAPSHOT GRID */}
      <SectionTitle>The 30-day picture</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Stat k="Weight" v={`${curW ?? '—'} kg`} s={`baseline ${baseW ? baseW.toFixed(2) : '—'} · ${deltaPct >= 0 ? '↑' : '↓'}${Math.abs(deltaPct).toFixed(0)}%`} tone={Math.abs(deltaPct) >= 3 ? 'warn' : 'ok'} />
        <Stat k="Body condition" v={`${bcs ?? '—'}/9`} s={bcsNote} tone={bcsTone} />
        <Stat
          k="Appetite"
          v={apMean == null ? '—' : `${Math.round(apMean)}%`}
          s={apMean == null ? 'not logged' : apMean >= 90 ? 'finishing meals' : apMean >= 70 ? 'eating most meals' : 'eating reduced portions'}
          tone={apMean != null && apMean < 75 ? 'warn' : 'ok'}
        />
        <Stat
          k="Vaccines"
          v={`${data.vaccinations.length} on record`}
          s={data.vaccinations.length === 0 ? 'none recorded' : expiredVax ? `${expiredVax} past valid-until` : 'all within validity'}
          tone={expiredVax ? 'warn' : 'ok'}
        />
      </div>

      {/* MEDS */}
      <SectionTitle>Current medications</SectionTitle>
      <div className="page parchment-50 mt-3 divide-y" style={{ borderColor: 'transparent' }}>
        {data.medications.length === 0 ? (
          <p className="p-4 text-[13px] text-sepia-soft">None on record.</p>
        ) : (
          data.medications.map((m, i) => (
            <div key={i} className="p-3.5" style={{ borderTop: i ? '1px solid rgba(23,58,116,.1)' : 'none' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-medium text-sepia">{m.medication_name}</div>
                  <div className="font-mono text-[10px] text-sepia-faint mt-0.5">{[m.condition_being_treated, m.frequency, m.route].filter(Boolean).join(' · ')}</div>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wide" style={{ color: m.active ? GREEN : '#9498B0' }}>{m.active ? 'active' : 'ended'}</span>
              </div>
              {m.active && <MedSafety drug={m.medication_name} />}
            </div>
          ))
        )}
      </div>

      {/* DIET */}
      <SectionTitle>Current diet</SectionTitle>
      <div className="page parchment-50 mt-3 p-4">
        {data.feeding.length === 0 ? (
          <p className="text-[13px] text-sepia-soft">No meals logged.</p>
        ) : (
          <div className="space-y-1.5">
            {Array.from(new Set(data.feeding.map((f) => `${f.product_name || 'Meal'}${f.brand ? ` · ${f.brand}` : ''}`))).slice(0, 3).map((p, i) => (
              <div key={i} className="text-[13.5px] text-sepia">• {p}</div>
            ))}
          </div>
        )}
      </div>

      {/* QUESTIONS */}
      <SectionTitle>Questions to ask</SectionTitle>
      <div className="mt-3 space-y-2">
        {questions.map((q, i) => (
          <div key={i} className="flex items-start gap-2.5 page parchment-50 p-3.5">
            <span className="font-serif italic text-[15px] flex-none" style={{ color: GOLD }}>{i + 1}</span>
            <p className="text-[13px] text-sepia leading-relaxed">{q}</p>
          </div>
        ))}
      </div>

      {/* EXPORT */}
      <button
        onClick={() => window.print()}
        className="no-print mt-6 w-full flex items-center justify-center gap-2.5 rounded-[13px] py-4 font-semibold text-[14px] text-white active:scale-[0.99] transition"
        style={{ background: NAVY }}
      >
        <DownloadIcon /> Export summary for the vet
      </button>

      <p className="mt-4 text-center text-[11px] text-sepia-faint leading-relaxed px-2">
        This is a factual summary of {cat.name}'s record — not a diagnosis. Always consult your vet.
      </p>
    </div>
  )
}

// Per-medication FDA feline adverse-event check (openFDA Animal & Veterinary).
// Clinician-facing reference — reported events, never a safety conclusion.
function MedSafety({ drug }: { drug: string }) {
  const [d, setD] = useState<{ total_reports: number; reactions: { reaction: string; count: number }[] } | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let ok = true
    api.felineDrugSafety(drug)
      .then((r) => { if (ok) setD(r) })
      .catch(() => { if (ok) setD(null) })
      .finally(() => { if (ok) setLoading(false) })
    return () => { ok = false }
  }, [drug])
  if (loading) return <div className="font-mono text-[10px] text-sepia-faint mt-1.5">checking FDA feline reports…</div>
  if (!d || !d.total_reports) return <div className="font-mono text-[10px] text-sepia-faint mt-1.5">FDA: no feline adverse-event reports on file</div>
  const top = (d.reactions || []).slice(0, 3).map((r) => r.reaction).filter(Boolean)
  return (
    <div className="mt-1.5 rounded-md p-2" style={{ background: 'rgba(138,106,36,.08)' }}>
      <div className="font-mono text-[10px]" style={{ color: GOLD }}>FDA feline reports: {d.total_reports.toLocaleString()}</div>
      {top.length > 0 && <div className="font-mono text-[10px] text-sepia-faint mt-0.5">most-reported: {top.join(' · ')}</div>}
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mt-7 font-mono text-[9px] tracking-[0.22em] uppercase flex items-center gap-2.5" style={{ color: NAVY }}>
      {children}
      <span className="flex-1 h-px bg-sepia/10" />
    </div>
  )
}

function Stat({ k, v, s, tone }: { k: string; v: string; s: string; tone: 'ok' | 'warn' }) {
  return (
    <div className="page parchment-50 p-4">
      <div className="font-mono text-[8px] tracking-[0.14em] uppercase text-sepia-faint">{k}</div>
      <div className="font-serif text-[26px] mt-1 leading-none" style={{ color: tone === 'warn' ? TERRA : 'rgb(var(--sepia))' }}>{v}</div>
      <div className="text-[10.5px] mt-1.5 text-sepia-soft">{s}</div>
    </div>
  )
}

function DownloadIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
}
