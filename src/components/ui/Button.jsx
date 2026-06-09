import { motion } from 'framer-motion'

const variants = {
  primary: 'text-white hover:opacity-90',
  secondary: 'border hover:opacity-90',
  ghost: 'hover:opacity-80',
  danger: 'bg-red-500/15 text-red-500 border border-red-500/30',
  luxury: 'bg-[#f5f0e8] text-[#1a1a1a] hover:bg-[#faf6ef]',
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  loading = false,
  disabled = false,
  style,
  ...props
}) {
  const variantStyle =
    variant === 'primary'
      ? { background: 'var(--accent)', ...style }
      : variant === 'secondary'
        ? { background: 'var(--bg-card)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', ...style }
        : variant === 'ghost'
          ? { color: 'var(--text-muted)', ...style }
          : style

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.01 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.99 } : {}}
      disabled={disabled || loading}
      style={variantStyle}
      className={`
        relative inline-flex items-center justify-center gap-2
        px-6 py-3 rounded-full font-medium text-sm
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  )
}
