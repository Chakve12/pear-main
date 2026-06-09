import { collection, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db, isConfigured } from './firebaseConfig'
import { isHeadAdmin, normalizeRole } from '../utils/roles'
import { getLocalUserProfiles, localDeleteAdminUser } from './localAuth'

const LOCAL_USERS_KEY = 'pear_local_users'

export function subscribeToUserProfiles(callback) {
  if (!isConfigured || !db) {
    callback(getLocalUserProfiles())
    const onStorage = (e) => {
      if (e.key === LOCAL_USERS_KEY) callback(getLocalUserProfiles())
    }
    window.addEventListener('storage', onStorage)
    const interval = setInterval(() => callback(getLocalUserProfiles()), 2000)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(interval)
    }
  }

  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      const profiles = {}
      snap.docs.forEach((d) => {
        const data = d.data()
        profiles[d.id] = {
          uid: d.id,
          displayName: data.displayName || '',
          email: data.email || '',
          role: normalizeRole(data.role, data.email),
          modelId: data.modelId || null,
          avatar: data.avatar || null,
        }
      })
      callback(profiles)
    },
    () => callback({})
  )
}

export async function deleteAdminAccount({ targetUid, requesterUid, requesterRole }) {
  if (!isHeadAdmin(requesterRole)) {
    throw new Error('მხოლოდ უფროს ადმინს შეუძლია ადმინის წაშლა')
  }
  if (targetUid === requesterUid) {
    throw new Error('საკუთარი ანგარიშის წაშლა შეუძლებელია')
  }

  if (!isConfigured || !db) {
    return localDeleteAdminUser(targetUid)
  }

  const ref = doc(db, 'users', targetUid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('ანგარიში ვერ მოიძებნა')

  const data = snap.data()
  const targetRole = normalizeRole(data.role, data.email)
  if (targetRole !== 'admin') {
    throw new Error('მხოლოდ ადმინის ანგარიშის წაშლა შეგიძლია')
  }

  await deleteDoc(ref)
}
