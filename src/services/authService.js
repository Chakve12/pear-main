import { supabase, createEphemeralClient } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { getUserProfile } from './userProfile'
import {
  localSignIn,
  localAdminCreateUser,
  localLogOut,
  subscribeLocalAuth,
  getLocalCustomUsers,
} from './localAuth'

export function isUsingLocalAuth() {
  return !isConfigured || !supabase
}

function mapAuthError(error) {
  const raw = error?.message || error?.error || error || 'Auth error'
  const err = new Error(typeof raw === 'string' ? raw : 'Auth error')
  const msg = String(raw).toLowerCase()
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    err.code = 'auth/invalid-credential'
  }
  if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already been registered')) {
    err.code = 'auth/email-already-in-use'
  }
  if (msg.includes('rate limit') || msg.includes('email rate')) {
    err.code = 'auth/email-rate-limit'
    err.message =
      'Supabase-ის ელფოსტის ლიმიტი გადაჭარბებულია. გაუშვი Edge Function: npx supabase functions deploy create-user'
  }
  return err
}

async function createUserViaEdgeFunction({
  email,
  password,
  displayName,
  role,
  modelId,
}) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { email, password, displayName, role, modelId },
  })

  if (error) throw mapAuthError(error)
  if (data?.error) throw mapAuthError(data.error)
  if (!data?.user?.id) throw new Error('ანგარიშის შექმნა ვერ მოხერხდა')

  return data.user
}

async function createUserViaSignUp({
  email,
  password,
  displayName,
  role,
  modelId,
}) {
  const ephemeral = createEphemeralClient()
  const { data, error } = await ephemeral.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        role,
        model_id: modelId,
      },
    },
  })

  if (error) throw mapAuthError(error)
  if (!data.user) throw new Error('ანგარიშის შექმნა ვერ მოხერხდა')
  return data.user
}

export async function adminCreateUser({ email, password, displayName, role = 'model', modelId }) {
  if (isUsingLocalAuth()) {
    return localAdminCreateUser({ email, password, displayName, role, modelId })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const resolvedDisplayName = displayName || normalizedEmail.split('@')[0]
  const resolvedModelId =
    role === 'admin' || role === 'head_admin' ? null : modelId || normalizedEmail.split('@')[0]

  let createdUser
  try {
    createdUser = await createUserViaEdgeFunction({
      email: normalizedEmail,
      password,
      displayName: resolvedDisplayName,
      role,
      modelId: resolvedModelId,
    })
  } catch (edgeError) {
    const shouldFallback =
      edgeError.code !== 'auth/email-already-in-use' &&
      edgeError.code !== 'auth/email-rate-limit' &&
      (edgeError.message?.includes('Function') ||
        edgeError.message?.includes('404') ||
        edgeError.message?.includes('not found') ||
        edgeError.message?.includes('Failed to send'))

    if (!shouldFallback) throw edgeError
    createdUser = await createUserViaSignUp({
      email: normalizedEmail,
      password,
      displayName: resolvedDisplayName,
      role,
      modelId: resolvedModelId,
    })
  }

  return {
    uid: createdUser.id,
    email: normalizedEmail,
    displayName: resolvedDisplayName,
    role,
    modelId: resolvedModelId,
  }
}

export async function signIn(email, password) {
  if (isUsingLocalAuth()) {
    return localSignIn(email, password)
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) throw mapAuthError(error)
  return getUserProfile(data.user)
}

export async function logOut() {
  if (isUsingLocalAuth()) {
    return localLogOut()
  }
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function migrateLocalUsersToCloud() {
  if (isUsingLocalAuth()) {
    throw new Error('ჯერ Supabase დააყენე (.env ფაილში VITE_SUPABASE_URL და VITE_SUPABASE_ANON_KEY)')
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

  let active = true

  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!active) return
    if (!session?.user) {
      callback(null)
      return
    }
    try {
      callback(await getUserProfile(session.user))
    } catch {
      callback(null)
    }
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!active) return
    if (!session?.user) {
      callback(null)
      return
    }
    try {
      callback(await getUserProfile(session.user))
    } catch {
      callback({
        uid: session.user.id,
        email: session.user.email,
        displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
        role: 'model',
        modelId: session.user.email?.split('@')[0],
      })
    }
  })

  return () => {
    active = false
    subscription.unsubscribe()
  }
}
