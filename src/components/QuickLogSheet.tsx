import { useEffect, useState } from 'react'
import { api } from '../api'

const NAVY = '#1A1B2E'
const GREEN = '#4B5F42'

export type LogMetric = 'weight' | 'food' | null

// Qualitative-first food options (roadmap L4): all/most/half/little/none.
const FOOD = [
  ['Ate all', 100],
  ['Most', 75],
  ['Half', 50],
  ['A little', 25],
  ['None', 0],
] as const

export default function QuickLogSheet({
  metric,
  catId,
  curWeight,
  onClose,
  onLogged,
}: {
  metric: LogMetric
  catId: string
  curWeight?: number | null
  onClose: () => void
  onLogged: (msg: string) => void
}) {
  const open = metric !== null
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (metric === 'weight') setWeight(curWeight ? String(curWeight) : '')
  }, [metric, curWeight])

  const saveWeight = async () => {
    const v = Number(weight)
    if (!v) return
    setSaving(true)
    try {
      const r = await api.logWeight(catId, v)
      onLogged(`Weight saved · ${r.total_weigh_ins} weigh-ins on record`)
    } catch {
      onLogged('Could not save — backend offline')
    } finally {
      setSaving(false)
    }
  }

  const saveFood = async (pct: number, label: string) => {
    setSaving(true)
    try {
      await api.logFood(catId, pct, label)
      onLogged(`Meal logged · ${label.toLowerCase()}`)
    } catch {
      onLogged('Could not save — backend offline')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* scrim */}
      <div
        onClick={onClose}
        className="absolute inset-0 z-40 transition-opacity duration-300"
        style={{ background: 'rgba(10,27,61,.5)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
      />
      {/* sheet */}
      <div
        className="absolute left-0 right-0 bottom-0 z-50 rounded-t-[24px] px-6 pt-4 pb-8 transition-transform duration-300"
        style={{
          background: '#FDFBF6',
          transform: open ? 'translateY(0)' : 'translateY(110%)',
          boxShadow: '0 -20px 50px -20px rgba(10,27,61,.4)',
        }}
      >
        <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: 'rgba(23,58,116,.2)' }} />

        {metric === 'weight' && (
          <>
            <div className="text-center font-serif text-[24px]" style={{ color: '#1A1B2E' }}>Log weight</div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, ''))}
                inputMode="decimal"
                autoFocus
                className="w-32 text-center font-mono text-[34px] bg-transparent outline-none"
                style={{ color: NAVY }}
                placeholder="0.0"
              />
              <span className="font-mono text-[14px]" style={{ color: '#757896' }}>kg</span>
            </div>
            <button
              onClick={saveWeight}
              disabled={saving || !Number(weight)}
              className="mt-6 w-full rounded-[13px] py-3.5 font-semibold text-[14px] text-white disabled:opacity-50 active:scale-[0.99] transition"
              style={{ background: GREEN }}
            >
              {saving ? 'Saving…' : `Save to her record`}
            </button>
          </>
        )}

        {metric === 'food' && (
          <>
            <div className="text-center font-serif text-[24px]" style={{ color: '#1A1B2E' }}>How much did she eat?</div>
            <p className="text-center text-[12px] mt-1" style={{ color: '#9498B0' }}>No grams needed — just the gist.</p>
            <div className="mt-5 grid grid-cols-1 gap-2">
              {FOOD.map(([label, pct]) => (
                <button
                  key={label}
                  onClick={() => saveFood(pct as number, label as string)}
                  disabled={saving}
                  className="w-full rounded-[12px] py-3 font-medium text-[14px] border active:scale-[0.99] transition disabled:opacity-50"
                  style={{ borderColor: 'rgba(23,58,116,.2)', background: '#fff', color: NAVY }}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
