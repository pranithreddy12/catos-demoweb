import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type AdminCatalogProduct, type AffiliateClickRow } from '../api'

// Commerce V1 admin. Definition of done: the team can add a product, paste 1-3
// merchant links, and flip it live without a developer. Nothing here touches
// money, prices or stock -- those don't exist in V1.

const INK = '#1A1B2E'
const MUTED = '#6C6F86'
const PERI = '#6B6BD6'
const AMBER = '#8A5A1E'
const RED = '#B4552F'
const LINE = '1px solid rgba(26,27,46,.10)'
const MERCHANTS = ['chewy', 'amazon', 'walmart']
const CLASSES = ['recommendable', 'explain_only', 'blocked']

const input: React.CSSProperties = {
  border: LINE, borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none',
  background: '#fff', color: INK, width: '100%',
}
const btn = (bg: string): React.CSSProperties => ({
  border: 0, borderRadius: 8, padding: '8px 12px', fontSize: 12.5, fontWeight: 600,
  color: '#fff', background: bg, cursor: 'pointer',
})

export default function AdminCatalog() {
  const [rows, setRows] = useState<AdminCatalogProduct[] | null>(null)
  const [clicks, setClicks] = useState<AffiliateClickRow[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [denied, setDenied] = useState(false)

  const load = () => {
    api.adminCatalog().then(setRows).catch((e) => {
      if (String(e).includes('403')) setDenied(true)
      else setErr('Could not load the catalogue.')
    })
    api.adminClicks(50).then(setClicks).catch(() => setClicks([]))
  }
  useEffect(load, [])

  const fail = (e: unknown) => setErr(String(e).replace(/^Error:\s*/, '') || 'Something went wrong.')

  const toggleProduct = (p: AdminCatalogProduct) =>
    api.adminUpdateProduct(p.id, { is_active: !p.is_active }).then(load).catch(fail)

  const toggleOffer = (id: string, active: boolean) =>
    api.adminUpdateOffer(id, { is_active: !active }).then(load).catch(fail)

  const removeOffer = (id: string) =>
    api.adminDeleteOffer(id).then(load).catch(fail)

  if (denied) {
    return <Wrap><p style={{ color: MUTED }}>You don’t have access to this page.</p></Wrap>
  }

  return (
    <Wrap>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 28, margin: 0, color: INK }}>Catalogue</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
            LunaCat is a signpost, not a store. No prices, no stock, no checkout.
          </p>
        </div>
        <Link to="/admin" style={{ fontSize: 13, color: PERI }}>← Admin</Link>
      </div>

      {err && (
        <p style={{ marginTop: 14, fontSize: 13, color: RED, background: 'rgba(180,85,47,.08)', padding: '10px 12px', borderRadius: 8 }}>
          {err} <button onClick={() => setErr(null)} style={{ border: 0, background: 'none', color: RED, cursor: 'pointer' }}>dismiss</button>
        </p>
      )}

      <NewProduct onDone={load} onError={fail} />

      <h2 style={sectionH}>Products ({rows?.length ?? 0})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(rows || []).map((p) => (
          <div key={p.id} style={{ background: '#fff', border: LINE, borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: INK }}>{p.name}</p>
                <p style={{ margin: '3px 0 0', fontSize: 11.5, color: MUTED, fontFamily: 'monospace' }}>{p.id}</p>
                <div style={{ marginTop: 7, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Tag text={p.safety_class} color={p.safety_class === 'blocked' ? RED : p.safety_class === 'explain_only' ? AMBER : PERI} />
                  <Tag text={p.is_active ? 'live' : 'hidden'} color={p.is_active ? '#4B7A3F' : MUTED} />
                  {p.brand && <Tag text={p.brand} color={MUTED} />}
                </div>
                {p.safety_class === 'explain_only' && !p.vet_note?.trim() && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: RED }}>
                    Missing vet note — this product cannot render.
                  </p>
                )}
              </div>
              <button onClick={() => toggleProduct(p)} style={btn(p.is_active ? MUTED : '#4B7A3F')}>
                {p.is_active ? 'Hide' : 'Go live'}
              </button>
            </div>

            <div style={{ marginTop: 12, borderTop: LINE, paddingTop: 10 }}>
              {p.offers.length === 0 && <p style={{ margin: 0, fontSize: 12.5, color: MUTED }}>No merchant links yet.</p>}
              {p.offers.map((o) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 12.5 }}>
                  <span style={{ minWidth: 74, fontWeight: 600, color: INK, textTransform: 'capitalize' }}>{o.merchant}</span>
                  <span style={{ color: MUTED, minWidth: 28 }}>#{o.display_priority}</span>
                  <span style={{ flex: 1, color: o.affiliate_url ? PERI : MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.affiliate_url || o.merchant_product_url}
                    {!o.affiliate_url && <em style={{ color: AMBER }}> (fallback only)</em>}
                  </span>
                  <button onClick={() => toggleOffer(o.id, o.is_active)} style={{ ...btn(o.is_active ? MUTED : '#4B7A3F'), padding: '5px 9px' }}>
                    {o.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => removeOffer(o.id)} style={{ ...btn(RED), padding: '5px 9px' }}>Delete</button>
                </div>
              ))}
              <NewOffer productId={p.id} onDone={load} onError={fail} />
            </div>
          </div>
        ))}
      </div>

      <h2 style={sectionH}>Recent outbound taps ({clicks.length})</h2>
      <div style={{ background: '#fff', border: LINE, borderRadius: 12, overflow: 'hidden' }}>
        {clicks.length === 0 && <p style={{ margin: 0, padding: 14, fontSize: 13, color: MUTED }}>No taps yet.</p>}
        {clicks.map((c) => (
          <div key={c.id} style={{ display: 'flex', gap: 12, padding: '9px 14px', borderBottom: LINE, fontSize: 12.5 }}>
            <span style={{ flex: 1, color: INK }}>{c.product_name || c.product_id}</span>
            <span style={{ width: 80, color: MUTED, textTransform: 'capitalize' }}>{c.merchant || '—'}</span>
            <span style={{ width: 110, color: MUTED }}>{c.surface || '—'}</span>
            <span style={{ width: 130, color: c.result === 'opened_affiliate' ? '#4B7A3F' : c.result === 'failed' ? RED : AMBER }}>{c.result}</span>
            <span style={{ width: 70, color: MUTED }}>{c.platform || '—'}</span>
            <span style={{ width: 150, color: MUTED }}>{new Date(c.clicked_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Wrap>
  )
}

function NewProduct({ onDone, onError }: { onDone: () => void; onError: (e: unknown) => void }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ id: '', name: '', brand: '', category: '', safety_class: 'recommendable', description: '', vet_note: '', image_url: '' })
  const set = (k: string, v: string) => setF({ ...f, [k]: v })

  const save = () => {
    api.adminCreateProduct({ ...f, is_active: false })
      .then(() => { setF({ id: '', name: '', brand: '', category: '', safety_class: 'recommendable', description: '', vet_note: '', image_url: '' }); setOpen(false); onDone() })
      .catch(onError)
  }

  if (!open) return <button onClick={() => setOpen(true)} style={{ ...btn(PERI), marginTop: 16 }}>+ New product</button>

  return (
    <div style={{ marginTop: 16, background: '#fff', border: LINE, borderRadius: 12, padding: 14, display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
      <input style={input} placeholder="id (e.g. prod_fortiflora_001)" value={f.id} onChange={(e) => set('id', e.target.value)} />
      <input style={input} placeholder="name" value={f.name} onChange={(e) => set('name', e.target.value)} />
      <input style={input} placeholder="brand" value={f.brand} onChange={(e) => set('brand', e.target.value)} />
      <input style={input} placeholder="category (e.g. supplement)" value={f.category} onChange={(e) => set('category', e.target.value)} />
      <select style={input} value={f.safety_class} onChange={(e) => set('safety_class', e.target.value)}>
        {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input style={input} placeholder="image_url" value={f.image_url} onChange={(e) => set('image_url', e.target.value)} />
      <textarea style={{ ...input, gridColumn: '1 / -1', minHeight: 54 }} placeholder="description (vet-validated copy)" value={f.description} onChange={(e) => set('description', e.target.value)} />
      <textarea
        style={{ ...input, gridColumn: '1 / -1', minHeight: 44 }}
        placeholder={f.safety_class === 'explain_only' ? 'vet_note (REQUIRED for explain_only)' : 'vet_note (only used for explain_only)'}
        value={f.vet_note} onChange={(e) => set('vet_note', e.target.value)}
      />
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={!f.id.trim() || !f.name.trim()} style={{ ...btn(PERI), opacity: f.id.trim() && f.name.trim() ? 1 : 0.5 }}>Create (hidden)</button>
        <button onClick={() => setOpen(false)} style={btn(MUTED)}>Cancel</button>
      </div>
    </div>
  )
}

function NewOffer({ productId, onDone, onError }: { productId: string; onDone: () => void; onError: (e: unknown) => void }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ id: '', merchant: 'chewy', affiliate_url: '', merchant_product_url: '', display_priority: '1' })
  const set = (k: string, v: string) => setF({ ...f, [k]: v })

  const save = () => {
    api.adminCreateOffer({
      // Suffix keeps auto-ids unique when a product has >1 offer for the same
      // merchant (a bare `offer_<merchant>_<product>` would collide on the PK).
      id: f.id.trim() || `offer_${f.merchant}_${productId}_${Math.random().toString(36).slice(2, 7)}`,
      product_id: productId,
      merchant: f.merchant,
      affiliate_url: f.affiliate_url.trim() || null,
      merchant_product_url: f.merchant_product_url.trim() || null,
      display_priority: Number(f.display_priority) || 100,
      is_active: true,
    }).then(() => { setF({ id: '', merchant: 'chewy', affiliate_url: '', merchant_product_url: '', display_priority: '1' }); setOpen(false); onDone() })
      .catch(onError)
  }

  if (!open) return <button onClick={() => setOpen(true)} style={{ ...btn(PERI), marginTop: 8, padding: '6px 10px' }}>+ Add link</button>

  return (
    <div style={{ marginTop: 10, display: 'grid', gap: 8, gridTemplateColumns: '120px 90px 1fr 1fr auto' }}>
      <select style={input} value={f.merchant} onChange={(e) => set('merchant', e.target.value)}>
        {MERCHANTS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <input style={input} placeholder="sort" value={f.display_priority} onChange={(e) => set('display_priority', e.target.value)} />
      <input style={input} placeholder="affiliate_url (tracked)" value={f.affiliate_url} onChange={(e) => set('affiliate_url', e.target.value)} />
      <input style={input} placeholder="merchant_product_url (fallback)" value={f.merchant_product_url} onChange={(e) => set('merchant_product_url', e.target.value)} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={save} style={btn(PERI)}>Save</button>
        <button onClick={() => setOpen(false)} style={btn(MUTED)}>✕</button>
      </div>
    </div>
  )
}

const sectionH: React.CSSProperties = {
  fontFamily: "'Instrument Serif',serif", fontSize: 19, color: INK, margin: '26px 0 12px',
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.05em', color, background: `${color}18`, borderRadius: 6, padding: '2px 7px', fontWeight: 600 }}>
      {text}
    </span>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#F5F5F8', padding: '32px 28px 60px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>{children}</div>
    </div>
  )
}
