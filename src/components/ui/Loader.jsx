import { motion } from 'framer-motion'

export function PearLoader({ size = 'md', text }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
          filter: ['blur(0px)', 'blur(2px)', 'blur(0px)'],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className={`${sizes[size]} flex items-center justify-center text-2xl`}
      >
        🌸
      </motion.div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-[var(--text-muted)]"
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return <div className={`skeleton rounded-2xl ${className}`} />
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  )
}

export default function Loader({ fullScreen = false, text = 'Loading...' }) {
  const content = <PearLoader text={text} />

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
        style={{ background: 'color-mix(in srgb, var(--bg-app) 85%, transparent)' }}
      >
        {content}
      </div>
    )
  }

  return <div className="flex items-center justify-center py-20">{content}</div>
}
