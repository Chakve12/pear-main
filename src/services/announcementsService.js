import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'

function rowToAnnouncement(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    pinned: row.pinned,
    author: row.author,
    createdAt: row.created_at,
  }
}

export async function fetchAllAnnouncements() {
  if (!isConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(rowToAnnouncement)
}

export async function createAnnouncement({ title, content, pinned = false, author = 'ადმინისტრატორი' }) {
  if (!isConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('announcements')
    .insert({ title, content, pinned, author })
    .select()
    .single()
  if (error) throw error
  return rowToAnnouncement(data)
}

export async function toggleAnnouncementPin(id, pinned) {
  if (!isConfigured || !supabase) return
  const { error } = await supabase.from('announcements').update({ pinned }).eq('id', id)
  if (error) throw error
}

export async function deleteAnnouncement(id) {
  if (!isConfigured || !supabase) return
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}

export function subscribeToAnnouncements(callback) {
  if (!isConfigured || !supabase) {
    return () => {}
  }

  const refresh = async () => {
    try {
      callback((await fetchAllAnnouncements()) || [])
    } catch {
      callback([])
    }
  }

  refresh()

  const channel = supabase
    .channel('announcements-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
