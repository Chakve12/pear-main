export const DEFAULT_USERS = {
  'admin@pear.elite': {
    password: 'PearElite2024!',
    role: 'head_admin',
    displayName: 'Luka',
    modelId: null,
  },
}

let customUsers = {}
let sessionProfile = null

function loadUsers() {
  return { ...DEFAULT_USERS, ...customUsers }
}

function saveUsers(users) {
  customUsers = {}
  for (const [email, data] of Object.entries(users)) {
    if (!DEFAULT_USERS[email]) customUsers[email] = data
  }
}

function getSession() {
  return sessionProfile
}

function setSession(profile) {
  sessionProfile = profile
}

function clearSession() {
  sessionProfile = null
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
  return { ...customUsers }
}

export function hasLocalCustomUsers() {
  return Object.keys(customUsers).length > 0
}

export function getLocalCustomUserCount() {
  return Object.keys(customUsers).length
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
