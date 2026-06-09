import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import ToastProvider from './components/ui/ToastProvider'
import SplashScreen from './components/ui/SplashScreen'
import ErrorBoundary from './components/ErrorBoundary'
import Loader from './components/ui/Loader'
import { subscribeToAuth } from './services/firebaseAuth'
import { fetchAllModels, saveModel, subscribeToModels } from './services/modelsService'
import { subscribeToUserProfiles } from './services/usersService'
import { useUserStore } from './store/useUserStore'
import { useThemeStore, applyTheme } from './store/useThemeStore'
import { isAdminRole } from './utils/roles'

export default function App() {
  const [authLoading, setAuthLoading] = useState(true)
  const user = useUserStore((s) => s.user)
  const { setUser, clearUser, showSplash, dismissSplash, ensureModelFromProfile, syncModels, setUserProfiles } =
    useUserStore()
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
    })

    return () => {
      unsubModels()
      unsubUsers()
    }
  }, [user, setUserProfiles])

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
