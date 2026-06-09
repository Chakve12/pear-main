import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore'
import { db, isConfigured } from './firebaseConfig'
import { useUserStore } from '../store/useUserStore'

const STORE_KEY = 'pear-elite-store-v2'

const COLLECTION = 'models'

export async function fetchAllModels() {
  if (!isConfigured || !db) return null
  const snap = await getDocs(collection(db, COLLECTION))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function saveModel(model) {
  if (!isConfigured || !db) return
  await setDoc(
    doc(db, COLLECTION, model.id),
    {
      name: model.name,
      email: model.email,
      tagline: model.tagline || 'ელიტური მოდელი',
      avatar: model.avatar || null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  )
}

export async function saveModelAvatar(modelId, avatarUrl) {
  if (!isConfigured || !db) return
  await setDoc(
    doc(db, COLLECTION, modelId),
    { avatar: avatarUrl, updatedAt: new Date().toISOString() },
    { merge: true }
  )
}

export async function deleteModelFromFirestore(modelId) {
  if (!isConfigured || !db) return
  await deleteDoc(doc(db, COLLECTION, modelId))
}

function readLocalPersistedModels() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return useUserStore.getState().models
    const parsed = JSON.parse(raw)
    return parsed?.state?.models || useUserStore.getState().models
  } catch {
    return useUserStore.getState().models
  }
}

export function subscribeToModels(callback) {
  if (!isConfigured || !db) {
    callback(readLocalPersistedModels())
    const onStorage = (e) => {
      if (e.key === STORE_KEY) callback(readLocalPersistedModels())
    }
    window.addEventListener('storage', onStorage)
    const interval = setInterval(() => callback(readLocalPersistedModels()), 2000)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(interval)
    }
  }

  return onSnapshot(
    collection(db, COLLECTION),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    },
    () => callback([])
  )
}
