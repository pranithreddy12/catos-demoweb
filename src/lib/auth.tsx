// Auth provider over Firebase email/password. Exposes the current user + sign
// in/up/out, and registers the api Bearer-token + 401 hooks. getIdToken() handles
// silent token refresh; a 401 from the backend signs the user out, and the route
// gate in App.tsx then sends them to /signin.
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'
import { setAuthHooks } from '../api'
import { DEMO } from './demoData'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setAuthHooks({
      getToken: async () => (DEMO ? null : auth.currentUser ? auth.currentUser.getIdToken() : null),
      // On a backend 401, drop the session; onAuthStateChanged flips user->null
      // and the route gate redirects to /signin.
      onUnauthorized: () => { if (!DEMO) fbSignOut(auth).catch(() => {}) },
    })
    // Showcase build: skip Firebase entirely and present a signed-in guest so the
    // app renders off the sample data (see demoData.ts). No real auth involved.
    if (DEMO) {
      setUser({ uid: 'demo', email: 'demo@lunacat.app', displayName: 'Showcase Guardian' } as unknown as User)
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const value: AuthState = {
    user,
    loading,
    signIn: async (email, password) => { await signInWithEmailAndPassword(auth, email, password) },
    signUp: async (email, password) => { await createUserWithEmailAndPassword(auth, email, password) },
    signOut: async () => { await fbSignOut(auth) },
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
