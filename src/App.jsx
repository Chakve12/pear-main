import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import ToastProvider from './components/ui/ToastProvider'
import SplashScreen from './components/ui/SplashScreen'
import ErrorBoundary from './components/ErrorBoundary'
import Loader from './components/ui/Loader'
import { subscribeToAuth } from './services/authService'
import { fetchAllModels, subscribeToModels } from './services/modelsService'
import { subscribeToUserProfiles } from './services/usersService'
import { fetchAllPoints, subscribeToPoints } from './services/pointsService'
import { fetchAllAnnouncements, subscribeToAnnouncements } from './services/announcementsService'
import { fetchActivityLog, subscribeToActivityLog } from './services/activityService'
import { clearLegacyStorage } from './services/clearLegacyStorage'
import { isConfigured } from './services/supabaseConfig'
import { useUserStore } from './store/useUserStore'
import { useThemeStore, applyTheme } from './store/useThemeStore'

export default function App() {
  const [authLoading, setAuthLoading] = useState(true)
  const user = useUserStore((s) => s.user)
  const {
    setUser,
    clearUser,
    showSplash,
    dismissSplash,
    syncModels,
    syncPoints,
    syncAnnouncements,
    syncActivityLog,
    setUserProfiles,
  } = useUserStore()
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    if (isConfigured) {
      clearLegacyStorage()
    }
  }, [])

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
        try {
          const remoteModels = await fetchAllModels()
          if (remoteModels) syncModels(remoteModels)

          const remotePoints = await fetchAllPoints()
          if (remotePoints) syncPoints(remotePoints)

          const remoteAnnouncements = await fetchAllAnnouncements()
          if (remoteAnnouncements) syncAnnouncements(remoteAnnouncements)

          const remoteActivity = await fetchActivityLog()
          if (remoteActivity) syncActivityLog(remoteActivity)
        } catch {
          /* local / offline mode */
        }
      } else {
        clearUser()
      }
      setAuthLoading(false)
    })
    return unsubscribe
  }, [setUser, clearUser, syncModels, syncPoints, syncAnnouncements, syncActivityLog])

  useEffect(() => {
    if (!user) return

    const unsubModels = subscribeToModels((remoteModels) => {
      useUserStore.getState().syncModels(remoteModels ?? [])
    })

    const unsubUsers = subscribeToUserProfiles((profiles) => {
      setUserProfiles(profiles)
      const mine = profiles[user.uid]
      if (mine?.avatar) {
        useUserStore.getState().setUserAvatar(mine.avatar)
      }
    })

    const unsubPoints = subscribeToPoints((remotePoints) => {
      syncPoints(remotePoints ?? {})
    })

    const unsubAnnouncements = subscribeToAnnouncements((remoteAnnouncements) => {
      syncAnnouncements(remoteAnnouncements ?? [])
    })

    const unsubActivity = subscribeToActivityLog((remoteLog) => {
      syncActivityLog(remoteLog ?? [])
    })

    return () => {
      unsubModels()
      unsubUsers()
      unsubPoints()
      unsubAnnouncements()
      unsubActivity()
    }
  }, [user, setUserProfiles, syncPoints, syncAnnouncements, syncActivityLog])

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
