import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'

const MAX_ENTRIES = 100

function rowToEntry(row) {
  return {
    id: row.id,
    action: row.action,
    user: row.user_name,
    timestamp: row.created_at,
  }
}

export async function fetchActivityLog() {
  if (!isConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MAX_ENTRIES)
  if (error) throw error
  return (data || []).map(rowToEntry)
}

export async function logActivityEntry(action, user = 'სისტემა') {
  if (!isConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('activity_log')
    .insert({ action, user_name: user })
    .select()
    .single()
  if (error) throw error
  return rowToEntry(data)
}

export function subscribeToActivityLog(callback) {
  if (!isConfigured || !supabase) {
    return () => {}
  }

  const refresh = async () => {
    try {
      callback((await fetchActivityLog()) || [])
    } catch {
      callback([])
    }
  }

  refresh()

  const channel = supabase
    .channel('activity-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
