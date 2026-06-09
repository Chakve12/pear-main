import { motion } from 'framer-motion'

export const cardHover = {
  y: -4,
  boxShadow: 'var(--shadow-hover)',
}

export default function Card({
  children,
  className = '',
  hover = true,
  onClick,
  glow = false,
}) {
  return (
    <motion.div
      whileHover={hover ? cardHover : {}}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={`
        glass-card rounded-2xl p-6
        ${hover ? 'glass-card-hover cursor-pointer' : ''}
        ${glow ? 'ring-1 ring-[var(--accent-glow)]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}
