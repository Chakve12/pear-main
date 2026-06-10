import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { normalizeRole, ROLES } from '../utils/roles'

const ADMIN_EMAIL = 'admin@pear.elite'

function rowToProfile(row, authUser) {
  return {
    uid: row.id,
    email: row.email || authUser?.email,
    displayName: row.display_name || authUser?.user_metadata?.display_name,
    role: normalizeRole(row.role, row.email || authUser?.email),
    modelId: row.model_id || null,
    avatar: row.avatar || null,
  }
}

export async function getUserProfile(authUser) {
  if (!authUser) return null

  const email = authUser.email?.toLowerCase() || ''
  const isHeadAdminEmail = email === ADMIN_EMAIL

  if (!isConfigured || !supabase) {
    return {
      uid: authUser.id,
      email: authUser.email,
      displayName: isHeadAdminEmail ? 'უფროსი ადმინისტრატორი' : authUser.user_metadata?.display_name || email.split('@')[0],
      role: isHeadAdminEmail ? ROLES.HEAD_ADMIN : ROLES.MODEL,
      modelId: isHeadAdminEmail ? null : email.split('@')[0],
      avatar: null,
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  if (error) throw error

  if (data) {
    return rowToProfile(data, authUser)
  }

  const profile = {
    id: authUser.id,
    email,
    display_name: isHeadAdminEmail ? 'უფროსი ადმინისტრატორი' : authUser.user_metadata?.display_name || email.split('@')[0],
    role: isHeadAdminEmail ? ROLES.HEAD_ADMIN : ROLES.MODEL,
    model_id: isHeadAdminEmail ? null : email.split('@')[0],
  }

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single()

  if (insertError) throw insertError
  return rowToProfile(created, authUser)
}

export async function createUserProfile(uid, { email, displayName, role = 'model', modelId }) {
  if (!isConfigured || !supabase) return

  await supabase.from('profiles').upsert({
    id: uid,
    email: email.toLowerCase(),
    display_name: displayName,
    role,
    model_id: role === 'admin' || role === 'head_admin' ? null : modelId || email.split('@')[0],
    avatar: null,
  })
}

export async function saveUserAvatar(uid, avatarUrl) {
  if (!isConfigured || !supabase) return
  await supabase
    .from('profiles')
    .update({ avatar: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', uid)
}
