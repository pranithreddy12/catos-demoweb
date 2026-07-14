// Firebase web SDK init. All config comes from VITE_FIREBASE_* env vars
// (frontend/.env, gitignored) — never hardcoded. initializeApp tolerates
// placeholder values at build time; only live auth calls need real config.
import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth'
import { DEMO } from './demoData'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
}

// Only initialise Firebase when it's actually usable. The showcase (DEMO) build
// ships with no Firebase project, and calling getAuth() with an empty apiKey
// throws auth/invalid-api-key at module load — which blanks the entire app before
// React mounts. Demo bypasses auth anyway, so skip it (and skip when no key set).
const firebaseActive = !DEMO && !!firebaseConfig.apiKey

export const firebaseApp = firebaseActive ? initializeApp(firebaseConfig) : null
export const auth = firebaseActive ? getAuth(firebaseApp!) : ({} as Auth)
// Keep the session across reloads; getIdToken() then auto-refreshes silently.
if (firebaseActive) setPersistence(auth, browserLocalPersistence).catch(() => {})
