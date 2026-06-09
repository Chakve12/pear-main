import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import ModelAvatar from './ModelAvatar'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024

export default function AvatarPicker({
  src,
  name,
  size = 'lg',
  editable = false,
  onUpload,
  animate = false,
  roundedFull = false,
  className = '',
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !onUpload) return

    if (!ALLOWED.includes(file.type)) {
      toast.error('მხოლოდ JPG, PNG, WebP ან GIF')
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error('ფაილი 5MB-ზე მეტია')
      return
    }

    setUploading(true)
    try {
      await onUpload(file)
      toast.success('პროფილის ფოტო განახლდა')
    } catch {
      toast.error('ფოტოს ატვირთვა ვერ მოხერხდა')
    } finally {
      setUploading(false)
    }
  }

  if (!editable) {
    return (
      <ModelAvatar src={src} name={name} size={size} animate={animate} roundedFull={roundedFull} className={className} ring />
    )
  }

  return (
    <div className={`relative group ${className}`}>
      <ModelAvatar src={src} name={name} size={size} animate={animate} roundedFull={roundedFull} ring />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`absolute inset-0 ${roundedFull ? 'rounded-full' : 'rounded-2xl'} flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300`}
        style={{ background: 'rgba(0,0,0,0.45)' }}
        title="პროფილის ფოტოს შეცვლა"
      >
        {uploading ? (
          <Loader2 size={22} className="text-white animate-spin" />
        ) : (
          <>
            <Camera size={22} className="text-white" />
            <span className="text-[10px] text-white/90 font-medium">შეცვლა</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
      {size !== 'xs' && (
        <motion.div
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center pointer-events-none"
          style={{ background: 'var(--accent)', border: '2px solid var(--bg-card)' }}
          whileHover={{ scale: 1.05 }}
        >
          <Camera size={12} className="text-white" />
        </motion.div>
      )}
    </div>
  )
}
