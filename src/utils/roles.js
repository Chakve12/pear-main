export const ROLES = {
  MODEL: 'model',
  ADMIN: 'admin',
  HEAD_ADMIN: 'head_admin',
}

export function isAdminRole(role) {
  return role === ROLES.ADMIN || role === ROLES.HEAD_ADMIN
}

export function isHeadAdmin(role) {
  return role === ROLES.HEAD_ADMIN
}

export function isAdminBadgeRole(role) {
  return role === ROLES.ADMIN || role === ROLES.HEAD_ADMIN
}

export function roleLabel(role) {
  if (role === ROLES.HEAD_ADMIN) return 'უფროსი ადმინი'
  if (role === ROLES.ADMIN) return 'ადმინი'
  return 'მოდელი'
}

export function normalizeRole(role, email) {
  const normalized = role || ROLES.MODEL
  if (email?.toLowerCase() === 'admin@pear.elite' && normalized === ROLES.ADMIN) {
    return ROLES.HEAD_ADMIN
  }
  return normalized
}
