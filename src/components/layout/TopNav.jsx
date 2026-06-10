import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Upload,
  Trophy,
  Megaphone,
  MessageCircle,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'
import PearLogo from '../ui/PearLogo'
import ThemeToggle from '../ui/ThemeToggle'
import { logOut } from '../../services/authService'
import { useUserStore } from '../../store/useUserStore'
import ModelAvatar from '../ui/ModelAvatar'
import { getProfileAvatar } from '../../services/avatarService'
import { isAdminRole, roleLabel } from '../../utils/roles'

const mainNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'დაფა' },
  { to: '/leaderboard', icon: Trophy, label: 'ლიდერბორდი' },
  { to: '/announcements', icon: Megaphone, label: 'განცხადებები' },
  { to: '/chat', icon: MessageCircle, label: 'ჩატი' },
]

export default function TopNav() {
  const navigate = useNavigate()
  const { user, role, modelId, clearUser, getModels, models, userAvatar } = useUserStore()
  const profileAvatar = getProfileAvatar({ role, modelId, models, userAvatar })

  const profileLink = isAdminRole(role) ? '/profile' : modelId ? `/models/${modelId}` : '/dashboard'

  const [mobileOpen, setMobileOpen] = useState(false)
  const [modelsOpen, setModelsOpen] = useState(false)

  const handleLogout = async () => {
    await logOut()
    clearUser()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'nav-link-active'
        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
    }`

  const adminLinks = [
    { to: '/models', label: 'ყველა მოდელი', icon: Users },
    { to: '/uploads', label: 'ატვირთვები', icon: Upload },
    { to: '/admin', label: 'ადმინი', icon: Shield },
  ]

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{
        background: 'var(--nav-bg)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <NavLink to="/dashboard" className="shrink-0">
            <PearLogo size="sm" animated={false} />
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {mainNav.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <item.icon size={16} strokeWidth={1.5} />
                {item.label}
              </NavLink>
            ))}

            <div className="relative">
              <button
                onClick={() => setModelsOpen(!modelsOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  modelsOpen ? 'nav-link-active' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Users size={16} strokeWidth={1.5} />
                მოდელები
                <ChevronDown size={14} className={`transition-transform ${modelsOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {modelsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setModelsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-56 rounded-2xl py-2 z-50 shadow-xl border"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
                    >
                      <NavLink
                        to="/models"
                        onClick={() => setModelsOpen(false)}
                        className="block px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
                      >
                        ყველა მოდელი
                      </NavLink>
                      {models.map((m) => (
                        <NavLink
                          key={m.id}
                          to={`/models/${m.id}`}
                          onClick={() => setModelsOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                        >
                          <ModelAvatar src={m.avatar} name={m.name} size="xs" className="!rounded-lg !w-7 !h-7" />
                          <span className="truncate">
                            {m.name}
                            {!isAdminRole(role) && m.id === modelId && (
                              <span className="ml-1 text-[10px] text-[var(--accent)]">(შენი)</span>
                            )}
                          </span>
                        </NavLink>
                      ))}
                      {models.length === 0 && (
                        <p className="px-4 py-2 text-xs text-[var(--text-muted)]">მოდელები ცარიელია</p>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {isAdminRole(role) &&
              adminLinks.slice(1).map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <item.icon size={16} strokeWidth={1.5} />
                  {item.label}
                </NavLink>
              ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l" style={{ borderColor: 'var(--border-subtle)' }}>
              <NavLink to={profileLink} title="ჩემი პროფილი">
                <ModelAvatar
                  src={profileAvatar}
                  name={user?.displayName || user?.email}
                  size="xs"
                  roundedFull
                />
              </NavLink>
              <div className="hidden md:block">
                <p className="text-sm font-medium leading-none text-[var(--text-primary)]">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-[10px] mt-0.5 text-[var(--text-muted)]">
                  {roleLabel(role)}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="hidden sm:flex p-2 rounded-full text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-hover)] transition-all"
              title="გასვლა"
            >
              <LogOut size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-full text-[var(--text-primary)]"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--nav-bg)' }}
          >
            <div className="px-4 py-4 space-y-1">
              {mainNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                      isActive ? 'nav-link-active' : 'text-[var(--text-muted)]'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
              {isAdminRole(role) &&
                adminLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                        isActive ? 'nav-link-active' : 'text-[var(--text-muted)]'
                      }`
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              <NavLink
                to="/models"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                    isActive ? 'nav-link-active' : 'text-[var(--text-muted)]'
                  }`
                }
              >
                <Users size={18} />
                ყველა მოდელი
              </NavLink>
              {models.map((m) => (
                <NavLink
                  key={m.id}
                  to={`/models/${m.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--text-muted)]"
                >
                  <ModelAvatar src={m.avatar} name={m.name} size="xs" className="!rounded-lg !w-7 !h-7" />
                  {m.name}
                  {!isAdminRole(role) && m.id === modelId && (
                    <span className="text-[10px] text-[var(--accent)]">(შენი)</span>
                  )}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-red-500"
              >
                <LogOut size={18} />
                გასვლა
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
