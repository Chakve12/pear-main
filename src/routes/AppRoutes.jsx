import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Loader from '../components/ui/Loader'
import { useUserStore } from '../store/useUserStore'

const Login = lazy(() => import('../pages/Login'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const ModelsOverview = lazy(() => import('../pages/ModelsOverview'))
const UploadsOverview = lazy(() => import('../pages/UploadsOverview'))
const ModelProfile = lazy(() => import('../pages/ModelProfile'))
const Admin = lazy(() => import('../pages/Admin'))
const Leaderboard = lazy(() => import('../pages/Leaderboard'))
const Announcements = lazy(() => import('../pages/Announcements'))
const Chat = lazy(() => import('../pages/Chat'))
const Profile = lazy(() => import('../pages/Profile'))

function ProtectedRoute({ children }) {
  const user = useUserStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const user = useUserStore((s) => s.user)
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function FallbackRedirect() {
  const user = useUserStore((s) => s.user)
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

export default function AppRoutes() {
  const location = useLocation()

  return (
    <Suspense fallback={<Loader fullScreen text="იტვირთება..." />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/models" element={<ModelsOverview />} />
            <Route path="/uploads" element={<UploadsOverview />} />
            <Route path="/models/:id" element={<ModelProfile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="/signup" element={<Navigate to="/login" replace />} />
          <Route path="/" element={<FallbackRedirect />} />
          <Route path="*" element={<FallbackRedirect />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
