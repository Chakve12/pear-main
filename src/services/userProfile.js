import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, isConfigured } from './firebaseConfig'
import { normalizeRole, ROLES } from '../utils/roles'

const ADMIN_EMAIL = 'admin@pear.elite'

export async function getUserProfile(firebaseUser) {
  if (!firebaseUser) return null

  const email = firebaseUser.email?.toLowerCase() || ''
  const isHeadAdminEmail = email === ADMIN_EMAIL

  if (!isConfigured || !db) {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: isHeadAdminEmail ? 'უფროსი ადმინისტრატორი' : firebaseUser.displayName || email.split('@')[0],
      role: isHeadAdminEmail ? ROLES.HEAD_ADMIN : ROLES.MODEL,
      modelId: isHeadAdminEmail ? null : email.split('@')[0],
      avatar: null,
    }
  }

  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    const data = snap.data()
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: data.displayName || firebaseUser.displayName,
      role: normalizeRole(data.role, email),
      modelId: data.modelId || null,
      avatar: data.avatar || null,
    }
  }

  const profile = {
    email,
    displayName: isHeadAdminEmail ? 'უფროსი ადმინისტრატორი' : firebaseUser.displayName || email.split('@')[0],
    role: isHeadAdminEmail ? ROLES.HEAD_ADMIN : ROLES.MODEL,
    modelId: isHeadAdminEmail ? null : email.split('@')[0],
    createdAt: new Date().toISOString(),
  }

  await setDoc(ref, profile)
  return { uid: firebaseUser.uid, ...profile }
}

export async function createUserProfile(uid, { email, displayName, role = 'model', modelId }) {
  if (!isConfigured || !db) return

  await setDoc(doc(db, 'users', uid), {
    email: email.toLowerCase(),
    displayName,
    role,
    modelId: role === 'admin' || role === 'head_admin' ? null : modelId || email.split('@')[0],
    avatar: null,
    createdAt: new Date().toISOString(),
  })
}

export async function saveUserAvatar(uid, avatarUrl) {
  if (!isConfigured || !db) return
  await setDoc(
    doc(db, 'users', uid),
    { avatar: avatarUrl, updatedAt: new Date().toISOString() },
    { merge: true }
  )
}
