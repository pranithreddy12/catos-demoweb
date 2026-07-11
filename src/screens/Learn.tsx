import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const QUICK = ['kidney', 'thyroid', 'urinary', 'diabetes', 'cardio']

export default function Learn() {
  const [q, setQ] = useState('kidney')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    if (q.trim().length < 2) return
    setLoading(true)
    const t = setTimeout(() => {
      api
        .conditions(q)
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="px-4 pt-12 pb-6">
      <button onClick={() => nav('/profile')} className="text-sepia-soft text-sm font-serif mb-1">
        ‹ Registry
      </button>
      <h1 className="passport-h text-[15px]">Research Archive</h1>
      <p className="text-center text-[10px] text-sepia-faint italic mt-0.5">
        Vet-grounded, extracted from PubMed
      </p>

      <div className="mt-4 relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a condition…"
          className="w-full bg-parchment-50 rounded-md border border-gold/50 pl-10 pr-4 py-2.5 outline-none focus:border-gold-dark font-serif text-sepia placeholder:text-sepia-faint"
        />
        <span className="absolute left-3.5 top-2.5 text-sepia-faint">⌕</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((k) => (
          <button
            key={k}
            onClick={() => setQ(k)}
            className={`rounded-sm border px-3 py-1 text-xs font-serif transition ${
              q === k
                ? 'bg-sepia text-parchment-50 border-sepia'
                : 'bg-parchment-50 border-gold/40 text-sepia-soft'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        {loading && <p className="text-sepia-soft text-sm italic py-4 text-center">Consulting the archive…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sepia-soft text-sm italic py-4 text-center">
            No conditions found for "{q}". Try another term.
          </p>
        )}
        {items.map((c, i) => (
          <div key={i} className="page parchment p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="field-value font-bold leading-tight">{c.condition_name}</p>
              {c.evidence_level && (
                <span className="inline-flex items-center rounded-sm border border-gold/50 bg-parchment-50 px-2 py-0.5 text-[10px] font-serif text-sepia-soft shrink-0">
                  {c.evidence_level}
                </span>
              )}
            </div>
            {(() => {
              const syms = (Array.isArray(c.key_symptoms) ? c.key_symptoms : [])
                .filter((s: any) => s && !['null', 'none', 'n/a'].includes(String(s).toLowerCase().trim()))
                .slice(0, 5)
              return syms.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {syms.map((s: string, j: number) => (
                    <span key={j} className="inline-flex items-center rounded-sm border border-gold/30 bg-parchment-200 px-2 py-0.5 text-[10px] font-serif text-sepia-soft">
                      {s}
                    </span>
                  ))}
                </div>
              ) : null
            })()}
            {Array.isArray(c.pmid_sources) && c.pmid_sources.length > 0 && (
              <p className="mt-2 text-[11px] text-sepia-faint italic">
                Source:{' '}
                {c.pmid_sources.slice(0, 3).map((pmid: any, k: number) => {
                  const id = String(pmid).trim()
                  const numeric = /^\d+$/.test(id)
                  return (
                    <span key={k}>
                      {k > 0 && ', '}
                      {numeric ? (
                        <a href={`https://pubmed.ncbi.nlm.nih.gov/${id}/`} target="_blank" rel="noreferrer" className="not-italic underline" style={{ color: '#6B6BD6' }}>
                          PubMed {id}
                        </a>
                      ) : (
                        <>PubMed {id}</>
                      )}
                    </span>
                  )
                })}
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-6 mb-2 text-center text-[10px] text-sepia-faint italic">
        Educational only · always consult your vet
      </p>
    </div>
  )
}
