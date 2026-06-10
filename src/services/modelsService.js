import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { useUserStore } from '../store/useUserStore'
import { ensureModelPoints, deleteModelPoints } from './pointsService'

const STORE_KEY = 'pear-elite-store-v2'

function rowToModel(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    tagline: row.tagline || 'ელიტური მოდელი',
    avatar: row.avatar || null,
    updatedAt: row.updated_at,
  }
}

export async function fetchAllModels() {
  if (!isConfigured || !supabase) return null
  const { data, error } = await supabase.from('models').select('*')
  if (error) throw error
  return (data || []).map(rowToModel)
}

export async function saveModel(model) {
  if (!isConfigured || !supabase) return
  const { error } = await supabase.from('models').upsert({
    id: model.id,
    name: model.name,
    email: model.email,
    tagline: model.tagline || 'ელიტური მოდელი',
    avatar: model.avatar || null,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
  const localPoints = useUserStore.getState().points[model.id] ?? 0
  await ensureModelPoints(model.id, localPoints)
}

export async function saveModelAvatar(modelId, avatarUrl) {
  if (!isConfigured || !supabase) return
  const { error } = await supabase
    .from('models')
    .update({ avatar: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', modelId)
  if (error) throw error
}

export async function deleteModel(modelId) {
  if (!isConfigured || !supabase) return
  const { error } = await supabase.from('models').delete().eq('id', modelId)
  if (error) throw error
  await deleteModelPoints(modelId)
}

/** @deprecated use deleteModel */
export const deleteModelFromFirestore = deleteModel

function readLocalPersistedModels() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return useUserStore.getState().models
    const parsed = JSON.parse(raw)
    return parsed?.state?.models || useUserStore.getState().models
  } catch {
    return useUserStore.getState().models
  }
}

export function subscribeToModels(callback) {
  if (!isConfigured || !supabase) {
    callback(readLocalPersistedModels())
    const onStorage = (e) => {
      if (e.key === STORE_KEY) callback(readLocalPersistedModels())
    }
    window.addEventListener('storage', onStorage)
    const interval = setInterval(() => callback(readLocalPersistedModels()), 2000)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(interval)
    }
  }

  const refresh = async () => {
    try {
      const models = await fetchAllModels()
      callback(models || [])
    } catch {
      callback([])
    }
  }

  refresh()

  const channel = supabase
    .channel('models-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'models' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
