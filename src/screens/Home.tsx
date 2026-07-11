import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Home() {
  const nav = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    api.stats().then(setStats).catch(() => setErr(true))
  }, [])

  return (
    <div className="px-5 pt-14">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-black/40 text-sm font-medium">Good morning</p>
          <h1 className="text-2xl font-extrabold tracking-tight">LunaCat</h1>
        </div>
        <div className="h-11 w-11 rounded-full bg-luna-100 grid place-items-center text-luna-700 font-bold">
          🐾
        </div>
      </div>

      {/* Narrative state hero */}
      <div className="card mt-5 p-5 bg-gradient-to-br from-moss-100 to-paper">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-moss-500" />
          <span className="text-moss-700 font-bold text-sm">Settled</span>
        </div>
        <p className="mt-2 text-[15px] leading-snug text-ink/80">
          Luna has had a calm week — litter, appetite, and activity all look
          consistent with her usual pattern.
        </p>
        <p className="mt-3 text-xs text-black/40">
          Most cats are perfectly fine day to day. We watch the pattern, not single events.
        </p>
      </div>

      {/* Set up CTA */}
      <button
        onClick={() => nav('/onboarding')}
        className="mt-4 w-full card p-4 flex items-center gap-3 text-left active:scale-[0.99] transition"
      >
        <div className="h-10 w-10 rounded-xl bg-ink text-white grid place-items-center">＋</div>
        <div className="flex-1">
          <p className="font-bold text-[15px]">Set up your cat</p>
          <p className="text-xs text-black/45">Breed, profile & instant health intelligence</p>
        </div>
        <span className="text-black/30">›</span>
      </button>

      {/* Live data stats */}
      <h2 className="mt-7 mb-3 text-sm font-bold text-black/50 uppercase tracking-wide">
        Powered by real data
      </h2>
      {err && (
        <div className="card p-4 text-sm text-rust-700 bg-rust-100">
          Backend not reachable. Start it with <code>uvicorn api.main:app</code>.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Stat value={stats?.food_products} label="Foods in catalogue" tone="luna" />
        <Stat value={stats?.food_with_nutrients} label="With full nutrients" tone="moss" />
        <Stat value={stats?.breeds} label="Cat breeds" tone="amber" />
        <Stat value={stats?.research_conditions} label="Research conditions" tone="luna" />
      </div>

      <p className="mt-6 mb-2 text-center text-[11px] text-black/30">
        Educational only · always consult your vet
      </p>
    </div>
  )
}

function Stat({ value, label, tone }: { value?: number; label: string; tone: string }) {
  const toneMap: Record<string, string> = {
    luna: 'text-luna-600',
    moss: 'text-moss-700',
    amber: 'text-amber-700',
  }
  return (
    <div className="card p-4">
      <div className={`text-2xl font-extrabold ${toneMap[tone]}`}>
        {value === undefined ? '—' : value.toLocaleString()}
      </div>
      <div className="text-xs text-black/50 mt-0.5 leading-tight">{label}</div>
    </div>
  )
}
