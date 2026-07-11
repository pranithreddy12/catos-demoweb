import { useEffect, useRef, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { api, DmbResult, FlagResult, FoodProduct } from '../api'
import { usePassport } from '../lib/passport'

// overlays render at the phone-frame level so they cover the whole phone and
// lock the list behind them (instead of scrolling with the content)
const portal = (node: ReactNode) => createPortal(node, document.getElementById('lc-phone') || document.body)

// final design tokens
const CREAM = '#FAF7F1'
const INK = '#1A1B2E'
const MUTED = '#757896'
const MUTED2 = '#565878'
const MUTED3 = '#9498B0'
const PERI = '#6B6BD6'
const PERI_DK = '#45459A'
const PERI_BG = '#F2F1FC'
const SAGE = '#4B5F42'
const SAGE_BG = '#DDE6D8'
const TERRA = '#B8693A'
const TAN = '#F4EFE4'
const SH = '0 1px 2px rgba(26,27,46,.04),0 4px 12px rgba(26,27,46,.04)'

// condition_id -> calm owner-facing area label for the current-food assessment
const AREA: Record<string, string> = {
  CKD: 'Kidney health', HYPERTHYROID: 'Thyroid health', DIABETES: 'Diabetic diet',
  FLUTD_STRUVITE: 'Urinary health', FLUTD_OXALATE: 'Urinary health', OBESITY: 'Weight',
}

// Render a nutrient target range from its min/max. Handles one-sided targets
// (e.g. carbs "10% max" — a bare "–10%" reads like negative-10).
function fmtTarget(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min}–${max}%`
  if (max != null) return `${max}% max`
  if (min != null) return `${min}% min`
  return 'the recommended range'
}

export default function Food() {
  const { data, reload } = usePassport()
  const nav = useNavigate()
  const catId = data?.cat.id
  const currentFood = data?.current_food
  const assessment = data?.current_food_assessment
  const [recall, setRecall] = useState<{ recalled: boolean; matches: { reason_for_recall?: string; recalling_firm?: string }[] } | null>(null)
  const [recallChecking, setRecallChecking] = useState(false)

  const [recentRecalls, setRecentRecalls] = useState<{ recalling_firm?: string; reason_for_recall?: string; report_date?: string }[]>([])

  // Live FDA recall check for the current food (openFDA food-enforcement feed).
  useEffect(() => {
    const brand = currentFood?.brand || ''
    if (!brand) { setRecall(null); return }
    setRecall(null); setRecallChecking(true)
    api.foodRecallCheck(brand, currentFood?.product_name || '')
      .then(setRecall).catch(() => setRecall(null)).finally(() => setRecallChecking(false))
  }, [currentFood?.product_id, currentFood?.brand])

  // Recent FDA cat-food recalls (last ~2 years) for the footer list.
  useEffect(() => {
    api.foodRecalls(730).then((r) => setRecentRecalls(r.recalls || [])).catch(() => setRecentRecalls([]))
  }, [])
  const [q, setQ] = useState('')
  const [items, setItems] = useState<FoodProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(40)
  const [sel, setSel] = useState<FoodProduct | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState<string | null>(null)
  const name = data?.cat.name || 'your cat'

  // Barcode -> product lookup. On a hit, open the detail sheet; else report.
  const lookupBarcode = (code: string) => {
    setScanMsg('Looking up ' + code + '…')
    api.productByBarcode(code)
      .then((p) => { setSel(p); setScanning(false); setScanMsg(null) })
      .catch(() => setScanMsg(`No catalogue match for ${code}. Try another or search by name.`))
  }

  // A new search starts back at the first page.
  useEffect(() => { setLimit(40) }, [q])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      api.foods(q, limit).then(setItems).catch(() => setItems([])).finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [q, limit])

  return (
    <div style={{ minHeight: '100%', background: CREAM, padding: '56px 16px 120px' }}>
      <div style={{ padding: '8px 8px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: MUTED }}>Food &amp; nutrition</div>
          <h1 style={{ margin: '4px 0 0', fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 34, lineHeight: 1.02, letterSpacing: '-.02em', color: INK }}>Her food, decoded.</h1>
        </div>
        <button onClick={() => nav(-1 as never)} style={{ border: 0, background: TAN, color: '#3D3F5A', width: 38, height: 38, borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
      </div>

      {/* rationale */}
      <div style={{ marginTop: 12, background: PERI_BG, borderRadius: 18, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: PERI_DK }}>Why this matters</div>
        <div style={{ fontSize: 14, color: MUTED2, marginTop: 8, lineHeight: 1.55 }}>
          Every label, read for {name} — protein, moisture and the things that matter for a cat like her. Tap any food to see it on a dry-matter basis, with universal-toxin flags.
        </div>
      </div>

      {/* currently feeding — the cat's current food, changeable by picking below */}
      <div style={{ marginTop: 14, background: '#fff', borderRadius: 18, boxShadow: SH, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: MUTED }}>Currently feeding {name}</div>
        {currentFood ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, flex: 'none', overflow: 'hidden', background: '#F0ECDF', display: 'grid', placeItems: 'center' }}>
              {currentFood.image_url ? <img src={currentFood.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18 }}>🐟</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentFood.product_name}</div>
              <div style={{ fontSize: 11.5, color: MUTED3, marginTop: 1 }}>{currentFood.brand || '—'} · tap a food below to change</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13.5, color: MUTED2, marginTop: 8, lineHeight: 1.5 }}>
            No food set yet — open any food below and tap <b>“Set as {name}’s food”</b> to track {name}’s daily diet.
          </div>
        )}
        {currentFood && (
          recallChecking ? (
            <div style={{ marginTop: 10, fontSize: 11.5, color: MUTED3 }}>Checking FDA recalls…</div>
          ) : recall?.recalled ? (
            <div style={{ marginTop: 10, background: '#FBEEE7', color: TERRA, borderRadius: 10, padding: '9px 12px', fontSize: 12.5, lineHeight: 1.45 }}>
              ⚠ FDA recall on this brand{recall.matches[0]?.reason_for_recall ? ` — ${recall.matches[0].reason_for_recall}` : ''}. Please check with your vet.
            </div>
          ) : recall ? (
            <div style={{ marginTop: 10, fontSize: 11.5, color: SAGE, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>✓</span> No active FDA recall for this brand.
            </div>
          ) : null
        )}
        {currentFood && assessment && (
          assessment.has_concerns ? (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {assessment.checks.filter((c) => c.status !== 'ok').map((c, i) => (
                <div key={'c' + i} style={{ background: '#FAE7D5', color: '#9A5A2A', borderRadius: 10, padding: '9px 12px', fontSize: 12.5, lineHeight: 1.45 }}>
                  {AREA[c.condition] || c.condition}: {c.nutrient} is {Math.round(c.food_dmb)}% DMB — {c.status} the target of {fmtTarget(c.target_min, c.target_max)}. Worth a vet chat.
                </div>
              ))}
              {assessment.toxin_flags.map((t, i) => (
                <div key={'t' + i} style={{ background: '#FBEEE7', color: TERRA, borderRadius: 10, padding: '9px 12px', fontSize: 12.5, lineHeight: 1.45 }}>{t.message}</div>
              ))}
              <div style={{ fontSize: 10.5, color: MUTED3, marginTop: 2 }}>Observational — checked against {name}’s current patterns, not a diagnosis.</div>
            </div>
          ) : assessment.conditions_checked.length > 0 ? (
            <div style={{ marginTop: 12, background: '#DDE6D8', color: SAGE, borderRadius: 10, padding: '9px 12px', fontSize: 12.5, lineHeight: 1.45 }}>
              ✓ Fits the areas LunaCat is watching ({assessment.conditions_checked.map((c) => AREA[c] || c).join(', ')}).
            </div>
          ) : null
        )}
      </div>

      {/* search + barcode scan */}
      <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={MUTED3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 16, top: 15 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 4,600+ foods…" style={{ width: '100%', background: '#fff', border: '1px solid rgba(26,27,46,.08)', borderRadius: 14, padding: '14px 16px 14px 44px', outline: 'none', fontFamily: "'Manrope'", fontSize: 15, color: INK, boxShadow: SH }} />
        </div>
        <button onClick={() => { setScanMsg(null); setScanning(true) }} aria-label="Scan a barcode" title="Scan a barcode"
          style={{ flex: 'none', width: 52, border: 0, borderRadius: 14, background: PERI, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SH }}>
          <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M6.5 8v8M10 8v8M13.5 8v8M17.5 8v8" /></svg>
        </button>
      </div>

      {/* list */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <p style={{ textAlign: 'center', padding: '16px 0', color: MUTED, fontSize: 13 }}>Reading the catalogue…</p>}
        {!loading && items.length === 0 && <p style={{ textAlign: 'center', padding: '16px 0', color: MUTED, fontSize: 13 }}>No foods found.</p>}
        {items.map((f) => (
          <button key={f.id} onClick={() => setSel(f)} style={{ background: '#fff', borderRadius: 16, boxShadow: SH, padding: 12, display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', border: 0, cursor: 'pointer', width: '100%' }}>
            <div style={{ width: 56, height: 56, borderRadius: 13, flex: 'none', overflow: 'hidden', background: '#F0ECDF', display: 'grid', placeItems: 'center' }}>
              {f.image_url ? <img src={f.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>🐟</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as never }}>{f.product_name}</div>
              <div style={{ fontSize: 11.5, color: MUTED3, marginTop: 2 }}>{f.brand || '—'}</div>
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {f.texture && <Chip>{f.texture}</Chip>}
                {f.calories_per_100g != null && <Chip>{Math.round(f.calories_per_100g)} kcal</Chip>}
                {f.moisture_pct != null && <Chip>{Math.round(f.moisture_pct)}% moisture</Chip>}
              </div>
            </div>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={MUTED3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        ))}
        {/* When the page came back full there are likely more foods to see. */}
        {!loading && items.length >= limit && (
          <button onClick={() => setLimit((l) => l + 40)}
            style={{ marginTop: 4, width: '100%', border: `1px solid rgba(26,27,46,.10)`, background: '#fff', color: PERI_DK, height: 46, borderRadius: 14, fontFamily: "'Manrope'", fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: SH }}>
            Load more foods
          </button>
        )}
      </div>

      {/* recent FDA recalls (live openFDA feed) */}
      {recentRecalls.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ padding: '0 6px 10px' }}><span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: MUTED }}>Recent FDA cat-food recalls</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentRecalls.slice(0, 5).map((r, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, boxShadow: SH, padding: '12px 14px', borderLeft: `3px solid ${TERRA}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{r.recalling_firm || 'Recalled product'}</div>
                <div style={{ fontSize: 11.5, color: MUTED2, marginTop: 2, lineHeight: 1.4 }}>{r.reason_for_recall || '—'}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10.5, color: MUTED3, marginTop: 8 }}>Live from the FDA food-enforcement feed — cat-food recalls are rare.</p>
        </div>
      )}

      {sel && <FoodDetail food={sel} catId={catId} catName={name} isCurrent={currentFood?.product_id === sel.id} onSet={reload} onClose={() => setSel(null)} />}
      {scanning && <BarcodeScanner onDetected={lookupBarcode} onClose={() => { setScanning(false); setScanMsg(null) }} message={scanMsg} />}
    </div>
  )
}

// Barcode scanner: live camera scanning. Uses the native BarcodeDetector where
// available (Chrome/Android); on browsers without it (notably iOS Safari) it
// lazy-loads a ZXing JS decoder so the camera still scans. Manual entry is always
// there as a last resort (and for testing). Camera access needs a secure context
// (https:// or localhost) — required anyway for the PWA.
function BarcodeScanner({ onDetected, onClose, message }: { onDetected: (code: string) => void; onClose: () => void; message: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'nocam' | 'unsupported'>('starting')
  const [manual, setManual] = useState('')

  useEffect(() => {
    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false
    let zxingControls: { stop: () => void } | null = null
    // Fire once per distinct code so a matched barcode isn't looked up repeatedly,
    // while still letting the user point at a DIFFERENT barcode ("try another").
    let lastFired = ''
    const fire = (code: string) => {
      if (!code || code === lastFired) return
      lastFired = code
      onDetected(code)
    }

    if (!navigator.mediaDevices?.getUserMedia) { setStatus('unsupported'); return }

    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector

    if (BD) {
      // Native BarcodeDetector path (Chrome/Android).
      const detector = new BD({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })
      ;(async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          if (stopped) { stream.getTracks().forEach((t) => t.stop()); return }
          if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
          setStatus('scanning')
          const tick = async () => {
            if (stopped || !videoRef.current) return
            try {
              const codes = await detector.detect(videoRef.current)
              if (codes && codes.length && codes[0].rawValue) fire(codes[0].rawValue)
            } catch { /* transient decode error, keep scanning */ }
            if (!stopped) raf = requestAnimationFrame(tick)
          }
          raf = requestAnimationFrame(tick)
        } catch { setStatus('nocam') }
      })()
    } else {
      // ZXing JS fallback for browsers without BarcodeDetector (iOS Safari).
      // Lazy-loaded so it only downloads where it's actually needed.
      ;(async () => {
        try {
          const { BrowserMultiFormatReader } = await import('@zxing/browser')
          if (stopped || !videoRef.current) return
          const reader = new BrowserMultiFormatReader()
          zxingControls = await reader.decodeFromConstraints(
            { video: { facingMode: 'environment' } },
            videoRef.current,
            (result) => { if (result) fire(result.getText()) },
          )
          if (stopped) { zxingControls.stop(); return }
          setStatus('scanning')
        } catch { setStatus('nocam') }
      })()
    }

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      try { zxingControls?.stop() } catch { /* ignore */ }
    }
  }, [])

  return portal(
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', flexDirection: 'column', background: '#0E0F1A' }}>
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
        <span style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22 }}>Scan a barcode</span>
        <button onClick={onClose} aria-label="Close scanner" style={{ border: 0, background: 'rgba(255,255,255,.14)', color: '#fff', width: 34, height: 34, borderRadius: 999, cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>

      <div style={{ position: 'relative', flex: 1, margin: '0 20px', borderRadius: 20, overflow: 'hidden', background: '#000' }}>
        <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {status === 'scanning' && <div style={{ position: 'absolute', left: '10%', right: '10%', top: '50%', height: 2, background: 'rgba(107,107,214,.9)', boxShadow: '0 0 12px rgba(107,107,214,.9)' }} />}
        {status !== 'scanning' && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24, color: 'rgba(255,255,255,.75)', fontSize: 13.5, lineHeight: 1.5 }}>
            {status === 'starting' && 'Starting camera…'}
            {status === 'nocam' && 'Camera unavailable or permission denied. Enter the barcode number below instead.'}
            {status === 'unsupported' && "This browser can't scan with the camera. Enter the barcode number below instead."}
          </div>
        )}
      </div>

      <div style={{ padding: 20 }}>
        {message && <p style={{ color: '#EEB582', fontSize: 13, textAlign: 'center', marginBottom: 10 }}>{message}</p>}
        {status === 'scanning' && <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 12.5, textAlign: 'center', marginBottom: 10 }}>Point at the barcode — it scans automatically.</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={manual} onChange={(e) => setManual(e.target.value)} inputMode="numeric" placeholder="Or type the barcode number"
            style={{ flex: 1, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 12, padding: '13px 14px', color: '#fff', fontSize: 15, outline: 'none' }} />
          <button onClick={() => manual.trim() && onDetected(manual.trim())} disabled={!manual.trim()}
            style={{ flex: 'none', border: 0, borderRadius: 12, padding: '0 18px', background: '#F2F1FC', color: INK, fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: manual.trim() ? 1 : 0.5 }}>Look up</button>
        </div>
      </div>
    </div>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 7, padding: '2px 8px', fontSize: 10.5, fontWeight: 500, background: '#F1F2F5', color: MUTED }}>{children}</span>
}

function FoodDetail({ food, catId, catName, isCurrent, onSet, onClose }: {
  food: FoodProduct; catId?: string; catName?: string; isCurrent?: boolean
  onSet?: () => void; onClose: () => void
}) {
  const [dmb, setDmb] = useState<DmbResult | null>(null)
  const [flags, setFlags] = useState<FlagResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(isCurrent ?? false)

  const setAsFood = () => {
    if (!catId) return
    setSaving(true)
    api.setCurrentFood(catId, food.id)
      .then(() => { setSaved(true); onSet?.() })
      .catch(() => {})
      .finally(() => setSaving(false))
  }
  const protein = (food as { nutritional_analysis?: { protein?: number; ash?: number } }).nutritional_analysis?.protein ?? null
  const ash = (food as { nutritional_analysis?: { protein?: number; ash?: number } }).nutritional_analysis?.ash ?? null

  useEffect(() => {
    api.dmb({ moisture: food.moisture_pct ?? null, protein, fat: food.fat_g_per_100g ?? null, fiber: food.fibre_g_per_100g ?? null, ash }).then(setDmb).catch(() => setDmb(null))
    if (food.ingredient_list) api.ingredientFlags(food.ingredient_list).then(setFlags).catch(() => setFlags(null))
  }, [food.id])

  return portal(
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(26,27,46,.45)' }} />
      <div style={{ position: 'relative', width: '100%', maxHeight: '86%', overflowY: 'auto', background: CREAM, borderRadius: '26px 26px 0 0', padding: '14px 22px 30px' }} className="no-scrollbar">
        <div style={{ width: 38, height: 5, borderRadius: 3, background: '#D2D4DF', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, flex: 'none', overflow: 'hidden', background: '#F0ECDF', display: 'grid', placeItems: 'center' }}>
            {food.image_url ? <img src={food.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>🐟</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, lineHeight: 1.15, color: INK }}>{food.product_name}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{food.brand}</div>
          </div>
        </div>

        {/* dry-matter */}
        <Label>Dry-matter analysis</Label>
        {!dmb && <p style={{ fontSize: 13, color: MUTED }}>Calculating…</p>}
        {dmb && !dmb.computable && <Note tone="warm">Moisture not listed — a fair dry-matter comparison isn't possible for this food.</Note>}
        {dmb && dmb.computable && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Macro label="Protein" v={dmb.dmb.protein} />
            <Macro label="Fat" v={dmb.dmb.fat} />
            <Macro label="Carbs" v={dmb.dmb.carb} />
          </div>
        )}
        {dmb?.computable && <p style={{ fontSize: 11.5, color: MUTED3, marginTop: 8, lineHeight: 1.5 }}>On a dry-matter basis ({dmb.dry_matter_pct}% dry matter) so wet and dry compare fairly.{dmb.carb_estimated ? ' Carbs estimated — ash isn’t listed on this label.' : ''}</p>}

        {/* flags */}
        <Label>Ingredient check</Label>
        {!food.ingredient_list && <p style={{ fontSize: 13, color: MUTED }}>No ingredient list on file.</p>}
        {flags && flags.flags.length === 0 && <Note tone="ok">No universal toxins detected.</Note>}
        {flags?.flags.map((fl, i) => <Note key={i} tone={fl.level === 'DANGER' ? 'warm' : 'amber'}><b>{fl.level}</b> · {fl.message}</Note>)}

        {catId && (
          <button onClick={setAsFood} disabled={saving || saved}
            style={{ marginTop: 22, width: '100%', border: saved ? `1.5px solid ${SAGE}` : 0, background: saved ? SAGE_BG : '#EDEBFB', color: saved ? SAGE : PERI_DK, height: 50, borderRadius: 999, fontFamily: "'Manrope'", fontSize: 14.5, fontWeight: 600, cursor: saved ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : saved ? `✓ ${catName || 'Your cat'}’s current food` : `Set as ${catName || 'your cat'}’s food`}
          </button>
        )}
        <button onClick={onClose} style={{ marginTop: catId ? 10 : 22, width: '100%', border: 0, background: PERI, color: '#fff', height: 52, borderRadius: 999, fontFamily: "'Manrope'", fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Done</button>
        <p style={{ textAlign: 'center', fontSize: 11, color: MUTED3, marginTop: 12 }}>Educational only · always consult your vet</p>
      </div>
    </div>
  )
}

function Label({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: MUTED, margin: '22px 0 10px' }}>{children}</div>
}
function Macro({ label, v }: { label: string; v: number | null }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: SH, padding: 14, textAlign: 'center' }}>
      <div style={{ fontFamily: "'Manrope'", fontSize: 22, fontWeight: 600, color: INK }}>{v == null ? '—' : `${v}%`}</div>
      <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
    </div>
  )
}
function Note({ children, tone }: { children: ReactNode; tone: 'ok' | 'warm' | 'amber' }) {
  const c = tone === 'ok' ? { bg: SAGE_BG, fg: SAGE } : tone === 'amber' ? { bg: '#FAE7D5', fg: '#9A5A2A' } : { bg: '#FBEEE7', fg: TERRA }
  return <div style={{ background: c.bg, color: c.fg, borderRadius: 12, padding: '12px 14px', fontSize: 13, lineHeight: 1.45, marginBottom: 8 }}>{children}</div>
}
