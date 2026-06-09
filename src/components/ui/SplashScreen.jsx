import { motion } from 'framer-motion'
import PearLogo from './PearLogo'

export default function SplashScreen({ onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2.2, duration: 0.6 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'var(--bg-app)' }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <PearLogo size="lg" />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-[var(--text-muted)] text-sm"
        >
          მოდელების მართვის პლატფორმა
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
