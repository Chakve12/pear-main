import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

export default function BeforeAfterSlider({ before, after, label }) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef(null)

  const handleMove = (clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, x)))
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative rounded-2xl overflow-hidden neon-border aspect-[4/5] before-after-slider"
      ref={containerRef}
      onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
    >
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={before}
          alt="Before"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: containerRef.current?.offsetWidth || '100%' }}
          loading="lazy"
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] cursor-ew-resize z-10"
        style={{ left: `${position}%` }}
        onMouseDown={(e) => {
          const move = (ev) => handleMove(ev.clientX)
          const up = () => {
            window.removeEventListener('mousemove', move)
            window.removeEventListener('mouseup', up)
          }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <span className="text-xs text-black">⟷</span>
        </div>
      </div>

      {label && (
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg glass text-xs">
          {label}
        </div>
      )}
    </motion.div>
  )
}
