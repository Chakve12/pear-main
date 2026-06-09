import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db, isConfigured } from './firebaseConfig'

const COLLECTION = 'chatMessages'
const LOCAL_KEY = 'pear_chat_messages'
const MAX_MESSAGES = 200
const MAX_TEXT_LENGTH = 2000

const localListeners = new Set()

function getLocalMessages() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalMessages(messages) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)))
  localListeners.forEach((fn) => fn(getLocalMessages()))
}

export function subscribeToMessages(callback) {
  if (!isConfigured || !db) {
    callback(getLocalMessages())
    const interval = setInterval(() => callback(getLocalMessages()), 1500)
    const listener = (messages) => callback(messages)
    localListeners.add(listener)
    const onStorage = (e) => {
      if (e.key === LOCAL_KEY) callback(getLocalMessages())
    }
    window.addEventListener('storage', onStorage)
    return () => {
      clearInterval(interval)
      localListeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }

  const q = query(
    collection(db, COLLECTION),
    orderBy('createdAt', 'asc'),
    limit(MAX_MESSAGES)
  )

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      )
    },
    () => callback([])
  )
}

export async function sendMessage({
  text,
  senderUid,
  senderName,
  senderRole,
  senderAvatar = null,
  senderModelId = null,
  senderEmail = null,
}) {
  const trimmed = text.trim()
  if (!trimmed || !senderUid) return null
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new Error('შეტყობინება ძალიან გრძელია')
  }

  const message = {
    text: trimmed,
    senderUid,
    senderName: senderName || 'მომხმარებელი',
    senderRole:
      senderRole === 'head_admin' ? 'head_admin' : senderRole === 'admin' ? 'admin' : 'model',
    senderAvatar: senderAvatar || null,
    senderModelId: senderModelId || null,
    senderEmail: senderEmail || null,
    createdAt: new Date().toISOString(),
  }

  if (!isConfigured || !db) {
    const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const stored = [...getLocalMessages(), { id, ...message }]
    saveLocalMessages(stored)
    return { id, ...message }
  }

  const docRef = await addDoc(collection(db, COLLECTION), message)
  return { id: docRef.id, ...message }
}

export async function deleteMessage(messageId, requesterUid) {
  if (!messageId || !requesterUid) throw new Error('შეტყობინება ვერ მოიძებნა')

  if (!isConfigured || !db) {
    const messages = getLocalMessages()
    const target = messages.find((m) => m.id === messageId)
    if (!target) throw new Error('შეტყობინება ვერ მოიძებნა')
    if (target.senderUid !== requesterUid) {
      throw new Error('მხოლოდ საკუთარი შეტყობინების წაშლა შეგიძლია')
    }
    saveLocalMessages(messages.filter((m) => m.id !== messageId))
    return
  }

  await deleteDoc(doc(db, COLLECTION, messageId))
}

export async function deleteAllMessages() {
  if (!isConfigured || !db) {
    saveLocalMessages([])
    return
  }

  const snap = await getDocs(collection(db, COLLECTION))
  if (snap.empty) return

  const docs = snap.docs
  for (let i = 0; i < docs.length; i += 500) {
    const batch = writeBatch(db)
    docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
}
