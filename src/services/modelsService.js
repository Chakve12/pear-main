import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { useUserStore } from '../store/useUserStore'
import { ensureModelPoints, deleteModelPoints } from './pointsService'

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

export function subscribeToModels(callback) {
  if (!isConfigured || !supabase) {
    callback(useUserStore.getState().models)
    return () => {}
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
