import { motion } from 'framer-motion'

const SIZES = {
  xs: 'w-8 h-8 text-sm',
  sm: 'w-10 h-10 text-base',
  md: 'w-14 h-14 text-xl',
  lg: 'w-20 h-20 sm:w-24 sm:h-24 text-3xl',
  xl: 'w-28 h-28 text-4xl',
}

export default function ModelAvatar({
  src,
  name,
  size = 'md',
  className = '',
  ring = false,
  animate = false,
  roundedFull = false,
}) {
  const letter = name?.trim()?.[0]?.toUpperCase()
  const fallback = letter && /[A-Zა-ჰ0-9]/.test(letter) ? letter : '🌸'
  const sizeClass = SIZES[size] || SIZES.md
  const radius = roundedFull ? 'rounded-full' : 'rounded-2xl'

  const inner = src ? (
    <img
      src={src}
      alt={name || 'პროფილი'}
      className="w-full h-full object-cover object-center"
    />
  ) : (
    <span className="select-none flex items-center justify-center w-full h-full leading-none text-center">
      {fallback}
    </span>
  )

  const boxStyle = {
    background: src ? 'transparent' : 'var(--accent-soft)',
    border: ring ? '2px solid var(--accent)' : '1px solid var(--border-medium)',
    color: 'var(--accent)',
  }

  const boxClass = `${sizeClass} ${radius} overflow-hidden flex items-center justify-center shrink-0 font-semibold ${className}`

  if (!animate) {
    return (
      <div className={boxClass} style={boxStyle}>
        {inner}
      </div>
    )
  }

  return (
    <motion.div
      animate={{ boxShadow: ['0 0 0 0 var(--accent-glow)', '0 0 0 12px transparent'] }}
      transition={{ duration: 2.5, repeat: Infinity }}
      className={boxClass}
      style={boxStyle}
    >
      {inner}
    </motion.div>
  )
}
