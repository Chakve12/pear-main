import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getFirestore } from 'firebase/firestore'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const isPlaceholder = (v) =>
  !v ||
  v === 'undefined' ||
  String(v).trim() === '' ||
  String(v).startsWith('your_')

const isConfigured = Object.values(firebaseConfig).every((v) => !isPlaceholder(v))

let app = null
let auth = null
let storage = null
let db = null

if (isConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  storage = getStorage(app)
  db = getFirestore(app)
}

export { app, auth, storage, db, isConfigured }
