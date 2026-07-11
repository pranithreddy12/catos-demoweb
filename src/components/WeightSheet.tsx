import { useEffect, useState } from 'react'
import { api } from '../api'

const NAVY = '#1A1B2E'
const GREEN = '#4B5F42'
const TERRA = '#B8693A'
const PERI = '#6B6BD6'
const INK = '#1A1B2E'

const KG2LB = 2.205

export default function WeightSheet({
  open,
  catId,
  name = 'she',
  baselineKg,
  currentKg,
  onClose,
  onSaved,
}: {
  open: boolean
  catId: string
  name?: string
  baselineKg?: number | null
  currentKg?: number | null
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [unit, setUnit] = useState<'kg' | 'lb'>('lb')
  const [kg, setKg] = useState(4.2)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (open) setKg(currentKg || baselineKg || 4.2)
  }, [open, currentKg, baselineKg])
  // Re-evaluate the sanity check whenever the value changes (or the sheet opens).
  useEffect(() => { setConfirming(false) }, [kg, open])

  const toDisp = (k: number) => (unit === 'lb' ? k * KG2LB : k)
  const fromDisp = (d: number) => (unit === 'lb' ? d / KG2LB : d)
  const disp = toDisp(kg)
  const step = () => (unit === 'lb' ? 0.1 / KG2LB : 0.1)

  const baseDisp = baselineKg != null ? toDisp(baselineKg) : null
  const deltaDisp = baseDisp != null ? disp - baseDisp : null
  const deltaTxt =
    deltaDisp == null || Math.abs(deltaDisp) < 0.05
      ? 'right at her baseline'
      : `${Math.abs(deltaDisp).toFixed(1)} ${unit} ${deltaDisp < 0 ? 'below' : 'above'} her baseline`
  // Tone tracks the actual deviation (>=3% of baseline = worth a glance), rather
  // than always reassuring green.
  const deltaOff = baseDisp != null && baseDisp > 0 && deltaDisp != null && Math.abs(deltaDisp) / baseDisp >= 0.03
  const deltaColor = deltaOff ? TERRA : GREEN

  // Input sanity check: a reading far from her learned baseline, or one that's
  // implausible for a cat, is confirmed before saving — a mistyped/ mis-unit'd
  // weight silently skews the baseline and can trip a false alert.
  const devPct = baselineKg && baselineKg > 0 ? Math.abs(kg - baselineKg) / baselineKg : 0
  const bigSwing = baselineKg != null && devPct >= 0.15
  const implausible = kg > 12 || kg < 1 // no domestic cat is <1 kg or >12 kg
  const needsConfirm = bigSwing || implausible
  const warnText = implausible
    ? `${disp.toFixed(1)} ${unit} is outside the normal range for a cat${unit === 'kg' && kg > 12 ? ' — if you meant pounds, tap “Pounds” above' : ''}.`
    : `That's about ${Math.round(devPct * 100)}% ${kg > (baselineKg ?? 0) ? 'above' : 'below'} ${name}'s usual ${baseDisp != null ? baseDisp.toFixed(1) + ' ' + unit : ''}.`

  const save = async () => {
    if (needsConfirm && !confirming) { setConfirming(true); return } // ask once first
    setSaving(true)
    try {
      const r = await api.logWeight(catId, +kg.toFixed(2))
      onSaved(`Weight saved · ${r.total_weigh_ins} weigh-ins on record`)
    } catch {
      onSaved('Could not save — backend offline')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="absolute inset-0 z-[70] flex flex-col px-6 pt-14 pb-8 transition-transform duration-300"
      style={{ background: '#FDFBF6', transform: open ? 'translateY(0)' : 'translateY(100%)', pointerEvents: open ? 'auto' : 'none' }}
    >
      <button onClick={onClose} className="absolute top-12 left-5 w-9 h-9 rounded-full grid place-items-center" style={{ background: 'rgba(27,27,58,.06)', color: INK }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      <div className="text-center font-mono text-[10px] tracking-[0.22em] uppercase mt-1" style={{ color: PERI }}>New weight reading</div>
      <h1 className="text-center font-serif text-[30px] leading-tight mt-3" style={{ color: INK }}>What does {name}<br />weigh today?</h1>

      {/* unit toggle */}
      <div className="mx-auto mt-6 flex gap-1 rounded-full p-1" style={{ background: 'rgba(27,27,58,.06)' }}>
        {(['kg', 'lb'] as const).map((u) => (
          <button key={u} onClick={() => setUnit(u)} className="px-6 py-2.5 rounded-full text-[14px] font-semibold transition" style={u === unit ? { background: NAVY, color: '#fff' } : { color: '#757896' }}>
            {u === 'kg' ? 'Kilograms' : 'Pounds'}
          </button>
        ))}
      </div>

      {/* stepper */}
      <div className="mt-8 flex items-center justify-center gap-6">
        <button onClick={() => setKg((k) => Math.max(0.1, +(k - step()).toFixed(3)))} className="w-14 h-14 rounded-full grid place-items-center" style={{ background: '#fff', border: '1px solid rgba(27,27,58,.1)', color: INK }}>
          <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
        </button>
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-[64px] leading-none" style={{ color: INK }}>{disp.toFixed(1)}</span>
          <span className="text-[18px] font-medium" style={{ color: '#9498B0' }}>{unit}</span>
        </div>
        <button onClick={() => setKg((k) => +(k + step()).toFixed(3))} className="w-14 h-14 rounded-full grid place-items-center" style={{ background: NAVY, color: '#fff' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>

      {/* baseline delta pill */}
      <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2" style={{ background: deltaOff ? 'rgba(184,105,58,.1)' : 'rgba(75,95,66,.1)' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: deltaColor }} />
        <span className="text-[13px] font-medium" style={{ color: deltaColor }}>{deltaTxt}</span>
      </div>

      {/* detail card */}
      <div className="mt-6 rounded-[16px] overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(27,27,58,.08)' }}>
        <DRow icon={<ClockIcon />} l="When" r="Today, just now" />
        <DRow icon={<WaveIcon />} l={`Baseline ${baseDisp != null ? baseDisp.toFixed(1) + ' ' + unit : '—'}`} r="her usual" last />
      </div>

      <p className="mt-6 text-center text-[13px] leading-relaxed px-2 flex items-start gap-2 justify-center" style={{ color: '#757896' }}>
        <span style={{ color: PERI }}>☾</span>
        <span>A reading now and then is plenty. We'll fold it into {name}'s trend, never judge a single number.</span>
      </p>

      <div className="flex-1" />

      {/* sanity-check prompt — shown after the first save tap on an off-baseline reading */}
      {confirming && (
        <div className="mb-3 rounded-[14px] px-4 py-3 flex items-start gap-2.5" style={{ background: 'rgba(184,105,58,.1)', border: '1px solid rgba(184,105,58,.25)' }}>
          <span style={{ color: TERRA, fontSize: 15, lineHeight: '18px' }}>⚠</span>
          <span className="text-[12.5px] leading-relaxed" style={{ color: '#8A5A2A' }}>{warnText} Tap again to confirm, or adjust the number above.</span>
        </div>
      )}
      <button onClick={save} disabled={saving} className="w-full rounded-full py-4 font-semibold text-[15px] text-white active:scale-[0.99] transition disabled:opacity-50" style={{ background: confirming ? TERRA : NAVY }}>
        {saving ? 'Saving…' : confirming ? 'Yes, save this weight' : `Save to ${name}'s record`}
      </button>
    </div>
  )
}

function DRow({ icon, l, r, last }: { icon: React.ReactNode; l: string; r: string; last?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: last ? 'none' : '1px solid rgba(27,27,58,.07)' }}>
      <span className="flex items-center gap-2.5 text-[14px]" style={{ color: '#1A1B2E' }}><span style={{ color: '#9498B0' }}>{icon}</span>{l}</span>
      <span className="text-[13px] font-medium" style={{ color: '#757896' }}>{r}</span>
    </div>
  )
}
function ClockIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg> }
function WaveIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 10c3 0 3 3 6 3s3-3 6-3 3 3 6 3M3 15c3 0 3 2 6 2s3-2 6-2 3 2 6 2" /></svg> }
