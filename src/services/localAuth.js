const USERS_KEY = 'pear_local_users'
const SESSION_KEY = 'pear_local_session'

export const DEFAULT_USERS = {
  'admin@pear.elite': {
    password: 'PearElite2024!',
    role: 'head_admin',
    displayName: 'Luka',
    modelId: null,
  },
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw) return { ...DEFAULT_USERS, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_USERS }
}

function saveUsers(users) {
  const custom = {}
  for (const [email, data] of Object.entries(users)) {
    if (!DEFAULT_USERS[email]) custom[email] = data
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(custom))
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setSession(profile) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(profile))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export async function localSignIn(email, password) {
  const users = loadUsers()
  const key = email.toLowerCase().trim()
  const user = users[key]
  if (!user || user.password !== password) {
    const err = new Error('Invalid credentials')
    err.code = 'auth/invalid-credential'
    throw err
  }
  const profile = {
    uid: `local_${key}`,
    email: key,
    displayName: user.displayName,
    role: user.role,
    modelId: user.modelId,
  }
  setSession(profile)
  return profile
}

export async function localAdminCreateUser({ email, password, displayName, role = 'model', modelId }) {
  const users = loadUsers()
  const key = email.toLowerCase().trim()
  if (users[key]) {
    const err = new Error('Email exists')
    err.code = 'auth/email-already-in-use'
    throw err
  }
  users[key] = {
    password,
    displayName: displayName || email.split('@')[0],
    role,
    modelId: role === 'admin' || role === 'head_admin' ? null : modelId || email.split('@')[0],
  }
  saveUsers(users)
  return {
    uid: `local_${key}`,
    email: key,
    displayName: users[key].displayName,
    role: users[key].role,
    modelId: users[key].modelId,
  }
}

export async function localLogOut() {
  clearSession()
}

export function subscribeLocalAuth(callback) {
  callback(getSession())
  return () => {}
}

export function getLocalCustomUsers() {
  const users = loadUsers()
  const custom = {}
  for (const [email, data] of Object.entries(users)) {
    if (!DEFAULT_USERS[email]) custom[email] = data
  }
  return custom
}

export function hasLocalCustomUsers() {
  return Object.keys(getLocalCustomUsers()).length > 0
}

export function getLocalCustomUserCount() {
  return Object.keys(getLocalCustomUsers()).length
}

export function getLocalUserProfiles() {
  const users = loadUsers()
  const profiles = {}
  for (const [email, data] of Object.entries(users)) {
    profiles[`local_${email}`] = {
      uid: `local_${email}`,
      email,
      displayName: data.displayName || email.split('@')[0],
      role: data.role,
      modelId: data.modelId || null,
      avatar: data.avatar || null,
    }
  }
  return profiles
}

export function localDeleteAccount(uid) {
  if (!uid?.startsWith('local_')) throw new Error('ანგარიში ვერ მოიძებნა')
  const email = uid.slice('local_'.length)
  if (email === 'admin@pear.elite') {
    throw new Error('უფროს ადმინის ანგარიში ვერ წაიშლება')
  }

  const users = loadUsers()
  const account = users[email]
  if (!account) throw new Error('ანგარიში ვერ მოიძებნა')
  if (account.role === 'head_admin') {
    throw new Error('უფროს ადმინის ანგარიში ვერ წაიშლება')
  }
  if (DEFAULT_USERS[email]) {
    throw new Error('სისტემური ანგარიში ვერ წაიშლება')
  }

  delete users[email]
  saveUsers(users)
}

/** @deprecated use localDeleteAccount */
export const localDeleteAdminUser = localDeleteAccount
