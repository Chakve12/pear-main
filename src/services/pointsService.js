import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'

function rowsToMap(rows) {
  const points = {}
  for (const row of rows || []) {
    points[row.model_id] = row.points
  }
  return points
}

export async function fetchAllPoints() {
  if (!isConfigured || !supabase) return null
  const { data, error } = await supabase.from('model_points').select('model_id, points')
  if (error) throw error
  return rowsToMap(data)
}

export async function ensureModelPoints(modelId, points = 0) {
  if (!isConfigured || !supabase || !modelId) return
  const { error } = await supabase.from('model_points').upsert({
    model_id: modelId,
    points: Math.max(0, points),
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function setModelPoints(modelId, value) {
  if (!isConfigured || !supabase) return
  const points = Math.max(0, value)
  const { error } = await supabase.from('model_points').upsert({
    model_id: modelId,
    points,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
  return points
}

export async function adjustModelPoints(modelId, amount) {
  if (!isConfigured || !supabase) return null

  const { data: current, error: readError } = await supabase
    .from('model_points')
    .select('points')
    .eq('model_id', modelId)
    .maybeSingle()

  if (readError) throw readError

  const next = Math.max(0, (current?.points || 0) + amount)
  await setModelPoints(modelId, next)
  return next
}

export async function deleteModelPoints(modelId) {
  if (!isConfigured || !supabase) return
  const { error } = await supabase.from('model_points').delete().eq('model_id', modelId)
  if (error) throw error
}

export function subscribeToPoints(callback) {
  if (!isConfigured || !supabase) {
    return () => {}
  }

  const refresh = async () => {
    try {
      callback((await fetchAllPoints()) || {})
    } catch {
      callback({})
    }
  }

  refresh()

  const channel = supabase
    .channel('points-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'model_points' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
