import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, Passport, VaccineRef } from '../api'
import WeightSheet from './WeightSheet'

// render overlays at the phone-frame level so they're anchored to the visible
// phone (not the scrolling content) and always cover it fully
const portal = (node: React.ReactNode) => createPortal(node, document.getElementById('lc-phone') || document.body)

const INK = '#1A1B2E'
const PERI = '#6B6BD6'
const NAVY = '#1A1B2E'
const GREEN = '#4B5F42'
const TERRA = '#B8693A'

const MOODS = [
  { id: 'settled', label: 'Settled', icon: '〜' },
  { id: 'quiet', label: 'Quiet', icon: '☾' },
  { id: 'off', label: 'A bit off', icon: '◡' },
]
const ATE = [['all', 'All', 100], ['most', 'Most', 75], ['half', 'Half', 50], ['little', 'Little', 25], ['none', 'None', 0]] as const
const WATER = [['less', 'Less'], ['normal', 'Normal'], ['more', 'More']] as const

export default function DailyCheckin({
  open,
  catId,
  catName = 'she',
  baselineKg,
  currentKg,
  lastWeightLb,
  meds = [],
  initialSub = null,
  onClose,
  onSaved,
}: {
  open: boolean
  catId: string
  catName?: string
  baselineKg?: number | null
  currentKg?: number | null
  lastWeightLb?: string
  meds?: Passport['medications']
  initialSub?: 'weight' | 'vaccine' | null
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  // Each attribute is OPTIONAL and unselected by default - tap only what you
  // actually noticed. (Preset defaults would log phantom values, e.g. a stray
  // 'ate: most' logs a 75% meal and skews the food baseline.)
  const [mood, setMood] = useState<string | null>(null)
  const [ate, setAte] = useState<string | null>(null)
  const [water, setWater] = useState<string | null>(null)
  const [litter, setLitter] = useState<string | null>(null)   // less | normal | more (qualitative)
  const [straining, setStraining] = useState(false)
  const [blood, setBlood] = useState(false)
  const [saving, setSaving] = useState(false)
  const [weightOpen, setWeightOpen] = useState(false)
  const [medOpen, setMedOpen] = useState(false)
  const [symptomOpen, setSymptomOpen] = useState(false)
  const [vaccineOpen, setVaccineOpen] = useState(false)

  // jump straight to a sub-form when opened from a glance tile
  useEffect(() => {
    if (!open) { setWeightOpen(false); setVaccineOpen(false); setMedOpen(false); setSymptomOpen(false); return }
    if (initialSub === 'weight') setWeightOpen(true)
    if (initialSub === 'vaccine') setVaccineOpen(true)
  }, [open, initialSub])

  const nothingSelected = !mood && !ate && !water && !litter && !straining && !blood

  const save = async () => {
    if (nothingSelected) return
    setSaving(true)
    try {
      // Send ONLY the attributes the owner actually tapped - each column is
      // nullable, so a check-in can carry just a mood, just water, etc.
      const body: { mood?: string; ate_pct?: number; water?: string } = {}
      if (mood) body.mood = mood
      if (ate) body.ate_pct = ATE.find((a) => a[0] === ate)?.[2] as number
      if (water) body.water = water
      if (Object.keys(body).length) await api.checkin(catId, body)
      // Log a litter observation only when something notable was noted (a real
      // change in frequency, straining, or blood) - no noise on a plain 'normal'.
      if ((litter && litter !== 'normal') || straining || blood) {
        await api.logLitter(catId, {
          event_type: 'both',
          frequency_feel: litter || undefined,
          straining: straining || undefined,
          blood_present: blood || undefined,
        })
      }
      onSaved(blood || straining ? 'Saved - if you are worried, call your vet' : 'Saved to her record')
    } catch {
      onSaved('Could not save — backend offline')
    } finally {
      setSaving(false)
    }
  }

  return portal(
    <>
      {/* scrim */}
      <div onClick={onClose} className="absolute inset-0 z-[60] transition-opacity duration-300" style={{ background: 'rgba(20,20,50,.45)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }} />

      {/* sheet */}
      <div
        className="absolute left-0 right-0 bottom-0 z-[61] rounded-t-[26px] px-6 pt-3 pb-7 max-h-[92%] overflow-y-auto no-scrollbar transition-transform duration-300"
        style={{ background: '#FDFBF6', transform: open ? 'translateY(0)' : 'translateY(110%)' }}
      >
        <div className="w-9 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(27,27,58,.18)' }} />
        <h1 className="font-serif text-[28px]" style={{ color: INK }}>How was {catName} today?</h1>
        <p className="mt-1 text-[14px]" style={{ color: '#757896' }}>Tap only what you noticed — one thing is plenty. Everything is optional.</p>

        {/* mood */}
        <SectionLabel>She seemed</SectionLabel>
        <div className="grid grid-cols-3 gap-2.5">
          {MOODS.map((m) => {
            const on = mood === m.id
            return (
              <button key={m.id} onClick={() => setMood(on ? null : m.id)} className="rounded-[16px] py-4 flex flex-col items-center gap-1.5 transition" style={on ? { background: 'rgba(107,107,214,.12)', border: `1.5px solid ${PERI}` } : { background: '#fff', border: '1px solid rgba(27,27,58,.1)' }}>
                <span className="text-[20px]" style={{ color: on ? PERI : '#6B6F90' }}>{m.icon}</span>
                <span className="text-[13.5px] font-semibold" style={{ color: INK }}>{m.label}</span>
              </button>
            )
          })}
        </div>

        {/* ate */}
        <SectionLabel>Ate</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {ATE.map(([id, label]) => {
            const on = ate === id
            return (
              <button key={id} onClick={() => setAte(on ? null : id)} className="px-4 py-2.5 rounded-full text-[14px] font-semibold transition" style={on ? { background: NAVY, color: '#fff' } : { background: '#fff', color: INK, border: '1px solid rgba(27,27,58,.12)' }}>
                {label}
              </button>
            )
          })}
        </div>

        {/* water */}
        <SectionLabel>Water</SectionLabel>
        <div className="flex gap-2.5">
          {WATER.map(([id, label]) => {
            const on = water === id
            return (
              <button key={id} onClick={() => setWater(on ? null : id)} className="flex-1 py-3 rounded-full text-[14px] font-semibold transition" style={on ? { background: PERI, color: '#fff' } : { background: '#fff', color: INK, border: '1px solid rgba(27,27,58,.12)' }}>
                {label}
              </button>
            )
          })}
        </div>

        {/* litter box — qualitative frequency + the two clinical red flags */}
        <SectionLabel>Litter box</SectionLabel>
        <div className="flex gap-2.5">
          {([['less', 'Less'], ['normal', 'Normal'], ['more', 'More']] as const).map(([id, label]) => {
            const on = litter === id
            return (
              <button key={id} onClick={() => setLitter(on ? null : id)} className="flex-1 py-3 rounded-full text-[14px] font-semibold transition" style={on ? { background: PERI, color: '#fff' } : { background: '#fff', color: INK, border: '1px solid rgba(27,27,58,.12)' }}>
                {label}
              </button>
            )
          })}
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          {([['straining', 'Straining', straining, setStraining], ['blood', 'Blood', blood, setBlood]] as const).map(([id, label, on, set]) => (
            <button key={id} onClick={() => set(!on)} className="py-3 rounded-[14px] text-[13.5px] font-semibold flex items-center justify-center gap-2 transition" style={on ? { background: 'rgba(184,105,58,.12)', border: `1.5px solid ${TERRA}`, color: TERRA } : { background: '#fff', border: '1px solid rgba(27,27,58,.1)', color: '#757896' }}>
              <span className="w-4 h-4 rounded-full grid place-items-center text-[10px]" style={{ background: on ? TERRA : 'transparent', border: on ? 'none' : '1.5px solid rgba(27,27,58,.2)', color: '#fff' }}>{on ? '✓' : ''}</span>
              {label}
            </button>
          ))}
        </div>
        {(straining || blood) && (
          <p className="mt-2 text-[11.5px] leading-snug" style={{ color: TERRA }}>
            Straining or blood can be urgent — especially in male cats. Please contact your vet promptly.
          </p>
        )}

        {/* weight tile */}
        <button onClick={() => setWeightOpen(true)} className="mt-5 w-full rounded-[16px] p-4 flex items-center gap-3 text-left" style={{ background: '#fff', border: '1px solid rgba(27,27,58,.1)' }}>
          <span className="w-10 h-10 rounded-[10px] grid place-items-center" style={{ background: 'rgba(75,95,66,.12)', color: GREEN }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 7h11l2 13H4.5l2-13zM9 7a3 3 0 0 1 6 0" /></svg>
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-bold" style={{ color: INK }}>Weight</p>
            <p className="text-[12px]" style={{ color: '#757896' }}>{lastWeightLb ? `Last logged ${lastWeightLb}` : 'Tap to log'}</p>
          </div>
          <span style={{ color: '#9498B0' }}>›</span>
        </button>

        {/* symptom / med / vaccine */}
        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          <button onClick={() => setSymptomOpen(true)} className="rounded-[16px] p-3.5 flex flex-col items-center gap-2" style={{ background: '#fff', border: '1px solid rgba(27,27,58,.1)' }}>
            <span style={{ color: TERRA }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg></span>
            <span className="text-[12.5px] font-semibold" style={{ color: INK }}>Symptom</span>
          </button>
          <button onClick={() => setMedOpen(true)} className="rounded-[16px] p-3.5 flex flex-col items-center gap-2" style={{ background: '#fff', border: '1px solid rgba(27,27,58,.1)' }}>
            <span style={{ color: PERI }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 13.5l3-3M8 16a4 4 0 0 1 0-5.7l2.3-2.3a4 4 0 0 1 5.7 5.7L13.7 16A4 4 0 0 1 8 16z" /></svg></span>
            <span className="text-[12.5px] font-semibold" style={{ color: INK }}>Medication</span>
          </button>
          <button onClick={() => setVaccineOpen(true)} className="rounded-[16px] p-3.5 flex flex-col items-center gap-2" style={{ background: '#fff', border: '1px solid rgba(27,27,58,.1)' }}>
            <span style={{ color: GREEN }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7z" /><path d="M9 12l2 2 4-4" /></svg></span>
            <span className="text-[12.5px] font-semibold" style={{ color: INK }}>Vaccine</span>
          </button>
        </div>

        <button onClick={save} disabled={saving || nothingSelected} className="mt-5 w-full rounded-full py-4 font-semibold text-[15px] text-white active:scale-[0.99] transition disabled:opacity-50" style={{ background: PERI }}>
          {saving ? 'Saving…' : nothingSelected ? 'Tap something to log' : 'Save check-in'}
        </button>
      </div>

      <WeightSheet
        open={weightOpen}
        catId={catId}
        name={catName}
        baselineKg={baselineKg}
        currentKg={currentKg}
        onClose={() => setWeightOpen(false)}
        onSaved={(m) => { setWeightOpen(false); onSaved(m) }}
      />
      <MedSheet open={medOpen} catId={catId} meds={meds} onClose={() => setMedOpen(false)} onSaved={(m) => { setMedOpen(false); onSaved(m) }} />
      <SymptomSheet open={symptomOpen} catId={catId} onClose={() => setSymptomOpen(false)} onSaved={(m) => { setSymptomOpen(false); onSaved(m) }} />
      <VaccineSheet open={vaccineOpen} catId={catId} onClose={() => setVaccineOpen(false)} onSaved={(m) => { setVaccineOpen(false); onSaved(m) }} />
    </>
  )
}

function VaccineSheet({ open, catId, onClose, onSaved }: { open: boolean; catId: string; onClose: () => void; onSaved: (m: string) => void }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [refs, setRefs] = useState<VaccineRef[]>([])
  const inputCls = 'w-full rounded-[12px] px-4 py-3 outline-none text-[15px]'
  const inputStyle = { background: '#fff', border: '1px solid rgba(27,27,58,.12)', color: INK } as const

  // Canonical feline vaccine reference (WSAVA/AAFP) from the backend — drives the
  // "recommended" (core) chips AND the type-ahead. No hardcoded vaccine list.
  useEffect(() => {
    if (!open) return
    api.vaccineRefs().then(setRefs).catch(() => setRefs([]))
  }, [open])

  const q = name.trim().toLowerCase()
  const core = refs.filter((v) => v.category === 'core')
  const nonCore = refs.filter((v) => v.category === 'non-core')
  const exactRef = refs.find((v) => v.name.toLowerCase() === q)
  const matches = q && !exactRef
    ? refs.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.full_name.toLowerCase().includes(q) ||
        (v.aliases || []).some((a) => a.toLowerCase().includes(q)))
    : []

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const r = await api.addVaccination(catId, { vaccine_name: name.trim(), administered_date: date || undefined })
      onSaved(`${name.trim()} added · ${r.total} on record`)
    } catch { onSaved('Could not save — backend offline') } finally { setSaving(false) }
  }
  const catBadge = (cat: string) => cat === 'core'
    ? { background: 'rgba(75,95,66,.14)', color: GREEN }
    : { background: 'rgba(117,120,150,.14)', color: '#565878' }

  return (
    <SubSheet open={open} title="Add a vaccine" onClose={onClose}>
      <p className="mt-1 text-[13px]" style={{ color: '#757896' }}>Keep her immunisation record up to date.</p>

      {/* Recommended (core) — data-driven, from the reference */}
      {core.length > 0 && (
        <>
          <div className="mt-4 font-mono text-[9.5px] tracking-[0.16em] uppercase" style={{ color: '#757896' }}>Recommended · core</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {core.map((v) => (
              <button key={v.name} onClick={() => setName(v.name)} title={v.protects_against}
                className="px-3.5 py-2 rounded-full text-[13px] font-medium"
                style={name === v.name ? { background: GREEN, color: '#fff' } : { background: '#fff', color: INK, border: '1px solid rgba(27,27,58,.12)' }}>{v.name}</button>
            ))}
          </div>
        </>
      )}

      {/* Non-core (lifestyle/risk-based) — shown so the full feline set is visible */}
      {nonCore.length > 0 && (
        <>
          <div className="mt-4 font-mono text-[9.5px] tracking-[0.16em] uppercase" style={{ color: '#757896' }}>Also available · non-core</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {nonCore.map((v) => (
              <button key={v.name} onClick={() => setName(v.name)} title={v.protects_against}
                className="px-3.5 py-2 rounded-full text-[13px] font-medium"
                style={name === v.name ? { background: '#565878', color: '#fff' } : { background: '#fff', color: '#565878', border: '1px solid rgba(27,27,58,.12)' }}>{v.name}</button>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 font-mono text-[9.5px] tracking-[0.16em] uppercase" style={{ color: '#757896' }}>Or type any vaccine</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Start typing — e.g. Rabies, FVRCP…" className={`${inputCls} mt-1.5`} style={inputStyle} />

      {/* Type-ahead suggestions from the reference (matches name / full name / aliases) */}
      {matches.length > 0 && (
        <div className="mt-1.5 rounded-[12px] overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(27,27,58,.1)' }}>
          {matches.slice(0, 6).map((v, i) => (
            <button key={v.name} onMouseDown={(e) => { e.preventDefault(); setName(v.name) }}
              className="w-full text-left px-4 py-2.5" style={{ borderTop: i ? '1px solid rgba(27,27,58,.06)' : 'none' }}>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold" style={{ color: INK }}>{v.name}</span>
                <span className="text-[8.5px] font-mono uppercase tracking-wide rounded-full px-2 py-0.5" style={catBadge(v.category)}>{v.category}</span>
              </div>
              <div className="text-[11.5px] mt-0.5" style={{ color: '#757896' }}>{v.protects_against}</div>
            </button>
          ))}
        </div>
      )}

      {/* Confirmation of a recognised vaccine — what it protects against */}
      {exactRef && (
        <div className="mt-2 text-[12px] leading-relaxed rounded-[10px] px-3 py-2.5" style={catBadge(exactRef.category)}>
          {exactRef.category === 'core' ? 'Core vaccine' : 'Non-core · lifestyle'} — protects against {exactRef.protects_against.charAt(0).toLowerCase() + exactRef.protects_against.slice(1)}.
        </div>
      )}

      <div className="mt-4 font-mono text-[9.5px] tracking-[0.16em] uppercase" style={{ color: '#757896' }}>Date given (optional)</div>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} mt-1.5`} style={inputStyle} />
      <button onClick={save} disabled={saving || !name.trim()} className="mt-6 w-full rounded-full py-4 font-semibold text-[15px] text-white disabled:opacity-50 active:scale-[0.99] transition" style={{ background: GREEN }}>
        {saving ? 'Saving…' : "Save to her record"}
      </button>
    </SubSheet>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[9.5px] tracking-[0.18em] uppercase mt-5 mb-2.5" style={{ color: '#757896' }}>{children}</div>
}

function SubSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-[72] overflow-y-auto no-scrollbar transition-transform duration-300" style={{ background: '#FAF7F1', transform: open ? 'translateY(0)' : 'translateY(110%)', pointerEvents: open ? 'auto' : 'none' }}>
      <div style={{ padding: '56px 22px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 18 }}>
          <button onClick={onClose} style={{ border: 0, background: '#F4EFE4', color: '#3D3F5A', width: 38, height: 38, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
        </div>
        <h2 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 30, lineHeight: 1.08, letterSpacing: '-.01em', color: INK }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

function MedSheet({ open, catId, meds, onClose, onSaved }: { open: boolean; catId: string; meds: Passport['medications']; onClose: () => void; onSaved: (m: string) => void }) {
  const [busy, setBusy] = useState('')
  const active = meds.filter((m) => m.active && m.id)
  const give = async (id: string, name: string) => {
    setBusy(id)
    try { await api.logMed(catId, id); onSaved(`${name} marked given`) } catch { onSaved('Could not save — backend offline') } finally { setBusy('') }
  }
  return (
      <SubSheet open={open} title="Medication given?" onClose={onClose}>
        <p className="mt-1 text-[13px]" style={{ color: '#757896' }}>Tap to confirm today's dose.</p>
        <div className="mt-4 space-y-2.5">
          {active.length === 0 && <p className="text-[13px] py-3" style={{ color: '#757896' }}>No active medications on record.</p>}
          {active.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-[14px] p-4" style={{ background: '#fff', border: '1px solid rgba(27,27,58,.1)' }}>
              <div>
                <p className="text-[14.5px] font-semibold" style={{ color: INK }}>{m.medication_name}</p>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: '#757896' }}>{[m.condition_being_treated, m.frequency].filter(Boolean).join(' · ')}</p>
              </div>
              <button onClick={() => give(m.id!, m.medication_name)} disabled={!!busy} className="rounded-full px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: GREEN }}>
                {busy === m.id ? '…' : 'Given'}
              </button>
            </div>
          ))}
        </div>
      </SubSheet>
  )
}

function SymptomSheet({ open, catId, onClose, onSaved }: { open: boolean; catId: string; onClose: () => void; onSaved: (m: string) => void }) {
  const [syms, setSyms] = useState<any[]>([])
  const [busy, setBusy] = useState('')
  useEffect(() => {
    if (open && syms.length === 0) api.symptoms().then((s) => setSyms(s)).catch(() => setSyms([]))
  }, [open])
  const common = syms.slice(0, 14)
  const log = async (id: string, name: string) => {
    setBusy(id)
    try { const r = await api.logSymptom(catId, id); onSaved(`Noted: ${name}${r.tier && r.tier !== 'mild' ? ` · ${r.tier}` : ''}`) } catch { onSaved('Could not save — backend offline') } finally { setBusy('') }
  }
  return (
      <SubSheet open={open} title="Noticed a symptom?" onClose={onClose}>
        <p className="mt-1 text-[13px]" style={{ color: '#757896' }}>Tap what you saw. We log it; your vet reads it.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {common.length === 0 && <p className="text-[13px] py-3" style={{ color: '#757896' }}>Loading…</p>}
          {common.map((s) => (
            <button key={s.id} onClick={() => log(s.id, s.name)} disabled={!!busy} className="px-3.5 py-2.5 rounded-full text-[13px] font-medium disabled:opacity-50" style={{ background: '#fff', color: INK, border: '1px solid rgba(176,91,54,.3)' }}>
              {busy === s.id ? '…' : s.name}
            </button>
          ))}
        </div>
        <p className="mt-5 text-center text-[11px]" style={{ color: '#757896' }}>This is a record, not advice. If you're worried, call your vet.</p>
      </SubSheet>
  )
}
