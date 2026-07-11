import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, AdminOverview, AdminCatDetail } from '../api'

const INK = '#1A1B2E'
const MUTED = '#757896'
const PERI = '#6B6BD6'
const GREEN = '#4B5F42'
const TERRA = '#B8693A'
const CARD = '#fff'
const BORDER = '1px solid rgba(26,27,46,.08)'

// friendly cluster labels
const CLUSTER_LABEL: Record<string, string> = {
  CKD_EARLY: 'Early renal', URINARY_SYNDROME: 'Urinary', HYPERTHYROID: 'Thyroid',
  DIABETES_MELLITUS: 'Diabetes screen', HYPERTENSION: 'Hypertension', DKA: 'DKA',
}
const label = (k: string) => CLUSTER_LABEL[k] || k.replace(/_/g, ' ').toLowerCase()
const num = (n?: number) => (n == null ? '—' : n.toLocaleString())

export default function Admin() {
  const nav = useNavigate()
  const [data, setData] = useState<AdminOverview | null>(null)
  const [err, setErr] = useState<'forbidden' | 'error' | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)   // cat id with an action in flight
  const [toast, setToast] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminCatDetail | null>(null)
  const [confirmDel, setConfirmDel] = useState<{ id: string; name: string } | null>(null)

  const load = () => {
    setLoading(true)
    api.adminOverview()
      .then((d) => { setData(d); setErr(null) })
      .catch((e: Error) => setErr(/403/.test(e.message) ? 'forbidden' : 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500) }
  const viewCat = (id: string) => { setDetail(null); setBusy(id); api.adminCatDetail(id).then(setDetail).catch(() => flash('Could not load cat detail')).finally(() => setBusy(null)) }
  const refreshCat = (id: string) => { setBusy(id); api.adminRefreshCat(id).then((r) => { flash(`${r.cat}: ${r.narrative_state}${r.active_clusters.length ? ' · ' + r.active_clusters.join(', ') : ''}`); load() }).catch(() => flash('Refresh failed')).finally(() => setBusy(null)) }
  const deleteCat = (id: string) => { setBusy(id); api.adminDeleteCat(id).then((r) => { flash(`Deleted ${r.deleted}`); setConfirmDel(null); load() }).catch(() => flash('Delete failed')).finally(() => setBusy(null)) }

  if (loading) return <Center>Loading dashboard…</Center>
  if (err === 'forbidden') return <Center>You don’t have admin access. <A onClick={() => nav('/')}>Back to app</A></Center>
  if (err || !data) return <Center>Couldn’t load the dashboard. <A onClick={load}>Retry</A></Center>

  const t = data.totals, g = data.growth_7d, ref = data.reference, sys = data.system
  const analysedPct = t.reports ? Math.round((t.reports_analyzed / t.reports) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#F4F5FA', color: INK, fontFamily: "'Manrope',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 32, letterSpacing: '-.02em' }}>LunaCat — Admin</h1>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: sys.environment === 'production' ? TERRA : PERI, background: sys.environment === 'production' ? 'rgba(184,105,58,.12)' : 'rgba(107,107,214,.12)', padding: '3px 8px', borderRadius: 999 }}>{sys.environment}</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: MUTED }}>Platform overview · generated {new Date(data.generated_at).toLocaleString()}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={load}>↻ Refresh</Btn>
            <Btn onClick={() => nav('/')} primary>← Back to app</Btn>
          </div>
        </div>

        {/* headline metrics */}
        <Grid min={160} mt={20}>
          <Metric k="Owners" v={num(t.owners)} sub={`+${num(g.new_owners)} this week`} />
          <Metric k="Cats" v={num(t.cats)} sub={`+${num(g.new_cats)} this week`} />
          <Metric k="Cats with active patterns" v={num(data.clusters.active_cats)} sub={`${num(data.clusters.validated)} cluster sign-offs`} tone={data.clusters.active_cats ? 'warn' : 'ok'} />
          <Metric k="Reports uploaded" v={num(t.reports)} sub={`${num(t.reports_analyzed)} analysed (${analysedPct}%)`} />
          <Metric k="Check-ins" v={num(t.checkins)} sub={`+${num(g.checkins)} this week`} />
        </Grid>

        {/* two columns: clusters + logging volume */}
        <TwoCol mt={16}>
          <Card title="Active health patterns">
            {data.clusters.by_type.length === 0 ? <Empty>No active patterns across the platform.</Empty> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.clusters.by_type.map((c) => <Bar key={c.cluster_key} label={label(c.cluster_key)} n={c.n} max={data.clusters.by_type[0].n} />)}
              </div>
            )}
            {data.clusters.by_urgency.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {data.clusters.by_urgency.map((u) => (
                  <span key={u.urgency} style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 999, background: u.urgency === 'acute' || u.urgency === 'urgent' ? 'rgba(184,105,58,.12)' : 'rgba(117,120,150,.1)', color: u.urgency === 'acute' || u.urgency === 'urgent' ? TERRA : MUTED }}>{u.urgency}: {u.n}</span>
                ))}
              </div>
            )}
          </Card>

          <Card title="Logging volume">
            <KV k="Weight readings" v={num(t.weight_logs)} />
            <KV k="Check-ins" v={num(t.checkins)} />
            <KV k="Food logs" v={num(t.food_logs)} />
            <KV k="Litter events" v={num(t.litter_events)} />
            <KV k="Medications" v={num(t.medications)} />
            <KV k="Vaccinations" v={num(t.vaccinations)} />
            <KV k="Vet visits" v={num(t.vet_visits)} last />
          </Card>
        </TwoCol>

        {/* reports by kind + reference data */}
        <TwoCol mt={16}>
          <Card title="Reports by kind">
            {data.reports_by_kind.length === 0 ? <Empty>No reports uploaded yet.</Empty> : data.reports_by_kind.map((r, i, a) => <KV key={r.kind} k={r.kind} v={num(r.n)} last={i === a.length - 1} />)}
          </Card>
          <Card title="Reference / clinical data">
            <KV k="Food products" v={num(ref.food_products)} />
            <KV k="— with nutrients" v={num(ref.food_with_nutrients)} />
            <KV k="Breeds" v={num(ref.breeds)} />
            <KV k="Breed predispositions" v={num(ref.breed_predispositions)} />
            <KV k="Research conditions" v={num(ref.research_conditions)} />
            <KV k="Nutrition rules" v={num(ref.nutrition_rules)} />
            <KV k="Vaccine reference" v={num(ref.vaccine_reference)} />
            <KV k="Medication reference" v={num(ref.medication_reference)} last />
          </Card>
        </TwoCol>

        {/* system status */}
        <Card title="System" mt={16}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Status ok={sys.ollama_healthy} label={`LLM (Ollama) · ${sys.ollama_model}`} />
            <Status ok label={`Threshold ${sys.threshold_version}`} />
            <Status ok={sys.environment !== 'production' || true} label={`Environment: ${sys.environment}`} />
          </div>
        </Card>

        {/* cats table */}
        <Card title={`Cats (${data.cats.length})`} mt={16}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  <Th>Name</Th><Th>Breed</Th><Th>Sex</Th><Th>Owner</Th><Th>On record</Th><Th>Active patterns</Th><Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {data.cats.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid rgba(26,27,46,.06)' }}>
                    <Td bold>{c.name}</Td>
                    <Td>{c.breed || '—'}</Td>
                    <Td>{c.sex || '—'}</Td>
                    <Td mut>{c.owner || '—'}</Td>
                    <Td mut>{c.since || '—'}</Td>
                    <Td><span style={{ color: c.active_clusters ? TERRA : GREEN, fontWeight: 600 }}>{c.active_clusters || '0'}</span></Td>
                    <Td>
                      <span style={{ display: 'inline-flex', gap: 6, whiteSpace: 'nowrap' }}>
                        <RowBtn onClick={() => viewCat(c.id)} disabled={busy === c.id}>View</RowBtn>
                        <RowBtn onClick={() => refreshCat(c.id)} disabled={busy === c.id}>{busy === c.id ? '…' : 'Re-run'}</RowBtn>
                        <RowBtn onClick={() => setConfirmDel({ id: c.id, name: c.name })} disabled={busy === c.id} danger>Delete</RowBtn>
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', background: INK, color: '#fff', padding: '11px 18px', borderRadius: 12, fontSize: 13.5, boxShadow: '0 8px 30px rgba(0,0,0,.25)', zIndex: 90, maxWidth: '90vw' }}>{toast}</div>
      )}

      {detail && <CatDetailModal d={detail} onClose={() => setDetail(null)} />}

      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)}>
          <h3 style={{ margin: 0, fontFamily: "'Instrument Serif',serif", fontSize: 22 }}>Delete {confirmDel.name}?</h3>
          <p style={{ fontSize: 13.5, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>This permanently removes {confirmDel.name} and <b>all</b> their logs, reports, and records. This cannot be undone.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setConfirmDel(null)}>Cancel</Btn>
            <button onClick={() => deleteCat(confirmDel.id)} disabled={busy === confirmDel.id} style={{ border: 0, background: TERRA, color: '#fff', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: busy === confirmDel.id ? 0.6 : 1 }}>{busy === confirmDel.id ? 'Deleting…' : 'Delete permanently'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function CatDetailModal({ d, onClose }: { d: AdminCatDetail; onClose: () => void }) {
  const c = d.cat
  return (
    <Modal onClose={onClose} wide>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: "'Instrument Serif',serif", fontSize: 24 }}>{c.name}</h3>
          <p style={{ fontSize: 12.5, color: MUTED, margin: '3px 0 0' }}>{[c.breed, c.sex, c.owner].filter(Boolean).join(' · ')}</p>
        </div>
        <Btn onClick={onClose}>Close</Btn>
      </div>
      <Grid min={120} mt={16}>
        {Object.entries(d.counts).map(([k, v]) => (
          <div key={k} style={{ background: '#F7F7FB', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em', color: MUTED }}>{k.replace(/_/g, ' ')}</div>
            <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>{v == null ? '—' : v}</div>
          </div>
        ))}
      </Grid>
      <div style={{ marginTop: 16, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: MUTED }}>Active clusters</div>
      {d.active_clusters.length === 0 ? <p style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>None active.</p> : (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {d.active_clusters.map((cl, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(26,27,46,.05)' }}>
              <span style={{ textTransform: 'capitalize' }}>{label(cl.cluster_key)}</span>
              <span style={{ color: cl.urgency_level === 'acute' || cl.urgency_level === 'urgent' ? TERRA : MUTED }}>{cl.activation_level}{cl.urgency_level ? ` · ${cl.urgency_level}` : ''} · {cl.signals_count} signals</span>
            </div>
          ))}
        </div>
      )}
      {d.latest_weight && <p style={{ fontSize: 12.5, color: MUTED, marginTop: 14 }}>Latest weight: <b style={{ color: INK }}>{d.latest_weight.weight_kg} kg</b> ({d.latest_weight.on})</p>}
    </Modal>
  )
}

function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,45,.4)', display: 'grid', placeItems: 'center', zIndex: 95, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: 22, width: '100%', maxWidth: wide ? 560 : 420, maxHeight: '86vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>{children}</div>
    </div>
  )
}
function RowBtn({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{ border: BORDER, background: '#fff', color: danger ? TERRA : INK, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 }}>{children}</button>
}

/* ---- little UI primitives ---- */
function Center({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F4F5FA', color: MUTED, fontFamily: "'Manrope',system-ui", fontSize: 15, gap: 8, padding: 24, textAlign: 'center' }}>{children}</div>
}
function A({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} style={{ background: 'none', border: 0, color: PERI, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>{children}</button>
}
function Btn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return <button onClick={onClick} style={{ border: primary ? 0 : BORDER, background: primary ? INK : CARD, color: primary ? '#fff' : INK, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{children}</button>
}
function Grid({ children, min, mt }: { children: React.ReactNode; min: number; mt?: number }) {
  return <div style={{ marginTop: mt, display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 12 }}>{children}</div>
}
function TwoCol({ children, mt }: { children: React.ReactNode; mt?: number }) {
  return <div style={{ marginTop: mt, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>{children}</div>
}
function Metric({ k, v, sub, tone }: { k: string; v: string; sub?: string; tone?: 'ok' | 'warn' }) {
  return (
    <div style={{ background: CARD, border: BORDER, borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: MUTED }}>{k}</div>
      <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 34, lineHeight: 1.05, marginTop: 6, color: tone === 'warn' ? TERRA : INK }}>{v}</div>
      {sub && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
function Card({ title, children, mt }: { title: string; children: React.ReactNode; mt?: number }) {
  return (
    <div style={{ marginTop: mt, background: CARD, border: BORDER, borderRadius: 16, padding: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: MUTED, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}
function KV({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: last ? 'none' : '1px solid rgba(26,27,46,.05)' }}><span style={{ fontSize: 13, color: MUTED }}>{k}</span><span style={{ fontSize: 14, fontWeight: 600 }}>{v}</span></div>
}
function Bar({ label, n, max }: { label: string; n: number; max: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 3 }}><span style={{ textTransform: 'capitalize' }}>{label}</span><span style={{ fontWeight: 600 }}>{n}</span></div>
      <div style={{ height: 7, borderRadius: 4, background: '#EEEFF6', overflow: 'hidden' }}><div style={{ width: `${Math.max(6, (n / (max || 1)) * 100)}%`, height: '100%', background: PERI, borderRadius: 4 }} /></div>
    </div>
  )
}
function Status({ ok, label }: { ok: boolean; label: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: ok ? '#4F9D69' : TERRA }} />{label}{!ok && <span style={{ color: TERRA, fontSize: 11 }}>(down)</span>}</span>
}
function Empty({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 13, color: MUTED, padding: '6px 0' }}>{children}</div> }
function Th({ children }: { children: React.ReactNode }) { return <th style={{ padding: '6px 10px 6px 0', fontWeight: 700 }}>{children}</th> }
function Td({ children, bold, mut }: { children: React.ReactNode; bold?: boolean; mut?: boolean }) { return <td style={{ padding: '9px 10px 9px 0', fontWeight: bold ? 600 : 400, color: mut ? MUTED : INK }}>{children}</td> }
