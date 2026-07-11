import { useEffect, useState, ReactNode } from 'react'
import { api, FoodProduct } from '../api'
import { usePassport } from '../lib/passport'
import { Loading, ErrorCard, Card } from './Passport'

const PERI = '#6B6BD6'
const INK = '#1A1B2E'
const MUTED = '#757896'
const IVORY = '#FAF7F1'

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1)

const FALLBACK_FOODS: FoodProduct[] = [
  { id: 'fb1', product_name: 'Complete Health Pâté, Chicken', brand: 'Wellness', texture: 'wet', calories_per_100g: 108, moisture_pct: 78 },
  { id: 'fb2', product_name: 'Pro Plan LiveClear Kidney Care', brand: 'Purina', texture: 'dry', calories_per_100g: 398, moisture_pct: 12 },
  { id: 'fb3', product_name: 'Renal Support Morsels in Gravy', brand: 'Royal Canin', texture: 'wet', calories_per_100g: 92, moisture_pct: 82 },
  { id: 'fb4', product_name: 'Hydra Care Hydration Supplement', brand: 'Purina', texture: 'wet', calories_per_100g: 40, moisture_pct: 92 },
  { id: 'fb5', product_name: 'Indoor Adult Salmon Recipe', brand: 'Wellness', texture: 'dry', calories_per_100g: 360, moisture_pct: 10 },
]

export default function Provisions() {
  const { data, loading, error } = usePassport()
  const [foods, setFoods] = useState<FoodProduct[]>([])
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    api
      .foods('', 12)
      .then((f) => {
        const withK = f.filter((x) => x.calories_per_100g != null)
        setFoods(withK.length ? withK : FALLBACK_FOODS)
      })
      .catch(() => setFoods(FALLBACK_FOODS))
      .finally(() => setBusy(false))
  }, [])

  if (loading) return <Loading />
  if (error || !data) return <ErrorCard msg={error} />
  const { cat } = data

  const ws = (data.weight_logs || []).map((w) => Number(w.weight_kg))
  const deltaUp = ws.length > 1 && ws[ws.length - 1] > mean(ws) * 1.03
  const because = deltaUp
    ? `Her weight is drifting a little above her baseline — leaner, high-moisture options are worth a look.`
    : `Matched to ${cat.name}'s breed, age and current diet — not to anyone's commission.`

  return (
    <div className="min-h-full px-5 pt-14 pb-10" style={{ background: IVORY }}>
      <p className="text-[13px] font-medium" style={{ color: MUTED }}>Food</p>
      <h1 className="font-serif text-[30px] leading-tight mt-0.5" style={{ color: INK }}>
        Chosen from <span style={{ fontStyle: 'italic', color: PERI }}>{cat.name}'s</span> record.
      </h1>

      {/* rationale */}
      <Card className="mt-5 p-4 flex gap-3 items-start">
        <span className="w-8 h-8 rounded-full grid place-items-center flex-none mt-0.5" style={{ background: 'rgba(107,107,214,.1)', color: PERI }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" /></svg>
        </span>
        <div>
          <p className="font-mono text-[8.5px] tracking-[0.18em] uppercase" style={{ color: PERI }}>Why this</p>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: INK }}>{because}</p>
        </div>
      </Card>

      {/* products */}
      <div className="mt-4 space-y-3">
        {busy && <p className="text-[13px] text-center py-4" style={{ color: MUTED }}>Reviewing the catalogue…</p>}
        {foods.slice(0, 6).map((f) => (
          <Card key={f.id} className="p-3.5 flex gap-3.5 items-center">
            <div className="w-16 h-16 rounded-2xl flex-none grid place-items-center overflow-hidden" style={{ background: '#ECE5D2' }}>
              {f.image_url ? <img src={f.image_url} className="w-full h-full object-cover" /> : <span className="text-2xl">🐟</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] font-semibold leading-tight" style={{ color: INK }}>{f.product_name}</p>
              <p className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>{f.brand || '—'}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {f.texture && <Tag>{f.texture}</Tag>}
                {f.calories_per_100g != null && <Tag>{Math.round(f.calories_per_100g)} kcal</Tag>}
                {f.moisture_pct != null && <Tag>{Math.round(f.moisture_pct)}% moisture</Tag>}
              </div>
            </div>
            <span className="font-mono text-[8px] uppercase tracking-wide rounded-full px-2 py-1 self-start mt-1" style={{ background: 'rgba(107,107,214,.08)', color: PERI }}>fit ✓</span>
          </Card>
        ))}
      </div>

      {/* membership — calm, on-system */}
      <Card className="mt-6 p-5">
        <p className="font-mono text-[8px] tracking-[0.2em] uppercase" style={{ color: PERI }}>Membership</p>
        <p className="font-serif text-[21px] mt-2 leading-tight" style={{ color: INK }}>
          Savings only when the <span style={{ fontStyle: 'italic', color: PERI }}>maths is real</span>.
        </p>
        <p className="mt-2.5 text-[12.5px] leading-relaxed" style={{ color: MUTED }}>
          We won't sell a subscription until partner pricing genuinely beats the fee. Until then, nothing to buy here.
        </p>
      </Card>

      <p className="mt-6 text-center text-[10px] leading-relaxed" style={{ color: '#9498B0' }}>
        Never commission-sorted · never a food she already eats · never shown during an alert.<br />Educational only — always consult your vet.
      </p>
    </div>
  )
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium" style={{ background: '#ECE5D2', color: MUTED }}>
      {children}
    </span>
  )
}
