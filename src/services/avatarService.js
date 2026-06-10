import { uploadImage } from './storage'
import { saveModel, saveModelAvatar } from './modelsService'
import { saveUserAvatar } from './userProfile'
import { logActivityEntry } from './activityService'
import { isUsingLocalAuth } from './authService'
import { useUserStore } from '../store/useUserStore'
import { isAdminRole } from '../utils/roles'

export async function uploadAvatarImage(file, ownerId, onProgress) {
  return uploadImage(file, ownerId, 'avatar', onProgress)
}

export async function changeModelAvatar(modelId, file) {
  const { url } = await uploadAvatarImage(file, modelId)
  const store = useUserStore.getState()
  const model = store.getModelById(modelId)
  if (!model) throw new Error('მოდელი ვერ მოიძებნა')

  const updated = { ...model, avatar: url }
  store.updateModel(modelId, { avatar: url })
  await saveModelAvatar(modelId, url)
  const activityText = `პროფილის ფოტო — ${model.name}`
  if (isUsingLocalAuth()) {
    store.logActivity(activityText, model.name)
  } else {
    await logActivityEntry(activityText, model.name)
  }
  return url
}

export async function changeUserAvatar(uid, file) {
  const { url } = await uploadAvatarImage(file, `user_${uid}`)
  const store = useUserStore.getState()
  store.setUserAvatar(url)
  await saveUserAvatar(uid, url)
  const userName = store.user?.displayName || 'მომხმარებელი'
  if (isUsingLocalAuth()) {
    store.logActivity('პროფილის ფოტო განახლდა', userName)
  } else {
    await logActivityEntry('პროფილის ფოტო განახლდა', userName)
  }
  return url
}

export function getProfileAvatar({ role, modelId, models, userAvatar }) {
  if (isAdminRole(role)) return userAvatar || null
  const model = models.find((m) => m.id === modelId)
  return model?.avatar || null
}

export function buildAvatarLookup(models = [], userProfiles = {}) {
  const byModelId = {}
  const byEmail = {}
  const byUid = {}

  for (const model of models) {
    if (model.id) byModelId[model.id] = model.avatar || null
    if (model.email) byEmail[model.email.toLowerCase()] = model.avatar || null
  }

  for (const [uid, profile] of Object.entries(userProfiles)) {
    byUid[uid] = profile.avatar || null
    if (profile.modelId && profile.avatar) {
      byModelId[profile.modelId] = profile.avatar
    }
    if (profile.email && profile.avatar) {
      byEmail[profile.email.toLowerCase()] = profile.avatar
    }
  }

  return { byModelId, byEmail, byUid }
}

export function resolveSenderAvatar(msg, lookup) {
  if (msg.senderAvatar) return msg.senderAvatar
  if (msg.senderModelId && lookup.byModelId[msg.senderModelId]) {
    return lookup.byModelId[msg.senderModelId]
  }
  if (msg.senderUid && lookup.byUid[msg.senderUid]) {
    return lookup.byUid[msg.senderUid]
  }
  if (msg.senderEmail && lookup.byEmail[msg.senderEmail.toLowerCase()]) {
    return lookup.byEmail[msg.senderEmail.toLowerCase()]
  }
  return null
}
