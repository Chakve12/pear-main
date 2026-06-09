import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '../../store/useThemeStore'
import brandImg from '../../assets/pear-brand.png'

export default function BrandBackground() {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
          style={{ background: 'var(--bg-app)' }}
        />
      </AnimatePresence>

      <motion.img
        src={brandImg}
        alt=""
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
        animate={{
          opacity: isDark ? 0.06 : 0.04,
          scale: isDark ? 1.05 : 1,
          filter: isDark ? 'blur(1px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: 'min(70vw, 520px)', maxWidth: '90%' }}
      />

      <motion.div
        className="absolute inset-0"
        animate={{
          background: isDark
            ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,168,124,0.08) 0%, transparent 60%)'
            : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,168,124,0.12) 0%, transparent 55%)',
        }}
        transition={{ duration: 0.8 }}
      />
    </div>
  )
}
