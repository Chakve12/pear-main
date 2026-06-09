import { initializeApp, deleteApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  getAuth,
} from 'firebase/auth'
import { app, auth, isConfigured, firebaseConfig } from './firebaseConfig'
import { createUserProfile, getUserProfile } from './userProfile'
import {
  localSignIn,
  localAdminCreateUser,
  localLogOut,
  subscribeLocalAuth,
  getLocalCustomUsers,
} from './localAuth'

export function isUsingLocalAuth() {
  return !isConfigured || !auth
}

export function requireFirebase() {
  if (!isConfigured || !auth) {
    throw new Error('Firebase არ არის კონფიგურირებული. გამოიყენება ლოკალური რეჟიმი.')
  }
}

export async function adminCreateUser({ email, password, displayName, role = 'model', modelId }) {
  if (isUsingLocalAuth()) {
    return localAdminCreateUser({ email, password, displayName, role, modelId })
  }

  const secondaryApp = initializeApp(firebaseConfig, `AdminCreate_${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password)

    if (displayName) {
      await updateProfile(credential.user, { displayName })
    }

    await createUserProfile(credential.user.uid, {
      email,
      displayName: displayName || email.split('@')[0],
      role,
      modelId: role === 'admin' || role === 'head_admin' ? null : modelId || email.split('@')[0],
    })

    await signOut(secondaryAuth)
    return { uid: credential.user.uid, email, displayName, role, modelId }
  } finally {
    await deleteApp(secondaryApp)
  }
}

export async function signIn(email, password) {
  if (isUsingLocalAuth()) {
    return localSignIn(email, password)
  }

  const credential = await signInWithEmailAndPassword(auth, email, password)
  return getUserProfile(credential.user)
}

export async function logOut() {
  if (isUsingLocalAuth()) {
    return localLogOut()
  }
  if (!auth) return
  await signOut(auth)
}

export async function migrateLocalUsersToFirebase() {
  if (isUsingLocalAuth()) {
    throw new Error('ჯერ Firebase დააყენე (npm run setup:firebase)')
  }

  const users = getLocalCustomUsers()
  const results = []

  for (const [email, data] of Object.entries(users)) {
    try {
      await adminCreateUser({
        email,
        password: data.password,
        displayName: data.displayName,
        role: data.role,
        modelId: data.modelId,
      })
      results.push({ email, ok: true })
    } catch (err) {
      results.push({
        email,
        ok: false,
        error: err.code === 'auth/email-already-in-use' ? 'უკვე არსებობს' : err.message,
      })
    }
  }

  return results
}

export function subscribeToAuth(callback) {
  if (isUsingLocalAuth()) {
    return subscribeLocalAuth(callback)
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null)
      return
    }
    try {
      const profile = await getUserProfile(user)
      callback(profile)
    } catch {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'model',
        modelId: user.email?.split('@')[0],
      })
    }
  })
}
