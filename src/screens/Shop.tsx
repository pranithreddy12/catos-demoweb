import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { api, type CatalogProduct } from '../api'
import { usePassport } from '../lib/passport'

// Commerce V1 -- "LunaCat is not a store. It is a signpost."
// We explain a product and point the owner at trusted merchants. No prices, no
// stock, no cart, no checkout. Buy buttons live ONLY here, on product surfaces --
// never on a screen that discusses symptoms or lab results.

const PERI = '#6B6BD6'
const INK = '#1A1B2E'
const MUTED = '#757896'
const AMBER = '#8A5A1E'
const SH = '0 1px 2px rgba(26,27,46,.05), 0 8px 20px -10px rgba(26,27,46,.12)'

const portal = (node: ReactNode) =>
  createPortal(node, document.getElementById('lc-phone') || document.body)

function platform(): string {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
  if (/Android/i.test(ua)) return 'Android'
  return 'Web'
}

export default function Shop() {
  const { data } = usePassport()
  const [items, setItems] = useState<CatalogProduct[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState<CatalogProduct | null>(null)
  const nav = useNavigate()

  useEffect(() => {
    api.catalogProducts()
      .then(setItems)
      .catch(() => setFailed(true))
  }, [])

  return (
    <div className="px-4 pt-12 pb-8" style={{ minHeight: '100%' }}>
      <button onClick={() => nav(-1)} className="text-[13px] font-serif mb-2"
        style={{ background: 'none', border: 0, cursor: 'pointer', color: MUTED }}>‹ Back</button>

      <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 30, lineHeight: 1.1, color: INK, margin: 0 }}>
        Provisions
      </h1>
      <p style={{ color: MUTED, fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
        Things we can explain, and where to find them. We don’t sell anything —
        you’ll check out with the store you choose.
      </p>

      {failed && (
        <p style={{ color: AMBER, fontSize: 13, marginTop: 20 }}>
          Couldn’t load provisions just now. Please try again.
        </p>
      )}

      {items && items.length === 0 && (
        <p style={{ color: MUTED, fontSize: 13.5, marginTop: 24, lineHeight: 1.6 }}>
          Nothing here yet. The catalogue is curated by hand — products appear once
          they’ve been reviewed.
        </p>
      )}

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(items || []).map((p) => (
          <button key={p.id} onClick={() => setOpen(p)}
            style={{ textAlign: 'left', background: '#fff', border: '1px solid rgba(26,27,46,.07)', borderRadius: 16, boxShadow: SH, padding: 14, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ width: 54, height: 54, borderRadius: 12, flex: 'none', background: '#F3F2F8', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              {p.image_url
                ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: PERI, fontSize: 20 }}>◍</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14.5, color: INK }}>{p.name}</p>
              {p.brand && <p style={{ margin: '2px 0 0', fontSize: 11.5, color: MUTED }}>{p.brand}</p>}
              {p.safety_class === 'explain_only' && (
                <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: AMBER, background: 'rgba(138,90,30,.09)', borderRadius: 6, padding: '2px 7px' }}>
                  Vet guidance
                </span>
              )}
            </div>
            <span style={{ color: MUTED }}>›</span>
          </button>
        ))}
      </div>

      {open && <ProductSheet product={open} catId={data?.cat?.id} onClose={() => setOpen(null)} />}
    </div>
  )
}

function ProductSheet({ product, catId, onClose }: { product: CatalogProduct; catId?: string; onClose: () => void }) {
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const buy = async (offerId: string) => {
    setErr(null)
    setBusy(offerId)
    // Pre-open a real tab synchronously inside the click gesture, otherwise mobile
    // browsers block the popup once we've awaited the click-logging request. NOTE:
    // do NOT pass 'noopener' here -- window.open() returns null when it's set, and
    // we'd lose the handle (and end up navigating the app's own tab away). Instead
    // null out opener on the blank tab to block reverse tab-nabbing.
    const win = window.open('', '_blank')
    if (win) { try { win.opener = null } catch { /* ignore */ } }
    try {
      const res = await api.productClick(product.id, {
        merchant_offer_id: offerId,
        surface: 'product_page',
        cat_id: catId,
        platform: platform(),
      })
      if (win) win.location.href = res.url
      else window.location.href = res.url // popup blocked despite the gesture; last resort
    } catch {
      win?.close()
      setErr('That link isn’t available right now.')
    } finally {
      setBusy('')
    }
  }

  const explainOnly = product.safety_class === 'explain_only'

  return portal(
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'rgba(14,15,26,.45)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: '#FDFBF6', width: '100%', maxHeight: '90%', overflowY: 'auto', borderRadius: '22px 22px 0 0', padding: '20px 20px calc(24px + env(safe-area-inset-bottom))' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, lineHeight: 1.15, color: INK, margin: 0 }}>{product.name}</h2>
            {product.brand && <p style={{ margin: '4px 0 0', fontSize: 12.5, color: MUTED }}>{product.brand}</p>}
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ border: 0, background: 'rgba(26,27,46,.07)', width: 32, height: 32, borderRadius: 999, cursor: 'pointer', color: INK, flex: 'none' }}>✕</button>
        </div>

        {product.description && (
          <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.6, color: '#2A2C45' }}>{product.description}</p>
        )}

        {/* explain_only: the vet note and explain-only wording MUST sit ABOVE the
            buy buttons. Enforced by safety_class, not editorial discipline. */}
        {explainOnly && (
          <div style={{ marginTop: 14, borderRadius: 14, border: '1px solid rgba(138,90,30,.22)', background: 'rgba(138,90,30,.06)', padding: 14 }}>
            <p style={{ margin: 0, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: AMBER, fontWeight: 600 }}>
              Under veterinary guidance
            </p>
            {product.vet_note && (
              <p style={{ margin: '7px 0 0', fontSize: 13, lineHeight: 1.55, color: '#4A3A22' }}>{product.vet_note}</p>
            )}
            {product.explain_only_wording && (
              <p style={{ margin: '7px 0 0', fontSize: 12.5, lineHeight: 1.55, color: '#5C4A2E' }}>{product.explain_only_wording}</p>
            )}
          </div>
        )}

        {product.offers.length > 0 ? (
          <>
            <p style={{ marginTop: 20, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: MUTED, fontWeight: 600 }}>
              Where to find it
            </p>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {product.offers.map((o) => (
                <button key={o.offer_id} onClick={() => buy(o.offer_id)} disabled={!!busy}
                  style={{ border: `1px solid ${PERI}`, background: busy === o.offer_id ? 'rgba(107,107,214,.12)' : '#fff', color: PERI, borderRadius: 999, padding: '13px 16px', fontSize: 14.5, fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy && busy !== o.offer_id ? 0.5 : 1 }}>
                  {busy === o.offer_id ? 'Opening…' : o.label}
                </button>
              ))}
            </div>

            {err && <p style={{ marginTop: 10, fontSize: 12.5, color: AMBER }}>{err}</p>}

            {product.disclosure && (
              <p style={{ marginTop: 14, fontSize: 11.5, lineHeight: 1.5, color: MUTED }}>{product.disclosure}</p>
            )}
          </>
        ) : (
          <p style={{ marginTop: 18, fontSize: 13, color: MUTED }}>No stores listed for this yet.</p>
        )}
      </div>
    </div>,
  )
}
