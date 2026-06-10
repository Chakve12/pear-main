import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'

const MAX_MESSAGES = 200
const MAX_TEXT_LENGTH = 2000

let localMessages = []
const localListeners = new Set()

function getLocalMessages() {
  return localMessages
}

function saveLocalMessages(messages) {
  localMessages = messages.slice(-MAX_MESSAGES)
  localListeners.forEach((fn) => fn(localMessages))
}

function rowToMessage(row) {
  return {
    id: row.id,
    text: row.text,
    senderUid: row.sender_uid,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    senderAvatar: row.sender_avatar,
    senderModelId: row.sender_model_id,
    senderEmail: row.sender_email,
    createdAt: row.created_at,
  }
}

export function sortMessagesChronologically(messages) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

export function subscribeToMessages(callback) {
  if (!isConfigured || !supabase) {
    callback(sortMessagesChronologically(getLocalMessages()))
    const listener = (messages) => callback(sortMessagesChronologically(messages))
    localListeners.add(listener)
    return () => {
      localListeners.delete(listener)
    }
  }

  const refresh = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(MAX_MESSAGES)

    if (error) {
      callback([])
      return
    }
    callback(sortMessagesChronologically((data || []).map(rowToMessage)))
  }

  refresh()

  const channel = supabase
    .channel('chat-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function sendMessage({
  text,
  senderUid,
  senderName,
  senderRole,
  senderAvatar = null,
  senderModelId = null,
  senderEmail = null,
}) {
  const trimmed = text.trim()
  if (!trimmed || !senderUid) return null
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new Error('შეტყობინება ძალიან გრძელია')
  }

  const message = {
    text: trimmed,
    sender_uid: senderUid,
    sender_name: senderName || 'მომხმარებელი',
    sender_role:
      senderRole === 'head_admin' ? 'head_admin' : senderRole === 'admin' ? 'admin' : 'model',
    sender_avatar: senderAvatar || null,
    sender_model_id: senderModelId || null,
    sender_email: senderEmail || null,
  }

  if (!isConfigured || !supabase) {
    const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const createdAt = new Date().toISOString()
    const stored = [
      ...getLocalMessages(),
      rowToMessage({ id, created_at: createdAt, ...message }),
    ]
    saveLocalMessages(stored)
    return rowToMessage({ id, created_at: createdAt, ...message })
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert(message)
    .select()
    .single()

  if (error) throw error
  return rowToMessage(data)
}

export async function deleteMessage(messageId, requesterUid) {
  if (!messageId || !requesterUid) throw new Error('შეტყობინება ვერ მოიძებნა')

  if (!isConfigured || !supabase) {
    const messages = getLocalMessages()
    const target = messages.find((m) => m.id === messageId)
    if (!target) throw new Error('შეტყობინება ვერ მოიძებნა')
    if (target.senderUid !== requesterUid) {
      throw new Error('მხოლოდ საკუთარი შეტყობინების წაშლა შეგიძლია')
    }
    saveLocalMessages(messages.filter((m) => m.id !== messageId))
    return
  }

  const { error } = await supabase.from('chat_messages').delete().eq('id', messageId)
  if (error) throw error
}

export async function deleteAllMessages() {
  if (!isConfigured || !supabase) {
    saveLocalMessages([])
    return
  }

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) throw error
}
