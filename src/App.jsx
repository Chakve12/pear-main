import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import ToastProvider from './components/ui/ToastProvider'
import SplashScreen from './components/ui/SplashScreen'
import ErrorBoundary from './components/ErrorBoundary'
import Loader from './components/ui/Loader'
import { subscribeToAuth } from './services/authService'
import { fetchAllModels, saveModel, subscribeToModels } from './services/modelsService'
import { subscribeToUserProfiles } from './services/usersService'
import { fetchAllPoints, ensureModelPoints, subscribeToPoints } from './services/pointsService'
import {
  createAnnouncement,
  fetchAllAnnouncements,
  subscribeToAnnouncements,
} from './services/announcementsService'
import { fetchActivityLog, logActivityEntry, subscribeToActivityLog } from './services/activityService'
import { useUserStore } from './store/useUserStore'
import { useThemeStore, applyTheme } from './store/useThemeStore'
import { isAdminRole } from './utils/roles'

export default function App() {
  const [authLoading, setAuthLoading] = useState(true)
  const user = useUserStore((s) => s.user)
  const {
    setUser,
    clearUser,
    showSplash,
    dismissSplash,
    ensureModelFromProfile,
    syncModels,
    syncPoints,
    syncAnnouncements,
    syncActivityLog,
    setUserProfiles,
  } = useUserStore()
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (profile) => {
      if (profile) {
        setUser(profile, profile.role, profile.modelId)
        if (profile.avatar) {
          useUserStore.getState().setUserAvatar(profile.avatar)
        }
        if (profile.role === 'model') {
          ensureModelFromProfile(profile)
        }
        try {
          const remoteModels = await fetchAllModels()
          if (remoteModels) {
            syncModels(remoteModels)
            if (isAdminRole(profile.role)) {
              const localModels = useUserStore.getState().models
              const remoteIds = new Set(remoteModels.map((m) => m.id))
              await Promise.all(
                localModels
                  .filter((m) => !remoteIds.has(m.id))
                  .map((m) => saveModel(m))
              )
            }
          }

          const remotePoints = await fetchAllPoints()
          if (remotePoints) {
            syncPoints(remotePoints)
            if (isAdminRole(profile.role)) {
              const localPoints = useUserStore.getState().points
              await Promise.all(
                Object.entries(localPoints)
                  .filter(([modelId]) => remotePoints[modelId] == null)
                  .map(([modelId, pts]) => ensureModelPoints(modelId, pts))
              )
            }
          }

          const remoteAnnouncements = await fetchAllAnnouncements()
          if (remoteAnnouncements) {
            if (remoteAnnouncements.length) {
              syncAnnouncements(remoteAnnouncements)
            } else if (isAdminRole(profile.role)) {
              const localAnnouncements = useUserStore.getState().announcements
              await Promise.all(
                localAnnouncements.map((ann) =>
                  createAnnouncement({
                    title: ann.title,
                    content: ann.content,
                    pinned: ann.pinned,
                    author: ann.author,
                  })
                )
              )
            }
          }

          const remoteActivity = await fetchActivityLog()
          if (remoteActivity) {
            if (remoteActivity.length) {
              syncActivityLog(remoteActivity)
            } else if (isAdminRole(profile.role)) {
              const localActivity = useUserStore.getState().activityLog
              await Promise.all(
                localActivity.map((entry) => logActivityEntry(entry.action, entry.user))
              )
            }
          }

          if (profile.role === 'model') {
            ensureModelFromProfile(profile)
          }
        } catch {
          /* local / offline mode */
        }
      } else {
        clearUser()
      }
      setAuthLoading(false)
    })
    return unsubscribe
  }, [setUser, clearUser, ensureModelFromProfile, syncModels])

  useEffect(() => {
    if (!user) return

    const unsubModels = subscribeToModels((remoteModels) => {
      if (remoteModels?.length) {
        useUserStore.getState().syncModels(remoteModels)
      }
    })

    const unsubUsers = subscribeToUserProfiles((profiles) => {
      setUserProfiles(profiles)
      const mine = profiles[user.uid]
      if (mine?.avatar) {
        useUserStore.getState().setUserAvatar(mine.avatar)
      }
      for (const profile of Object.values(profiles)) {
        if (profile.role === 'model' && profile.modelId) {
          ensureModelFromProfile(profile)
        }
      }
    })

    const unsubPoints = subscribeToPoints((remotePoints) => {
      syncPoints(remotePoints)
    })

    const unsubAnnouncements = subscribeToAnnouncements((remoteAnnouncements) => {
      if (remoteAnnouncements?.length) {
        syncAnnouncements(remoteAnnouncements)
      }
    })

    const unsubActivity = subscribeToActivityLog((remoteLog) => {
      if (remoteLog?.length) {
        syncActivityLog(remoteLog)
      }
    })

    return () => {
      unsubModels()
      unsubUsers()
      unsubPoints()
      unsubAnnouncements()
      unsubActivity()
    }
  }, [user, setUserProfiles, syncPoints, syncAnnouncements, syncActivityLog, ensureModelFromProfile])

  if (authLoading) {
    return <Loader fullScreen text="იტვირთება..." />
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider />
        {showSplash && <SplashScreen onComplete={dismissSplash} />}
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
