import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, Passport } from '../api'

interface State {
  data: Passport | null
  loading: boolean
  error: string | null
  offline: boolean
  reload: () => void
  setActiveCat: (catId: string | null) => void
}

const ACTIVE_KEY = 'lunacat-cat-id'

const Ctx = createContext<State>({ data: null, loading: true, error: null, offline: false, reload: () => {}, setActiveCat: () => {} })

export function PassportProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Passport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [tick, setTick] = useState(0)

  const reload = () => setTick((t) => t + 1)
  const setActiveCat = (catId: string | null) => {
    try {
      if (catId) localStorage.setItem(ACTIVE_KEY, catId)
      else localStorage.removeItem(ACTIVE_KEY)
    } catch {
      /* ignore */
    }
    reload()
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    let activeId: string | null = null
    try {
      activeId = localStorage.getItem(ACTIVE_KEY)
    } catch {
      /* ignore */
    }
    if (!activeId) {
      // No cat selected -> nothing to load (the app routes a new user to onboarding).
      setData(null)
      setLoading(false)
      return
    }
    api.passportFor(activeId)
      .then((d) => { setData(d); setOffline(false) })
      .catch((e) => {
        // Active cat deleted (404): drop the stale pointer so the app returns to onboarding.
        if (String(e).includes('404')) {
          try { localStorage.removeItem(ACTIVE_KEY) } catch { /* ignore */ }
          setData(null)
        } else {
          setError('Could not load — please check your connection and try again.')
          setOffline(true)
        }
      })
      .finally(() => setLoading(false))
  }, [tick])

  return (
    <Ctx.Provider value={{ data, loading, error, offline, reload, setActiveCat }}>
      {children}
    </Ctx.Provider>
  )
}

export const usePassport = () => useContext(Ctx)

// --- shared formatting helpers ---
export function fmtDate(d?: string): string {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ageFrom(dob?: string): string {
  if (!dob) return '—'
  const d = new Date(dob)
  if (isNaN(d.getTime())) return '—'
  const now = new Date()
  let months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
  if (months < 0) months = 0
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m} mo`
  return m === 0 ? `${y} yr` : `${y} yr ${m} mo`
}
