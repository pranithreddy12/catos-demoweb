interface Pt {
  weight_kg: number
  logged_at: string
}

// Lightweight parchment-styled line chart with paw-print markers.
export default function WeightChart({ points }: { points: Pt[] }) {
  if (!points || points.length === 0) {
    return <p className="text-sepia-soft text-sm italic text-center py-6">No weight entries yet.</p>
  }

  const W = 300
  const H = 150
  const padL = 30
  const padR = 12
  const padT = 14
  const padB = 26

  const kgs = points.map((p) => Number(p.weight_kg))
  const lbs = kgs.map((k) => k * 2.205)
  const minLb = Math.floor(Math.min(...lbs) - 0.6)
  const maxLb = Math.ceil(Math.max(...lbs) + 0.6)
  const span = Math.max(maxLb - minLb, 1)

  const x = (i: number) =>
    padL + (i * (W - padL - padR)) / Math.max(points.length - 1, 1)
  const y = (lb: number) =>
    padT + (H - padT - padB) * (1 - (lb - minLb) / span)

  const linePts = lbs.map((lb, i) => `${x(i)},${y(lb)}`).join(' ')
  const areaPts = `${padL},${H - padB} ${linePts} ${x(points.length - 1)},${H - padB}`

  const month = (s: string) => {
    const d = new Date(s)
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short' })
  }

  // y gridlines
  const ticks = [minLb, minLb + span / 2, maxLb]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Weight trend">
      {/* gridlines */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL} x2={W - padR} y1={y(t)} y2={y(t)}
            stroke="#ddd5c4" strokeWidth="0.7"
          />
          <text x={padL - 5} y={y(t) + 3} textAnchor="end"
            className="fill-sepia-faint" style={{ fontSize: 8, fontFamily: 'Georgia, serif' }}>
            {t.toFixed(1)}
          </text>
        </g>
      ))}

      {/* filled area */}
      <polygon points={areaPts} fill="#9a8a6e" fillOpacity="0.15" />
      {/* line */}
      <polyline points={linePts} fill="none" stroke="#6b5b43" strokeWidth="1.4"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* paw markers + month labels */}
      {lbs.map((lb, i) => (
        <g key={i}>
          <text x={x(i)} y={y(lb) - 5} textAnchor="middle"
            style={{ fontSize: 9 }}>🐾</text>
          <text x={x(i)} y={H - padB + 13} textAnchor="middle"
            className="fill-sepia-faint" style={{ fontSize: 8, fontFamily: 'Georgia, serif' }}>
            {month(points[i].logged_at)}
          </text>
        </g>
      ))}
      <text x={4} y={11} className="fill-sepia-faint"
        style={{ fontSize: 8, fontFamily: 'Georgia, serif' }}>lbs</text>
    </svg>
  )
}
