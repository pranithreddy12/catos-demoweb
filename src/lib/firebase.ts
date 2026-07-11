// Firebase web SDK init. All config comes from VITE_FIREBASE_* env vars
// (frontend/.env, gitignored) — never hardcoded. initializeApp tolerates
// placeholder values at build time; only live auth calls need real config.
import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
// Keep the session across reloads; getIdToken() then auto-refreshes silently.
setPersistence(auth, browserLocalPersistence).catch(() => {})
