import { motion } from 'framer-motion'

export default function PearLogo({ size = 'md', animated = false, className = '' }) {
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' }

  return (
    <motion.div
      animate={animated ? { y: [0, -2, 0] } : {}}
      transition={{ duration: 3, repeat: Infinity }}
      className={`flex items-center gap-2 ${className}`}
    >
      <span className={size === 'sm' ? 'text-lg' : 'text-2xl'}>🌸</span>
      <div className="flex flex-col">
        <span className={`font-semibold tracking-tight ${sizes[size]}`} style={{ color: 'var(--text-primary)' }}>
          PEAR™
        </span>
        {size !== 'sm' && (
          <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
            Elite
          </span>
        )}
      </div>
    </motion.div>
  )
}
