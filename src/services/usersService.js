import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { isHeadAdmin, normalizeRole } from '../utils/roles'
import { getLocalUserProfiles, localDeleteAccount } from './localAuth'

function rowToProfile(row) {
  return {
    uid: row.id,
    displayName: row.display_name || '',
    email: row.email || '',
    role: normalizeRole(row.role, row.email),
    modelId: row.model_id || null,
    avatar: row.avatar || null,
  }
}

function rowsToProfilesMap(rows) {
  const profiles = {}
  for (const row of rows || []) {
    profiles[row.id] = rowToProfile(row)
  }
  return profiles
}

export async function fetchAllProfiles() {
  if (!isConfigured || !supabase) return null
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return rowsToProfilesMap(data)
}

export function subscribeToUserProfiles(callback) {
  if (!isConfigured || !supabase) {
    callback(getLocalUserProfiles())
    return () => {}
  }

  let active = true

  const refresh = async () => {
    try {
      const profiles = await fetchAllProfiles()
      if (active && profiles) callback(profiles)
    } catch {
      /* keep previous profiles on transient errors */
    }
  }

  refresh()

  const channel = supabase
    .channel('profiles-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refresh)
    .subscribe()

  const interval = setInterval(refresh, 10000)

  return () => {
    active = false
    clearInterval(interval)
    supabase.removeChannel(channel)
  }
}

export async function deleteAccount({ targetUid, requesterUid, requesterRole }) {
  if (!isHeadAdmin(requesterRole)) {
    throw new Error('მხოლოდ უფროს ადმინს შეუძლია ანგარიშის წაშლა')
  }
  if (targetUid === requesterUid) {
    throw new Error('საკუთარი ანგარიშის წაშლა შეუძლებელია')
  }

  if (!isConfigured || !supabase) {
    return localDeleteAccount(targetUid)
  }

  const { error: rpcError } = await supabase.rpc('delete_account', {
    target_user_id: targetUid,
  })

  if (!rpcError) return

  const rpcMissing =
    rpcError.code === 'PGRST202' ||
    rpcError.message?.includes('delete_account') ||
    rpcError.message?.includes('Could not find the function')

  if (rpcMissing) {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId: targetUid },
    })

    if (error) {
      const msg = error.message || ''
      if (msg.includes('404') || msg.includes('not found') || msg.includes('Function')) {
        throw new Error(
          'წაშლა ვერ მოხერხდა. Supabase SQL Editor-ში გაუშვი migration: supabase/migrations/20260610200000_delete_account_rpc.sql'
        )
      }
      throw error
    }

    if (data?.error) throw new Error(data.error)
    return
  }

  throw new Error(rpcError.message)
}

/** @deprecated use deleteAccount */
export const deleteAdminAccount = deleteAccount
