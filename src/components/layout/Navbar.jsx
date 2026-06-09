import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, User } from 'lucide-react'
import PearLogo from '../ui/PearLogo'
import { useUserStore } from '../../store/useUserStore'
import { useNavigate } from 'react-router-dom'

const ROLE_LABELS = { admin: 'ადმინი', model: 'მოდელი' }

export default function Navbar({ onSearch }) {
  const { user, role, points, modelId, models } = useUserStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const userPoints = modelId ? points[modelId] || 0 : null

  const handleSearch = (e) => {
    e.preventDefault()
    const q = query.toLowerCase().trim()
    if (!q) return

    const model = models.find(
      (m) => m.name.toLowerCase().includes(q) || m.id.includes(q)
    )
    if (model) {
      navigate(`/models/${model.id}`)
      setQuery('')
      setSearchOpen(false)
      return
    }

    onSearch?.(q)
    setSearchOpen(false)
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-black/[0.06]"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4 lg:hidden">
          <PearLogo size="sm" animated={false} />
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-pear-muted">სისტემა აქტიურია</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 rounded-full hover:bg-black/[0.04] text-pear-muted hover:text-pear-text transition-all"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            <AnimatePresence>
              {searchOpen && (
                <motion.form
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onSubmit={handleSearch}
                  className="absolute right-0 top-full mt-2 w-72"
                >
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="მოდელის ძებნა..."
                    className="w-full px-4 py-2.5 rounded-full border border-black/10 bg-white text-sm focus:outline-none focus:border-black/30"
                  />
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <button className="p-2.5 rounded-full hover:bg-black/[0.04] text-pear-muted relative">
            <Bell size={18} strokeWidth={1.5} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-pear-coral rounded-full" />
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-black/[0.08]">
            {userPoints !== null && (
              <motion.span
                key={userPoints}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/5"
              >
                {userPoints} ქულა
              </motion.span>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pear-gradient flex items-center justify-center text-sm">
                🌸
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-[10px] text-pear-muted mt-0.5">
                  {ROLE_LABELS[role] || role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
