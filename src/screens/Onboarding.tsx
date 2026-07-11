import { useEffect, useMemo, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, Breed, BreedRisk, FoodProduct } from '../api'
import { usePassport } from '../lib/passport'

// Palette tuned to the design: cream parchment surface, ink-navy primary button,
// periwinkle/indigo accent for progress + selected states + the final CTA.
const INK = '#1A1B2E'
const INDIGO = '#6B62D6'
const GREEN = '#4B5F42'
const TERRA = '#B8693A'

const TOTAL_STEPS = 5

export default function Onboarding() {
  const nav = useNavigate()
  const { setActiveCat } = usePassport()

  const [step, setStep] = useState(0) // 0 = welcome, 1..5 = flow

  // identity
  const [name, setName] = useState('')
  const [breed, setBreed] = useState<Breed | null>(null)
  const [bornYear, setBornYear] = useState('')
  const [origin, setOrigin] = useState<'rescue' | 'breeder' | 'other'>('rescue')
  const [photo, setPhoto] = useState('')

  // baseline
  const [water, setWater] = useState(1) // 0 less, 1 normal, 2 more
  const [appetite, setAppetite] = useState(1) // 0 picky,1 most,2 big
  const [weight, setWeight] = useState('4.2')

  // conditions
  const [conditions, setConditions] = useState<Set<string>>(new Set())

  const [catId, setCatId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const firstName = name.trim() || 'her'

  // Create the record once identity is entered, so later steps can persist.
  const createRecord = async () => {
    if (catId) { setStep(2); return }
    setBusy(true)
    try {
      const { cat_id } = await api.createCat({
        name: name.trim(),
        breed_id: breed?.id,
        breed_name: breed?.name,
        dob: bornYear ? `${bornYear}-01-01` : undefined,
        photo_url: photo || undefined,
      })
      setCatId(cat_id)
      setActiveCat(cat_id)
      setStep(2)
    } catch {
      alert('Could not start the record — is the backend running?')
    } finally {
      setBusy(false)
    }
  }

  // Baseline -> seed a first weigh-in + check-in (best effort).
  const saveBaseline = async () => {
    if (!catId) { setStep(5); return }
    setBusy(true)
    try {
      const w = Number(weight)
      if (w > 0) await api.logWeight(catId, w)
      await api.checkin(catId, {
        water: ['less', 'normal', 'more'][water],
        ate_pct: [25, 75, 100][appetite],
      })
    } catch { /* baseline is best-effort */ } finally {
      setBusy(false); setStep(5)
    }
  }

  // Conditions -> home risk audit, then into the app.
  const finish = async () => {
    setBusy(true)
    try {
      if (catId) {
        const known = [...conditions].filter((c) => c !== 'none')
        await api.onboardingAudit(catId, { known_conditions: known, indoor_only: true })
      }
    } catch { /* audit is best-effort */ } finally {
      setBusy(false); nav('/')
    }
  }

  if (step === 0)
    return <Welcome onNext={() => setStep(1)} />

  return (
    <div className="min-h-full parchment px-6 pt-14 pb-10">
      <Progress step={step} />

      {step === 1 && (
        <Pane eyebrow="Let's start the record" title={<>Who are we<br />looking <em style={{ fontStyle: 'italic', color: INDIGO }}>after?</em></>}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-[72px] h-[72px] rounded-full grid place-items-center shrink-0"
              style={{ background: 'linear-gradient(150deg,#D98A4E,#B8693A)', boxShadow: '0 8px 22px -10px rgba(184,105,58,.7)' }}>
              {photo
                ? <img src={photo} alt="" className="w-full h-full rounded-full object-cover" />
                : <svg width="34" height="34" viewBox="0 0 24 24" fill="#fff"><path d="M4 9l2-5 3 3h6l3-3 2 5v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9z" opacity=".25" /><circle cx="9" cy="12" r="1.2" fill="#fff" /><circle cx="15" cy="12" r="1.2" fill="#fff" /></svg>}
            </div>
            <button onClick={() => { const u = window.prompt('Photo URL'); if (u) setPhoto(u) }}
              className="rounded-[12px] px-4 py-2.5 text-[13px] font-medium border border-dashed"
              style={{ borderColor: 'rgba(107,98,214,.5)', color: INDIGO }}>
              {photo ? 'Change photo' : 'Add a photo'}
            </button>
          </div>

          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Luna" className={inputCls} autoFocus />
          </Field>

          <div className="grid grid-cols-[1.6fr_1fr] gap-3">
            <BreedField breed={breed} setBreed={setBreed} />
            <Field label="Born">
              <input value={bornYear} onChange={(e) => setBornYear(e.target.value.replace(/[^\d]/g, '').slice(0, 4))} inputMode="numeric" placeholder="2013" className={inputCls} />
            </Field>
          </div>

          <Field label={`How ${firstName} came home`}>
            <Segmented options={[['rescue', 'Rescue'], ['breeder', 'Breeder'], ['other', 'Other']]} value={origin} onChange={(v) => setOrigin(v as typeof origin)} />
          </Field>

          <p className="text-[12.5px] text-center leading-relaxed mt-5 mb-1" style={{ color: 'rgb(var(--sepia-faint))' }}>
            Microchip, registry and adoption papers come next — all folded into one identity record.
          </p>
          <PrimaryBtn label="Continue" disabled={!name.trim() || busy} busy={busy} onClick={createRecord} />
        </Pane>
      )}

      {step === 2 && (
        <ContextStep name={firstName} breed={breed} bornYear={bornYear} onNext={() => setStep(3)} />
      )}

      {step === 3 && (
        <FoodScanStep name={firstName} onNext={() => setStep(4)} />
      )}

      {step === 4 && (
        <Pane eyebrow={`What's normal for ${firstName}?`} title={<>Every change we notice<br />is measured <em style={{ fontStyle: 'italic', color: INDIGO }}>against her.</em></>}>
          <p className="text-[13px] leading-relaxed -mt-1 mb-5" style={{ color: 'rgb(var(--sepia-soft))' }}>
            A rough picture today. It sharpens over the first two weeks — no need to be exact.
          </p>
          <Slider icon="water" label="Water" value={water} onChange={setWater} labels={['Drinks little', 'A normal drinker', 'Drinks a lot']} />
          <Slider icon="bowl" label="Appetite" value={appetite} onChange={setAppetite} labels={['Picky eater', 'Eats most meals', 'Big appetite']} />
          <div className="page parchment-50 px-4 py-3.5 flex items-center justify-between">
            <span className="flex items-center gap-2.5 text-[14px] font-semibold text-sepia"><Ico name="weight" /> Weight</span>
            <span className="flex items-baseline gap-1">
              <input value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" className="w-[58px] bg-transparent text-right text-[22px] font-serif text-sepia outline-none" />
              <span className="text-[12px] text-sepia-faint">kg</span>
            </span>
          </div>
          <PrimaryBtn label="Continue" busy={busy} onClick={saveBaseline} />
        </Pane>
      )}

      {step === 5 && (
        <Pane eyebrow="One last thing" title={<>Is {firstName} managing<br /><em style={{ fontStyle: 'italic', color: INDIGO }}>anything already?</em></>}>
          <p className="text-[13px] leading-relaxed -mt-1 mb-5" style={{ color: 'rgb(var(--sepia-soft))' }}>
            If a vet has mentioned something, tell us once. We'll keep it quietly in mind.
          </p>
          {[
            ['kidney', 'Early kidney changes', ''],
            ['thyroid', 'Thyroid', ''],
            ['urinary', 'Urinary / crystals', ''],
            ['none', 'Nothing yet', ''],
          ].map(([id, label, sub]) => (
            <ConditionRow key={id} id={id} label={label} sub={sub}
              checked={conditions.has(id)}
              onToggle={() => setConditions((prev) => {
                const next = new Set(prev)
                if (id === 'none') return next.has('none') ? new Set<string>() : new Set(['none'])
                next.delete('none')
                next.has(id) ? next.delete(id) : next.add(id)
                return next
              })} />
          ))}
          <div className="rounded-[14px] px-4 py-3.5 mt-2 text-[12.5px] leading-relaxed flex gap-2.5"
            style={{ background: 'rgba(107,98,214,.08)', color: 'rgb(var(--sepia-soft))' }}>
            <span style={{ color: INDIGO }}>☾</span>
            <span>{(() => {
              const focus: string[] = []
              if (conditions.has('kidney')) focus.push('her drinking and weight')
              if (conditions.has('thyroid')) focus.push('her weight and appetite')
              if (conditions.has('urinary')) focus.push('her litter habits')
              if (focus.length === 0) return `Nothing flagged yet — we'll quietly learn ${firstName}'s normal and only speak up if something shifts.`
              const list = focus.length === 1 ? focus[0] : `${focus.slice(0, -1).join(', ')} and ${focus[focus.length - 1]}`
              return `Because ${firstName}'s managing that, we'll keep an eye on ${list} — and never raise our voice about it.`
            })()}</span>
          </div>
          <PrimaryBtn label={`Enter LunaCat`} busy={busy} onClick={finish} accent={INDIGO} />
        </Pane>
      )}
    </div>
  )
}

/* ---------- step 2: context ---------- */

// Map a breed-predisposition condition code to an icon + owner-friendly title.
function condMeta(cond: string): { icon: string; title: string } {
  const c = (cond || '').toUpperCase()
  if (/CKD|KIDNEY|RENAL|PKD|NEPHR/.test(c)) return { icon: 'kidney', title: 'Kidney changes' }
  if (/THYROID/.test(c)) return { icon: 'thyroid', title: 'Thyroid shifts' }
  if (/DENTAL|PERIODONT|TOOTH|GINGIV/.test(c)) return { icon: 'dental', title: 'Dental comfort' }
  if (/DIABET/.test(c)) return { icon: 'weight', title: 'Blood sugar & weight' }
  if (/HCM|CARDIO|HEART|MYOPATH/.test(c)) return { icon: 'water', title: 'Heart health' }
  if (/FLUTD|URIN|CYSTITIS|BLADDER|STRUVITE|OXALATE/.test(c)) return { icon: 'hydration', title: 'Urinary health' }
  if (/OBES|WEIGHT/.test(c)) return { icon: 'weight', title: 'Weight & growth' }
  if (/HYDRAT/.test(c)) return { icon: 'hydration', title: 'Hydration' }
  // Fallback: title-case the raw condition (e.g. PROGRESSIVE_RETINAL_ATROPHY).
  const pretty = c.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (m) => m.toUpperCase())
  return { icon: 'water', title: pretty || 'Worth watching' }
}

function ContextStep({ name, breed, bornYear, onNext }: { name: string; breed: Breed | null; bornYear: string; onNext: () => void }) {
  const age = bornYear ? new Date().getFullYear() - Number(bornYear) : null
  const senior = age != null && age >= 8

  // Real breed intelligence: her breed's documented predispositions (HIGH/MODERATE),
  // pulled from lunacat_research.breed_predispositions — not an age-only guess.
  const [risks, setRisks] = useState<BreedRisk[] | null>(null)
  useEffect(() => {
    let ok = true
    if (!breed?.id) { setRisks(null); return }
    api.breedRisks(breed.id).then((r) => { if (ok) setRisks(r.risks || []) }).catch(() => { if (ok) setRisks(null) })
    return () => { ok = false }
  }, [breed?.id])

  const rank = (lvl?: string) => (/HIGH/i.test(lvl || '') ? 0 : /MOD/i.test(lvl || '') ? 1 : 2)
  const breedCards: [string, string, string][] = (risks || [])
    .filter((r) => rank(r.risk_level) <= 1) // HIGH + MODERATE only; LOW is noise here
    .sort((a, b) => rank(a.risk_level) - rank(b.risk_level) || (b.risk_multiplier || 0) - (a.risk_multiplier || 0))
    .slice(0, 3)
    .map((r) => {
      const m = condMeta(r.condition_name)
      return [m.icon, m.title, r.notes || `Something ${breed?.name || 'cats like her'} can be prone to — easy to keep an eye on with a steady record.`]
    })

  // Age-led signals the breed table doesn't carry (hyperthyroid/weight are
  // age-driven, not breed-driven). Used to top up to three, de-duped by title.
  const ageCards: [string, string, string][] = senior
    ? [
      ['thyroid', 'Thyroid shifts', 'Senior cats sometimes eat well yet lose weight — easy to catch with a steady record.'],
      ['dental', 'Dental comfort', `A senior staple. We'll note any change in how ${name} eats her usual food.`],
    ]
    : [
      ['weight', 'Weight & growth', `We'll track ${name}'s weight so her healthy adult normal is on record.`],
      ['hydration', 'Hydration', 'Steady water habits now make any future change easy to spot.'],
    ]

  const seen = new Set(breedCards.map((c) => c[1]))
  const cards = [...breedCards, ...ageCards.filter((c) => !seen.has(c[1]))].slice(0, 3)

  const hasBreedIntel = breedCards.length > 0
  const lead = hasBreedIntel
    ? `Drawn from ${breed?.name || 'her breed'}'s documented record${age != null ? ` and her age (${age})` : ''} — here's what's worth a gentle eye, not guesswork.`
    : senior && age != null
      ? `A ${age}-year-old ${breed?.name || 'cat'}. A few things are worth keeping an eye on as she ages — gently, over time.`
      : `We'll learn ${name}'s normal as you go. A few things we'll quietly keep in view.`

  return (
    <Pane eyebrow="Before you log anything" title={<>Here's what we already<br />understand about <em style={{ fontStyle: 'italic', color: INDIGO }}>{name}.</em></>}>
      <p className="text-[13.5px] leading-relaxed -mt-1 mb-5" style={{ color: 'rgb(var(--sepia-soft))' }}>{lead}</p>
      <div className="space-y-2.5">
        {cards.map(([icon, title, body]) => (
          <div key={icon} className="page parchment-50 p-4 flex gap-3">
            <div className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0" style={{ background: 'rgba(107,98,214,.12)' }}><Ico name={icon} /></div>
            <div>
              <div className="text-[14.5px] font-semibold text-sepia">{title}</div>
              <p className="text-[12.5px] leading-relaxed mt-0.5" style={{ color: 'rgb(var(--sepia-soft))' }}>{body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-[14px] px-4 py-3.5 mt-4 text-[12.5px] leading-relaxed" style={{ background: 'rgba(107,98,214,.08)', color: 'rgb(var(--sepia-soft))' }}>
        This isn't a diagnosis — it's context. The more {name}'s record grows, the more of this becomes about <em style={{ fontStyle: 'italic' }}>her</em>, not cats in general.
      </div>
      <PrimaryBtn label="Continue" onClick={onNext} />
    </Pane>
  )
}

/* ---------- step 3: food scan ---------- */

interface Analysis { score: number; good: string; caution: string; callout: string }

function FoodScanStep({ name, onNext }: { name: string; onNext: () => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<FoodProduct[]>([])
  const [picked, setPicked] = useState<FoodProduct | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q.trim() || picked) { setResults([]); return }
    const t = setTimeout(() => { api.foods(q, 6).then(setResults).catch(() => setResults([])) }, 250)
    return () => clearTimeout(t)
  }, [q, picked])

  const analyse = async (f: FoodProduct) => {
    setPicked(f); setResults([]); setLoading(true)
    let good = 'A named protein and balanced panel — a sensible everyday choice.'
    let caution = `We'll keep watching how ${name} does on it.`
    let score = 7
    try {
      const dmb = await api.dmb({
        protein_g_per_100g: null,
        fat_g_per_100g: f.fat_g_per_100g ?? null,
        fibre_g_per_100g: f.fibre_g_per_100g ?? null,
        moisture_pct: f.moisture_pct ?? null,
        ash_g_per_100g: null,
      })
      const moisture = f.moisture_pct ?? 0
      if (moisture >= 70) { good = 'High moisture and named protein — kind to senior kidneys.'; score += 1 }
      const phos = f.phosphorus_mg_per_100g ?? 0
      const phosDmb = dmb.dmb?.phosphorus_g_per_100g
      if (phos > 250 || (typeof phosDmb === 'number' && phosDmb > 0.4)) {
        caution = 'Phosphorus runs a little high for a cat watching her kidneys.'; score -= 1
      }
      if (f.ingredient_list) {
        const flags = await api.ingredientFlags(f.ingredient_list, [])
        const danger = flags.flags.find((x) => x.level === 'danger')
        if (danger) { caution = danger.message; score -= 3 }
      }
    } catch { /* analysis is best-effort */ }
    score = Math.max(1, Math.min(10, score))
    setAnalysis({
      score, good, caution,
      callout: score >= 8
        ? `A solid everyday choice. A lower-phosphorus option could suit ${name} even better.`
        : `Worth a closer look. We'll have the numbers ready when you next see the vet.`,
    })
    setLoading(false)
  }

  return (
    <Pane eyebrow="What's in the bowl?" title={<>We read {name}'s food<br />so you <em style={{ fontStyle: 'italic', color: INDIGO }}>don't have to.</em></>}>
      {!picked && (
        <>
          <p className="text-[13px] leading-relaxed -mt-1 mb-3" style={{ color: 'rgb(var(--sepia-soft))' }}>
            Find {name}'s current food and we'll read the label for you. Optional — you can skip and do this anytime.
          </p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search her food…" className={inputCls} autoFocus />
          {results.length > 0 && (
            <div className="mt-2 rounded-[12px] overflow-hidden border border-sepia/12 bg-parchment-50">
              {results.map((f) => (
                <button key={f.id} onClick={() => analyse(f)} className="w-full text-left px-4 py-2.5 text-[13.5px] text-sepia" style={{ borderTop: '1px solid rgba(23,58,116,.06)' }}>
                  {f.product_name}{f.brand ? <span className="text-sepia-faint"> · {f.brand}</span> : null}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {picked && (
        <div className="page parchment-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-[10px] grid place-items-center shrink-0" style={{ background: 'rgba(184,105,58,.14)' }}><Ico name="bowl" /></div>
              <div>
                <div className="text-[14.5px] font-semibold text-sepia leading-tight">{picked.product_name}</div>
                <div className="text-[11.5px] text-sepia-faint mt-0.5">{picked.texture || 'Food'} · scanned just now</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-serif text-[30px] leading-none text-sepia">{loading ? '·' : analysis?.score}<span className="text-[13px] text-sepia-faint">/10</span></div>
              <div className="font-mono text-[8px] tracking-[0.18em] uppercase text-sepia-faint mt-1">Food score</div>
            </div>
          </div>
          {analysis && (
            <>
              <div className="h-px my-3.5" style={{ background: 'rgba(23,58,116,.1)' }} />
              <div className="flex gap-2.5 text-[12.5px] leading-relaxed text-sepia"><span style={{ color: GREEN }}>✓</span><span>{analysis.good}</span></div>
              <div className="flex gap-2.5 text-[12.5px] leading-relaxed text-sepia mt-2.5"><span style={{ color: TERRA }}>⚠</span><span>{analysis.caution}</span></div>
              <div className="rounded-[11px] px-3.5 py-3 mt-3.5 text-[12.5px] italic leading-relaxed font-serif" style={{ background: 'rgba(107,98,214,.08)', color: 'rgb(var(--sepia-soft))' }}>{analysis.callout}</div>
            </>
          )}
          <button onClick={() => { setPicked(null); setAnalysis(null); setQ('') }} className="mt-3 w-full rounded-[12px] py-2.5 text-[13px] font-medium border border-sepia/15 text-sepia">Scan another</button>
        </div>
      )}

      <PrimaryBtn label={picked ? 'Continue' : 'Skip for now'} onClick={onNext} accent={picked ? INK : undefined} ghost={!picked} />
    </Pane>
  )
}

/* ---------- shared bits ---------- */

const inputCls = 'w-full bg-parchment-50 rounded-[12px] border border-sepia/15 px-4 py-3 outline-none focus:border-[#6B62D6] text-sepia text-[15px]'

function BreedField({ breed, setBreed }: { breed: Breed | null; setBreed: (b: Breed | null) => void }) {
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [q, setQ] = useState('')
  useEffect(() => { api.breeds().then(setBreeds).catch(() => setBreeds([])) }, [])
  const filtered = useMemo(() => breeds.filter((b) => b.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5), [breeds, q])
  return (
    <Field label="Breed">
      <input value={breed ? breed.name : q} onChange={(e) => { setBreed(null); setQ(e.target.value) }} placeholder="Domestic shorthair" className={inputCls} />
      {!breed && q.length > 0 && filtered.length > 0 && (
        <div className="mt-2 rounded-[12px] overflow-hidden border border-sepia/12 bg-parchment-50">
          {filtered.map((b) => (
            <button key={b.id} onClick={() => { setBreed(b); setQ('') }} className="w-full text-left px-4 py-2 text-[13.5px] text-sepia" style={{ borderTop: '1px solid rgba(23,58,116,.06)' }}>{b.name}</button>
          ))}
        </div>
      )}
    </Field>
  )
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-7">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
        <span key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i <= step ? INDIGO : 'rgba(107,98,214,.18)' }} />
      ))}
    </div>
  )
}

function Slider({ icon, label, value, onChange, labels }: { icon: string; label: string; value: number; onChange: (v: number) => void; labels: string[] }) {
  return (
    <div className="page parchment-50 px-4 py-3.5 mb-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2.5 text-[14px] font-semibold text-sepia"><Ico name={icon} /> {label}</span>
        <span className="text-[12.5px]" style={{ color: 'rgb(var(--sepia-soft))' }}>{labels[value]}</span>
      </div>
      <input type="range" min={0} max={2} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#6B62D6]" style={{ accentColor: icon === 'bowl' ? TERRA : INDIGO }} />
    </div>
  )
}

function ConditionRow({ id, label, sub, checked, onToggle }: { id: string; label: string; sub: string; checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center gap-3 rounded-[14px] px-4 py-3.5 mb-2.5 text-left transition page parchment-50"
      style={checked ? { borderColor: INDIGO, boxShadow: `inset 0 0 0 1.5px ${INDIGO}` } : undefined} data-cond={id}>
      <span className="w-[22px] h-[22px] rounded-[7px] grid place-items-center shrink-0" style={{ background: checked ? INDIGO : 'transparent', border: checked ? 'none' : '1.5px solid rgba(23,58,116,.25)' }}>
        {checked && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2"><path d="M5 12l5 5L20 6" /></svg>}
      </span>
      <span>
        <span className="text-[14.5px] font-semibold text-sepia">{label}</span>
        {sub && <span className="block text-[12px] mt-0.5" style={{ color: 'rgb(var(--sepia-faint))' }}>{sub}</span>}
      </span>
    </button>
  )
}

function PrimaryBtn({ label, onClick, disabled, busy, accent, ghost }: { label: string; onClick: () => void; disabled?: boolean; busy?: boolean; accent?: string; ghost?: boolean }) {
  if (ghost)
    return <button onClick={onClick} disabled={disabled} className="mt-6 w-full rounded-full py-4 font-semibold text-[15px] active:scale-[0.99] transition disabled:opacity-40 border border-sepia/20 text-sepia">{label}</button>
  return (
    <button onClick={onClick} disabled={disabled || busy} className="mt-6 w-full rounded-full py-4 font-semibold text-[15px] text-white active:scale-[0.99] transition disabled:opacity-40" style={{ background: accent || INK }}>
      {busy ? 'One moment…' : label}
    </button>
  )
}

function Pane({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.24em] uppercase" style={{ color: INDIGO }}>{eyebrow}</div>
      <h1 className="font-serif text-[33px] leading-[1.07] mt-3 mb-5 text-sepia">{title}</h1>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="font-mono text-[8.5px] tracking-[0.16em] uppercase text-sepia-faint mb-1.5">{label}</div>
      {children}
    </div>
  )
}

function Segmented({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} className="flex-1 rounded-[12px] py-3 text-[13.5px] font-semibold transition border"
          style={value === v ? { background: INDIGO, color: '#fff', borderColor: INDIGO } : { color: 'rgb(var(--sepia-soft))', borderColor: 'rgba(23,58,116,.15)', background: 'rgb(var(--parchment-50))' }}>
          {label}
        </button>
      ))}
    </div>
  )
}

function Ico({ name }: { name: string }) {
  const s = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: INDIGO, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const paths: Record<string, ReactNode> = {
    water: <path d="M12 3s6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 6-10 6-10z" />,
    bowl: <><path d="M3 11h18a9 9 0 0 1-18 0z" /><path d="M8 11a4 4 0 0 1 8 0" /></>,
    weight: <><rect x="4" y="7" width="16" height="13" rx="2" /><path d="M9 7a3 3 0 0 1 6 0" /></>,
    kidney: <path d="M12 3s6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 6-10 6-10z" />,
    thyroid: <><circle cx="12" cy="13" r="5" /><path d="M12 8V4" /></>,
    dental: <path d="M7 4c-2 0-3 2-3 5 0 4 1.5 11 3 11s1.5-4 3-4 1.5 4 3 4 3-7 3-11c0-3-1-5-3-5-1.5 0-2 1-3 1s-1.5-1-3-1z" />,
    hydration: <path d="M12 3s6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 6-10 6-10z" />,
  }
  return <svg {...s} style={{ stroke: name === 'bowl' ? TERRA : INDIGO }}>{paths[name] || paths.water}</svg>
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="min-h-full flex flex-col items-center text-center px-8 pt-20 pb-10"
      style={{ background: 'radial-gradient(125% 75% at 50% 22%, #3a3a86 0%, #1c1c52 46%, #0e0e28 100%)' }}>
      <div className="w-[88px] h-[88px] rounded-[22px] grid place-items-center shadow-xl" style={{ background: 'linear-gradient(160deg,#6B6BD6,#45459A)', boxShadow: '0 18px 40px -16px rgba(107,107,214,.6)' }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="#fff"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8z" /></svg>
      </div>
      <h1 className="font-serif text-[46px] leading-none mt-7" style={{ color: '#F4F3FB' }}>LunaCat</h1>
      <p className="mt-3 text-[15px]" style={{ color: '#B9BDE0' }}>A lifelong passport for your cat.</p>
      <div className="flex-1" />
      <div className="w-full rounded-[18px] p-5 text-left" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
        <p className="font-serif italic text-[20px] leading-snug" style={{ color: '#EDECF8' }}>We help you understand your cat — we are never your vet.</p>
        <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: '#9498B0' }}>No scores. No alarms. Just a calm, honest record of a life — kept for as long as you have together.</p>
      </div>
      <button onClick={onNext} className="mt-6 w-full rounded-full py-4 font-semibold text-[15px] active:scale-[0.99] transition" style={{ background: '#FDFBF6', color: '#1c1c4a' }}>Begin the passport</button>
    </div>
  )
}
