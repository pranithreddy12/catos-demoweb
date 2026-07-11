import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, AppNotification } from '../api'
import { fmtDate } from '../lib/passport'

const CREAM = '#FAF7F1'
const INK = '#1A1B2E'
const MUTED = '#757896'
const PERI = '#6B6BD6'
const SAGE = '#4B5F42'
const AMBER = '#9A5A2A'
const TERRA = '#B8693A'
const SH = '0 1px 2px rgba(26,27,46,.04),0 4px 12px rgba(26,27,46,.04)'

const sevColor = (s?: string | null) => (s === 'significant' ? TERRA : s === 'moderate' ? AMBER : PERI)

function relTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(iso)
}

export default function Notifications() {
  const nav = useNavigate()
  const [items, setItems] = useState<AppNotification[] | null>(null)
  const [error, setError] = useState(false)

  const load = () => {
    api.notifications()
      .then(setItems)
      .catch(() => setError(true))
  }
  useEffect(load, [])

  const markRead = (n: AppNotification) => {
    if (n.read) return
    setItems((cur) => cur?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? cur)
    api.markNotificationRead(n.id).catch(() => {})
  }
  const markAll = () => {
    setItems((cur) => cur?.map((x) => ({ ...x, read: true })) ?? cur)
    api.markAllNotificationsRead().catch(() => {})
  }

  const unread = items?.filter((n) => !n.read).length ?? 0

  return (
    <div style={{ minHeight: '100%', background: CREAM, padding: '52px 16px 120px' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 6px' }}>
        <button onClick={() => nav(-1)} style={{ border: 0, background: 'transparent', color: MUTED, fontSize: 13, cursor: 'pointer', padding: '4px 0' }}>‹ Back</button>
        {unread > 0 && (
          <button onClick={markAll} style={{ border: 0, background: 'transparent', color: PERI, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Mark all read</button>
        )}
      </div>
      <h1 style={{ margin: '2px 4px 0', fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 32, letterSpacing: '-.02em', color: INK }}>Notifications</h1>
      <p style={{ margin: '4px 4px 0', fontSize: 12.5, color: MUTED }}>
        {unread > 0 ? `${unread} unread · calm notes, never alarms` : 'Calm notes, never alarms'}
      </p>

      {/* list */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items === null && !error && <p style={{ textAlign: 'center', padding: '20px 0', color: MUTED, fontSize: 13 }}>Loading…</p>}
        {error && <p style={{ textAlign: 'center', padding: '20px 0', color: MUTED, fontSize: 13 }}>Couldn’t load notifications.</p>}
        {items && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: MUTED }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>☾</div>
            <div style={{ fontSize: 14, color: INK, fontFamily: "'Instrument Serif',serif" }}>You’re all caught up.</div>
            <div style={{ fontSize: 12.5, marginTop: 4 }}>We’ll only reach out when something’s worth a gentle look.</div>
          </div>
        )}
        {items?.map((n) => {
          const c = sevColor(n.severity)
          return (
            <button key={n.id} onClick={() => markRead(n)} style={{
              textAlign: 'left', border: 0, cursor: n.read ? 'default' : 'pointer', width: '100%',
              background: n.read ? '#fff' : '#FFFFFF', borderRadius: 16, boxShadow: SH, padding: 14,
              borderLeft: `3px solid ${n.read ? 'transparent' : c}`, opacity: n.read ? 0.72 : 1,
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ width: 34, height: 34, flex: 'none', borderRadius: 10, background: `${c}1f`, color: c, display: 'grid', placeItems: 'center' }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" /><path d="M10 21h4" /></svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.3 }}>{n.title}</span>
                  <span style={{ fontSize: 10.5, color: '#A6A8BC', flex: 'none' }}>{relTime(n.created_at)}</span>
                </div>
                {n.body && <div style={{ fontSize: 12.5, color: MUTED, marginTop: 3, lineHeight: 1.5 }}>{n.body}</div>}
                {n.normalisation_text && <div style={{ fontSize: 11.5, color: SAGE, marginTop: 6, lineHeight: 1.45 }}>{n.normalisation_text}</div>}
                {!n.read && <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: c }}>New · tap to dismiss</span>}
              </div>
            </button>
          )
        })}
      </div>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 10.5, color: '#9498B0' }}>Observational only · always consult your vet.</p>
    </div>
  )
}
