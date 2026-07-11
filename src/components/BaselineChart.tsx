import { useEffect, useRef } from 'react'

export interface BaselinePoint {
  value: number
  label?: string
}

interface Props {
  points: BaselinePoint[]
  baseline: number
  band: number
  unit: string
  accent: string
  xLabels: [string, string]
}

// The signature "against her own baseline" chart: a soft baseline band
// (her normal), a dashed baseline, gradient area, and a trend line that
// draws itself on. Premium, calm, editorial.
export default function BaselineChart({ points, baseline, band, accent, xLabels }: Props) {
  const lineRef = useRef<SVGPathElement>(null)

  const W = 340, H = 188, PADL = 12, PADR = 14, PADT = 18, PADB = 24
  const data = points.map((p) => p.value)
  const n = data.length

  const lo = Math.min(...data, baseline - band)
  const hi = Math.max(...data, baseline + band)
  const pad = (hi - lo) * 0.18 || 1
  const ymin = lo - pad, ymax = hi + pad

  const x = (i: number) => PADL + (W - PADL - PADR) * (n > 1 ? i / (n - 1) : 0)
  const y = (v: number) => PADT + (H - PADT - PADB) * (1 - (v - ymin) / (ymax - ymin))

  const bandTop = y(baseline + band)
  const bandBot = y(baseline - band)
  const baseY = y(baseline)
  const pts = data.map((v, i) => [x(i), y(v)] as const)
  const linePath = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${x(n - 1).toFixed(1)} ${(H - PADB).toFixed(1)} L ${x(0).toFixed(1)} ${(H - PADB).toFixed(1)} Z`

  useEffect(() => {
    const el = lineRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let len = 0
    try { len = el.getTotalLength() } catch { return }
    if (reduce || !len) { el.style.strokeDasharray = 'none'; return }
    el.style.strokeDasharray = String(len)
    el.style.strokeDashoffset = String(len)
    const anim = el.animate(
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: 1300, delay: 200, easing: 'cubic-bezier(.4,0,.15,1)', fill: 'forwards' }
    )
    return () => anim.cancel()
  }, [linePath])

  const gid = 'baseFill'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto overflow-visible" role="img" aria-label="Trend against baseline">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* baseline band — "her normal" */}
      <rect x={PADL} y={bandTop} width={W - PADL - PADR} height={Math.max(bandBot - bandTop, 2)}
        rx="7" fill="rgb(var(--accent))" opacity="0.13" />
      <line x1={PADL} x2={W - PADR} y1={baseY} y2={baseY}
        stroke="rgb(var(--accent))" strokeDasharray="2 4" strokeWidth="1" opacity="0.55" />
      <text x={PADL + 2} y={baseY - 6} fill="rgb(var(--accent))"
        style={{ fontSize: 9, letterSpacing: '0.05em', opacity: 0.8 }}>her normal</text>

      {/* area + trend */}
      <path d={areaPath} fill={`url(#${gid})`} />
      <path ref={lineRef} d={linePath} fill="none" stroke={accent} strokeWidth="2.4"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* points */}
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === n - 1 ? 4 : 3}
          fill={i === n - 1 ? accent : 'rgb(var(--parchment))'} stroke={accent} strokeWidth="1.6" />
      ))}

      <text x={PADL} y={H - 7} className="fill-sepia-faint" style={{ fontSize: 9.5, letterSpacing: '0.04em' }}>{xLabels[0]}</text>
      <text x={W - PADR} y={H - 7} textAnchor="end" className="fill-sepia-faint" style={{ fontSize: 9.5, letterSpacing: '0.04em' }}>{xLabels[1]}</text>
    </svg>
  )
}
