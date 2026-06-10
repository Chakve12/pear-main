import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: '1',
    title: 'კეთილი იყოს მობრძანება PEAR™ Elite-ში',
    content: 'შენი ელიტური სამუშაო სისტემა აქტიურია. ატვირთე საუკეთესო ნამუშევრები და ავიდე ლიდერბორდში.',
    pinned: true,
    createdAt: new Date().toISOString(),
    author: 'ადმინისტრატორი',
  },
]

const DEFAULT_ACTIVITY = [
  { id: '1', action: 'სისტემა გაეშვა', user: 'ადმინისტრატორი', timestamp: new Date().toISOString() },
]

export function buildLeaderboard(models, points) {
  return models
    .map((model) => ({
      ...model,
      points: points[model.id] || 0,
    }))
    .sort((a, b) => b.points - a.points)
}

export function slugifyModelId(name, email) {
  const fromEmail = (email?.split('@')[0] || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const fromName = (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 24)
  return fromName || fromEmail || `model_${Date.now()}`
}

export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      modelId: null,
      userAvatar: null,
      userProfiles: {},
      profilesLoaded: false,
      showSplash: false,
      models: [],
      points: {},
      announcements: [...DEFAULT_ANNOUNCEMENTS],
      activityLog: [...DEFAULT_ACTIVITY],
      editedPhotos: {},

      setUser: (user, role, modelId) =>
        set({ user, role, modelId, userAvatar: user?.avatar || null }),
      setUserAvatar: (avatar) => set({ userAvatar: avatar }),
      setUserProfiles: (userProfiles) => set({ userProfiles, profilesLoaded: true }),
      clearUser: () =>
        set({ user: null, role: null, modelId: null, userAvatar: null, userProfiles: {}, profilesLoaded: false }),
      triggerSplash: () => set({ showSplash: true }),
      dismissSplash: () => set({ showSplash: false }),

      getModels: () => get().models,
      getModelById: (id) => get().models.find((m) => m.id === id),

      resolveModel: (id) => get().models.find((m) => m.id === id) ?? null,

      ensureModelFromProfile: (profile) => {
        if (!profile?.modelId) return null
        const existing = get().models.find((m) => m.id === profile.modelId)
        if (existing) return existing
        const model = {
          id: profile.modelId,
          name: profile.displayName || profile.email?.split('@')[0] || profile.modelId,
          email: profile.email?.toLowerCase() || '',
          tagline: 'ელიტური მოდელი',
          avatar: null,
        }
        set((state) => ({
          models: [...state.models, model],
          points: { ...state.points, [model.id]: state.points[model.id] ?? 0 },
        }))
        return model
      },

      syncModels: (remoteModels) => {
        if (!remoteModels?.length) return
        set((state) => {
          const merged = [...state.models]
          const points = { ...state.points }
          for (const remote of remoteModels) {
            const idx = merged.findIndex((m) => m.id === remote.id)
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...remote }
            } else {
              merged.push(remote)
              points[remote.id] = points[remote.id] ?? 0
            }
          }
          return { models: merged, points }
        })
      },

      syncPoints: (remotePoints) => {
        if (!remotePoints || !Object.keys(remotePoints).length) return
        set((state) => ({
          points: { ...state.points, ...remotePoints },
        }))
      },

      syncAnnouncements: (remoteAnnouncements) => {
        if (!remoteAnnouncements?.length) return
        set({ announcements: remoteAnnouncements })
      },

      syncActivityLog: (remoteLog) => {
        if (!remoteLog?.length) return
        set({ activityLog: remoteLog })
      },

      addModel: (model) => {
        const exists = get().models.some((m) => m.id === model.id || m.email === model.email)
        if (exists) {
          set((state) => ({
            models: state.models.map((m) =>
              m.id === model.id || m.email === model.email ? { ...m, ...model } : m
            ),
          }))
          return get().getModelById(model.id) || model
        }
        set((state) => ({
          models: [...state.models, model],
          points: { ...state.points, [model.id]: state.points[model.id] ?? 0 },
        }))
        return model
      },

      updateModel: (id, updates) =>
        set((state) => ({
          models: state.models.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      removeModel: (id) =>
        set((state) => {
          const { [id]: _, ...restPoints } = state.points
          return {
            models: state.models.filter((m) => m.id !== id),
            points: restPoints,
          }
        }),

      addPoints: (modelId, amount) => {
        const current = get().points[modelId] || 0
        const newPoints = Math.max(0, current + amount)
        const modelName = get().getModelById(modelId)?.name || modelId
        set((state) => ({
          points: { ...state.points, [modelId]: newPoints },
          activityLog: [
            {
              id: Date.now().toString(),
              action: `${amount > 0 ? '+' : ''}${amount} ქულა — ${modelName}`,
              user: 'ადმინი',
              timestamp: new Date().toISOString(),
            },
            ...state.activityLog,
          ],
        }))
        return newPoints
      },

      setPoints: (modelId, value) => {
        const modelName = get().getModelById(modelId)?.name || modelId
        set((state) => ({
          points: { ...state.points, [modelId]: Math.max(0, value) },
          activityLog: [
            {
              id: Date.now().toString(),
              action: `ქულა დაყენდა ${modelName}-სთვის: ${value}`,
              user: 'ადმინი',
              timestamp: new Date().toISOString(),
            },
            ...state.activityLog,
          ],
        }))
      },

      getLeaderboard: () => buildLeaderboard(get().models, get().points),

      addAnnouncement: (announcement) =>
        set((state) => ({
          announcements: [
            {
              ...announcement,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
              author: 'ადმინისტრატორი',
            },
            ...state.announcements,
          ],
          activityLog: [
            {
              id: Date.now().toString(),
              action: `განცხადება: ${announcement.title}`,
              user: 'ადმინი',
              timestamp: new Date().toISOString(),
            },
            ...state.activityLog,
          ],
        })),

      togglePinAnnouncement: (id) =>
        set((state) => ({
          announcements: state.announcements.map((a) =>
            a.id === id ? { ...a, pinned: !a.pinned } : a
          ),
        })),

      deleteAnnouncement: (id) =>
        set((state) => ({
          announcements: state.announcements.filter((a) => a.id !== id),
        })),

      logActivity: (action, user = 'სისტემა') =>
        set((state) => ({
          activityLog: [
            {
              id: Date.now().toString(),
              action,
              user,
              timestamp: new Date().toISOString(),
            },
            ...state.activityLog,
          ],
        })),

      addEditedPhoto: (modelId, photo) =>
        set((state) => ({
          editedPhotos: {
            ...state.editedPhotos,
            [modelId]: [...(state.editedPhotos[modelId] || []), photo],
          },
        })),
    }),
    {
      name: 'pear-elite-store-v2',
      partialize: (state) => ({
        models: state.models,
        points: state.points,
        announcements: state.announcements,
        activityLog: state.activityLog,
        editedPhotos: state.editedPhotos,
      }),
    }
  )
)
