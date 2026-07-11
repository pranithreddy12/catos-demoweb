import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { usePassport, fmtDate } from '../lib/passport'
import { api, MedicationRef, ReportAnalysis, Passport } from '../api'
import { Loading, ErrorCard } from './Passport'

const PERI = '#6B6BD6'
const INK = '#1A1B2E'
const MUTED = '#757896'
const GREEN = '#4B5F42'
const TERRA = '#B8693A'
const IVORY = '#FAF7F1'

type Report = NonNullable<Passport['reports']>[number]

export default function Care() {
  const { data, loading, error, offline, reload } = usePassport()
  const nav = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [medOpen, setMedOpen] = useState(false)

  if (loading) return <Loading />
  if (error || !data) return <ErrorCard msg={error} />
  const { cat } = data
  const lastVisit = (data.vet_visits || []).map((v) => v.visit_date).sort().slice(-1)[0]

  return (
    <div className="min-h-full px-5 pt-14 pb-10" style={{ background: IVORY }}>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>Records &amp; Care</p>
      <h1 className="font-serif text-[30px] leading-tight mt-1" style={{ color: INK }}>Care</h1>

      {/* dark hero — what changed since last visit */}
      <div className="mt-5 rounded-[22px] p-5 relative overflow-hidden" style={{ background: 'linear-gradient(155deg,#23243f,#16172a)' }}>
        <div className="absolute -right-6 -bottom-8 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle,rgba(107,107,214,.45),transparent 70%)' }} />
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] flex items-center gap-1.5" style={{ color: '#A6A8E0' }}>
          <span>☾</span> Before your next visit
        </p>
        <h2 className="font-serif text-[23px] leading-snug mt-2 text-white">What changed since<br />{cat.name}'s last visit?</h2>
        <p className="text-[12.5px] leading-relaxed mt-2" style={{ color: 'rgba(255,255,255,.7)' }}>
          One tap. The whole story{lastVisit ? ` since ${new Date(lastVisit).toLocaleDateString('en-US', { month: 'long' })}` : ''} — ready to hand your vet.
        </p>
        <button onClick={() => nav('/vet-summary')} className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-[14px] active:scale-[0.99] transition" style={{ background: '#FDFBF6', color: INK }}>
          Prepare summary <span>›</span>
        </button>
      </div>

      {/* bloodwork & labs */}
      <SectionTitle>Bloodwork &amp; labs</SectionTitle>
      {data.lab_nudge && data.lab_nudge.count > 0 && (
        <button onClick={() => nav('/vet-summary')} className="w-full text-left rounded-[14px] px-4 py-3 mb-2.5 flex items-start gap-2.5 active:scale-[0.99] transition" style={{ background: 'rgba(184,105,58,.08)', border: '1px solid rgba(184,105,58,.2)' }}>
          <span style={{ color: TERRA }}>⚑</span>
          <span className="text-[12px] leading-relaxed" style={{ color: '#8A5A2A' }}>{data.lab_nudge.message} <span className="font-semibold" style={{ color: PERI }}>See vet summary ›</span></span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return
        setUploading(true)
        try { await api.uploadReport(cat.id, f, 'bloodwork'); reload() } catch { alert('Upload failed — is the backend running?') } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
      }} />
      <div className="space-y-2.5">
        {(data.reports || []).length === 0 && (
          <div className="rounded-[18px] p-4 text-[13px] leading-relaxed" style={{ background: '#fff', border: '1px solid rgba(26,27,46,.06)', color: MUTED }}>
            No labs on file yet. Add bloodwork and we'll keep it safely on {cat.name}'s record — ready to open and show your vet.
          </div>
        )}
        {(data.reports || []).map((r) => (
          <ReportCard key={r.id} report={r} catId={cat.id} />
        ))}
        <button onClick={() => fileRef.current?.click()} disabled={uploading || offline} className="w-full rounded-[18px] py-4 flex items-center justify-center gap-2.5 text-[13px] font-semibold disabled:opacity-50 active:scale-[0.99] transition" style={{ border: '1.5px dashed rgba(107,107,214,.4)', color: PERI, background: 'rgba(107,107,214,.04)' }}>
          {uploading ? 'Uploading…' : (data.reports?.length ? '+ Add another report' : '+ Upload bloodwork or a document')}
        </button>
        {offline && <p className="text-center font-mono text-[9px]" style={{ color: MUTED }}>uploads need the live backend</p>}
      </div>

      {/* medications */}
      <SectionTitle>Medications</SectionTitle>
      <div className="rounded-[18px] overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(26,27,46,.06)' }}>
        {data.medications.length === 0 ? (
          <p className="p-4 text-[13px]" style={{ color: MUTED }}>None on record.</p>
        ) : (
          data.medications.map((m, i) => (
            <div key={i} className="flex items-center justify-between p-4" style={{ borderTop: i ? '1px solid rgba(26,27,46,.06)' : 'none' }}>
              <div>
                <p className="text-[14.5px] font-semibold" style={{ color: INK }}>{m.medication_name}</p>
                <p className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>{[m.condition_being_treated, m.frequency, m.route].filter(Boolean).join(' · ')}</p>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wide" style={{ color: m.active ? GREEN : MUTED }}>{m.active ? 'active' : 'ended'}</span>
            </div>
          ))
        )}
      </div>
      <button onClick={() => setMedOpen(true)} disabled={offline} className="mt-2.5 w-full rounded-[18px] py-3.5 flex items-center justify-center gap-2 text-[13px] font-semibold disabled:opacity-50 active:scale-[0.99] transition" style={{ border: '1.5px dashed rgba(107,107,214,.4)', color: PERI, background: 'rgba(107,107,214,.04)' }}>
        + Add a medication
      </button>

      <p className="mt-8 text-center text-[10px] tracking-wide" style={{ color: '#9498B0' }}>Educational only — always consult your vet.</p>

      {medOpen && <MedicationSheet catId={cat.id} catName={cat.name} onClose={() => setMedOpen(false)} onSaved={() => { setMedOpen(false); reload() }} />}
    </div>
  )
}

function MedicationSheet({ catId, catName, onClose, onSaved }: { catId: string; catName: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [treats, setTreats] = useState('')
  const [dose, setDose] = useState('')
  const [unit, setUnit] = useState('')
  const [freq, setFreq] = useState('')
  const [route, setRoute] = useState('')
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [refs, setRefs] = useState<MedicationRef[]>([])

  // Common feline meds reference -> type-ahead. Selecting one fills what-it-treats + route.
  useEffect(() => { api.medicationRefs().then(setRefs).catch(() => setRefs([])) }, [])

  const q = name.trim().toLowerCase()
  const exact = refs.find((r) => r.name.toLowerCase() === q)
  const matches = q && !exact
    ? refs.filter((r) => r.name.toLowerCase().includes(q) || r.treats.toLowerCase().includes(q) || (r.aliases || []).some((a) => a.toLowerCase().includes(q)))
    : []
  const pick = (r: MedicationRef) => { setName(r.name); setTreats(r.treats); if (!route) setRoute(r.typical_route) }
  const FREQS = ['Once daily', 'Twice daily', 'Every other day', 'Weekly', 'Monthly', 'As needed']

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await api.addMedication(catId, {
        medication_name: name.trim(),
        condition_being_treated: treats.trim() || undefined,
        dose_amount: dose ? Number(dose) : null,
        dose_unit: unit.trim() || undefined,
        frequency: freq.trim() || undefined,
        route: route.trim() || undefined,
        start_date: start,
      })
      onSaved()
    } catch { alert('Could not save — is the backend running?') } finally { setSaving(false) }
  }

  const inputCls = 'w-full rounded-[12px] px-4 py-3 outline-none text-[15px]'
  const inputStyle = { background: '#fff', border: '1px solid rgba(27,27,58,.12)', color: INK } as const
  const Label = ({ t }: { t: string }) => <div className="mt-4 font-mono text-[9.5px] tracking-[0.16em] uppercase" style={{ color: MUTED }}>{t}</div>

  return createPortal(
    <div className="absolute inset-0 z-[72] overflow-y-auto no-scrollbar" style={{ background: IVORY }}>
      <div style={{ padding: '52px 22px 40px' }}>
        <div className="flex items-center gap-3 pb-1">
          <button onClick={onClose} className="w-9 h-9 rounded-full grid place-items-center flex-none" style={{ background: 'rgba(27,27,58,.06)', color: INK }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <h2 className="font-serif text-[24px]" style={{ color: INK }}>Add a medication</h2>
        </div>
        <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}>Record something your vet has already started for {catName}. Start typing the name.</p>

        <Label t="Medication" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Selamectin, Metacam…" className={`${inputCls} mt-1.5`} style={inputStyle} />
        {matches.length > 0 && (
          <div className="mt-1.5 rounded-[12px] overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(27,27,58,.1)' }}>
            {matches.slice(0, 6).map((r, i) => (
              <button key={r.name} onMouseDown={(e) => { e.preventDefault(); pick(r) }} className="w-full text-left px-4 py-2.5" style={{ borderTop: i ? '1px solid rgba(27,27,58,.06)' : 'none' }}>
                <div className="text-[14px] font-semibold" style={{ color: INK }}>{r.name}</div>
                <div className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>{r.treats} · {r.typical_route}</div>
              </button>
            ))}
          </div>
        )}

        <Label t="What it treats" />
        <input value={treats} onChange={(e) => setTreats(e.target.value)} placeholder="e.g. Flea and worm prevention" className={`${inputCls} mt-1.5`} style={inputStyle} />

        <div className="flex gap-2.5">
          <div className="flex-1"><Label t="Dose" /><input value={dose} onChange={(e) => setDose(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" placeholder="2.5" className={`${inputCls} mt-1.5`} style={inputStyle} /></div>
          <div className="flex-1"><Label t="Unit" /><input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="mg / ml / tablet" className={`${inputCls} mt-1.5`} style={inputStyle} /></div>
        </div>

        <Label t="How often" />
        <div className="mt-1.5 flex flex-wrap gap-2">
          {FREQS.map((f) => (
            <button key={f} onClick={() => setFreq(f)} className="px-3.5 py-2 rounded-full text-[13px] font-medium" style={freq === f ? { background: GREEN, color: '#fff' } : { background: '#fff', color: INK, border: '1px solid rgba(27,27,58,.12)' }}>{f}</button>
          ))}
        </div>

        <div className="flex gap-2.5">
          <div className="flex-1"><Label t="Route" /><input value={route} onChange={(e) => setRoute(e.target.value)} placeholder="oral / topical / injection" className={`${inputCls} mt-1.5`} style={inputStyle} /></div>
          <div className="flex-1"><Label t="Started" /><input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={`${inputCls} mt-1.5`} style={inputStyle} /></div>
        </div>

        <button onClick={save} disabled={saving || !name.trim()} className="mt-6 w-full rounded-full py-4 font-semibold text-[15px] text-white disabled:opacity-50 active:scale-[0.99] transition" style={{ background: GREEN }}>
          {saving ? 'Saving…' : `Save to ${catName}'s record`}
        </button>
        <p className="mt-3 text-center text-[10.5px] leading-relaxed" style={{ color: '#9498B0' }}>Recording only — this doesn't prescribe or change a dose. Always follow your vet.</p>
      </div>
    </div>,
    document.getElementById('lc-phone') || document.body,
  )
}

function ReportCard({ report, catId }: { report: Report; catId: string }) {
  const seeded: ReportAnalysis | null = report.analysis_status && report.analysis_status !== 'pending'
    ? { status: report.analysis_status, summary: report.analysis_summary, values: report.analysis_values || [], method: report.analysis_method }
    : null
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(seeded)
  const [busy, setBusy] = useState(false)

  const analyze = async () => {
    setBusy(true)
    try { setAnalysis(await api.analyzeReport(catId, report.id)) }
    catch { setAnalysis({ status: 'error', summary: 'Could not analyse right now — please try again in a moment.' }) }
    finally { setBusy(false) }
  }

  return (
    <div className="rounded-[18px] overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(26,27,46,.06)' }}>
      <button onClick={() => api.openReport(report.id, report.filename).catch(() => alert('Could not open the file.'))} className="w-full text-left p-4 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl grid place-items-center flex-none" style={{ background: 'rgba(107,107,214,.1)', color: PERI }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[14.5px] font-semibold truncate" style={{ color: INK }}>{report.filename || 'Report'}</p>
          <p className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>{report.kind} · {fmtDate(report.uploaded_at)} · tap to view</p>
        </div>
        <span style={{ color: MUTED }}>↗</span>
      </button>

      <div className="px-4 pb-4">
        {!analysis && (
          <button onClick={analyze} disabled={busy} className="w-full rounded-[12px] py-2.5 text-[12.5px] font-semibold disabled:opacity-60 active:scale-[0.99] transition" style={{ background: 'rgba(107,107,214,.08)', color: PERI }}>
            {busy ? 'Reading the document…' : '✨ Read it in plain language'}
          </button>
        )}
        {analysis?.status === 'done' && (
          <div className="rounded-[12px] p-3" style={{ background: '#F7F6FC', border: '1px solid rgba(107,107,214,.14)' }}>
            <p className="font-mono text-[8.5px] tracking-[0.16em] uppercase mb-1.5" style={{ color: PERI }}>In plain language{analysis.method === 'ocr' ? ' · scanned' : ''}</p>
            {analysis.summary && <p className="text-[12.5px] leading-relaxed" style={{ color: INK }}>{analysis.summary}</p>}
            {analysis.values && analysis.values.length > 0 && (
              <div className="mt-2.5 flex flex-col gap-1">
                {analysis.values.map((v, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-[11.5px]">
                    <span className="min-w-0 truncate" style={{ color: MUTED }}>{v.name}</span>
                    <span className="flex-none" style={{ color: v.flag ? TERRA : INK, fontWeight: v.flag ? 600 : 400 }}>{[v.result, v.unit].filter(Boolean).join(' ')}{v.flag ? ` (${v.flag.toUpperCase()})` : ''}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10.5px] mt-2.5 leading-relaxed" style={{ color: MUTED }}>{analysis.note || 'A plain-language read of the document — your vet interprets the results.'}</p>
          </div>
        )}
        {analysis && analysis.status !== 'done' && (
          <p className="text-[11.5px] leading-relaxed px-1" style={{ color: MUTED }}>{analysis.summary || 'Nothing to summarise.'}{analysis.status === 'error' ? ' ' : ''}
            {analysis.status !== 'done' && <button onClick={analyze} disabled={busy} className="ml-1 font-semibold" style={{ color: PERI }}>{busy ? 'Retrying…' : 'Retry'}</button>}
          </p>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-7 mb-3 font-mono text-[9px] tracking-[0.22em] uppercase flex items-center gap-2.5" style={{ color: MUTED }}>
      {children}<span className="flex-1 h-px" style={{ background: 'rgba(26,27,46,.08)' }} />
    </div>
  )
}
