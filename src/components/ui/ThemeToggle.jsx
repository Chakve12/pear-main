import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'ღია რეჟიმი' : 'მუქი რეჟიმი'}
      className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-500 ${className}`}
      style={{ background: 'var(--toggle-bg)' }}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute top-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
        style={{
          background: 'var(--toggle-knob)',
          left: isDark ? 'calc(100% - 1.75rem)' : '0.25rem',
        }}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          {isDark ? (
            <Moon size={13} style={{ color: 'var(--toggle-icon)' }} />
          ) : (
            <Sun size={13} style={{ color: 'var(--toggle-icon)' }} />
          )}
        </motion.div>
      </motion.div>
    </button>
  )
}
